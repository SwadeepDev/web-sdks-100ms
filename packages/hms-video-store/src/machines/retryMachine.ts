import { assign, createMachine, interpret, send } from 'xstate';
import { HMSConnectionRole } from '../connection/model';
import { HMSException } from '../error/HMSException';
import { TrackState } from '../notification-manager';
import JsonRpcSignal from '../signal/jsonrpc';
import { API_DATA_CHANNEL } from '../utils/constants';

export const peerConnectionMachine = (config: RTCConfiguration, signal: JsonRpcSignal) =>
  createMachine<{
    connection: RTCPeerConnection | null;
    candidates: Set<RTCIceCandidateInit>;
    trackStates: Map<string, TrackState>;
    connectionState: RTCPeerConnectionState;
  }>({
    id: 'peerConnectionMachine',
    initial: 'init',
    context: {
      connection: null,
      candidates: new Set(),
      trackStates: new Map<string, TrackState>(),
      connectionState: 'new',
    },
    on: {
      connectionState: {
        actions: context => {
          if (context.connection) {
            context.connectionState = context.connection.connectionState;
          }
        },
      },
      trickle: {
        actions: (context, event) => {
          if (!context.connection?.remoteDescription) {
            context.candidates.add(event.iceCandidate);
          } else {
            context.connection.addIceCandidate(event.iceCandidate);
          }
        },
      },
      retry: 'retry',
      join: 'join',
      failure: 'failure',
      negotiate: 'negotiate',
      publish: {
        actions: async (context, event) => {
          const { track } = event;
          track.publishedTrackId = track.getTrackIDBeingSent();
          context.trackStates.set(track.publishedTrackId, new TrackState(track));
          console.error('publish called');
          context.connection?.addTransceiver(track.nativeTrack, {
            streams: [track.stream.nativeStream],
            direction: 'sendonly',
            sendEncodings: [{ active: true }],
          });
        },
      },
    },
    states: {
      init: {
        invoke: {
          src: context => async send => {
            console.error({ config }, 'creating connection');
            context.connection = new RTCPeerConnection(config);
            context.connection.createDataChannel(API_DATA_CHANNEL, {
              protocol: 'SCTP',
            });
            context.connection.onconnectionstatechange = () => {
              if (context.connection) {
                console.error('connectionstate', context.connection.connectionState);
                send({ type: 'connectionState' });
                switch (context.connection.connectionState) {
                  case 'disconnected':
                  case 'failed':
                    send({ type: 'retry' });
                    break;
                  case 'closed':
                    send({ type: 'failure' });
                    break;
                  default:
                    break;
                }
              }
            };

            context.connection.onicecandidate = ({ candidate }) => {
              if (candidate) {
                signal.trickle(HMSConnectionRole.Publish, candidate);
              }
            };
            send({ type: 'join' });
          },
          onError: {
            actions: (_, event) => {
              console.error('error', event.data);
            },
          },
        },
      },
      retry: {
        invoke: {
          src: () => send => {
            const retryMachine = createRetryMachine(() => send({ type: 'negotiate', iceRestart: true }));
            const service = interpret(retryMachine).start();
            service.onDone(event => {
              console.error('retry done', event);
            });
          },
        },
      },
      join: {
        invoke: {
          src: context => async send => {
            if (!context.connection) {
              return;
            }
            const offer = await context.connection.createOffer();
            await context.connection.setLocalDescription(offer);
            const answer = await signal.join('ravi', '', true, true, true, false, offer);
            await context.connection.setRemoteDescription(answer);
            context.candidates.forEach(candidate => {
              context.connection?.addIceCandidate(candidate);
              context.candidates.delete(candidate);
            });
            console.error('join called');
            context.connection.onnegotiationneeded = () => {
              console.error('negotiation needed');
              send({ type: 'negotiate' });
            };
            send({ type: 'joined' });
          },
        },
      },
      negotiate: {
        invoke: {
          src: (context, event) => async () => {
            if (!context.connection) {
              console.error('publishNegotiation called');
              return;
            }
            console.error('publishNegotiation called');
            const offer = await context.connection.createOffer(event.iceRestart ? { iceRestart: true } : undefined);
            await context.connection.setLocalDescription(offer);
            const answer = await signal.offer(offer, context.trackStates);
            await context.connection.setRemoteDescription(answer);
          },
        },
      },
      failure: {
        type: 'final',
        entry: assign({
          connection: null,
          candidates: new Set(),
          trackStates: new Map<string, TrackState>(),
          connectionState: 'new',
        }),
      },
    },
  });

interface RetryContext {
  retryCount: number;
  error: HMSException | null;
  success: boolean;
}

interface RetryEventObject {
  type: 'SCHEDULE';
  data?: HMSException;
}

export const createRetryMachine = (task: () => Promise<any> | any, maxRetries = 5) =>
  createMachine<RetryContext, RetryEventObject>({
    id: 'retryMachine',
    initial: 'idle',
    context: {
      retryCount: 0,
      error: null,
      success: false,
    },
    states: {
      idle: {
        on: {
          SCHEDULE: 'schedule',
        },
      },
      schedule: {
        invoke: {
          src: () => task(),
          onDone: 'success',
          onError: 'error',
        },
      },
      success: {
        entry: assign({
          success: true,
          error: null,
          retryCount: 0,
        }),
        type: 'final',
      },
      error: {
        on: {
          SCHEDULE: [
            { target: 'schedule', cond: context => context.retryCount < maxRetries },
            { target: 'failed', cond: context => context.retryCount >= maxRetries },
          ],
        },
        entry: [
          assign<RetryContext, RetryEventObject>({
            success: false,
            error: (_, event) => {
              return event.data || null;
            },
            retryCount: context => context.retryCount + 1,
          }),
          send<RetryContext, RetryEventObject>(
            { type: 'SCHEDULE' },
            {
              delay: context => Math.pow(2, context.retryCount) * 1000,
            },
          ),
        ],
      },
      failed: {
        type: 'final',
      },
    },
  });
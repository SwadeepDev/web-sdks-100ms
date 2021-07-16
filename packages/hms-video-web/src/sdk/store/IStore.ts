import HMSRoom from '../../interfaces/room';
import { HMSSpeaker } from '../../interfaces/speaker';
import { HMSTrack, HMSAudioTrack, HMSVideoTrack, HMSTrackSource } from '../../media/tracks';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';
import { HMSLocalTrack } from '../../media/streams/HMSLocalStream';
import HMSPolicy from '../../interfaces/policy';
import { SimulcastLayer, SimulcastDimensions, SimulcastLayers } from '../../interfaces/simulcast-layers';

type Comparator<T> = (a: T, b: T) => number;
export type KnownRoles = { [role: string]: HMSPolicy };

export interface IStore {
  getRoom(): HMSRoom;
  getPolicyForRole(role: string): HMSPolicy;
  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[];
  getSimulcastDimensions(source: HMSTrackSource): SimulcastDimensions | undefined;

  getLocalPeer(): HMSLocalPeer;
  getRemotePeers(): HMSRemotePeer[];
  getPeers(): HMSPeer[];

  getTracks(): HMSTrack[];
  getVideoTracks(): HMSVideoTrack[];
  getAudioTracks(): HMSAudioTrack[];

  getPeerById(peerId: string): HMSPeer;
  getTrackById(trackId: string): HMSTrack;
  getPeerByTrackId(trackId: string): HMSPeer | undefined;
  getPeerTracks(peerId: string): HMSTrack[];
  getLocalPeerTracks(): HMSLocalTrack[];

  getSpeakers(): HMSSpeaker[];
  getSpeakerPeers(): HMSPeer[];

  setRoom(room: HMSRoom): void;
  setKnownRoles(knownRoles: KnownRoles): void;
  setVideoSimulcastLayers(layers: SimulcastLayers): void;
  setScreenshareSimulcastLayers(layers: SimulcastLayers): void;

  addPeer(peer: HMSPeer): void;
  addTrack(track: HMSTrack): void;

  removePeer(peerId: string): void;
  removeTrack(trackId: string): void;

  updateSpeakers(speakers: HMSSpeaker[]): void;
  updateAudioOutputVolume(volume: number): void;
  updateAudioOutputDevice(device: MediaDeviceInfo): void;

  /**
   * Used to sort list of items(peers/tracks) based on common use cases.
   * Usage: peerList.sort(store.comparators.peer.speaker);
   */
  comparators: {
    peer: {
      videoEnabled: Comparator<HMSPeer>;
      audioEnabled: Comparator<HMSPeer>;
      screenShare: Comparator<HMSPeer>;
      speaker: Comparator<HMSPeer>;
      rolePriority: Comparator<HMSPeer>;
    };
    track: {
      video: Comparator<HMSTrack>;
      audio: Comparator<HMSTrack>;
      enabled: Comparator<HMSTrack>;
      speaker: Comparator<HMSTrack>;
      screenShare: Comparator<HMSTrack>;
      rolePriority: Comparator<HMSPeer>;
    };
  };
}

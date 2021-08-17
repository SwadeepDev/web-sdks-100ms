import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSMediaStream from '../streams/HMSMediaStream';
import HMSLogger from '../../utils/logger';

export class HMSAudioTrack extends HMSTrack {
  private readonly TAG = '[HMSAudioTrack]';
  readonly type: HMSTrackType = HMSTrackType.AUDIO;
  private audioElement: HTMLAudioElement | null = null;
  private outputDevice?: MediaDeviceInfo;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    if (track.kind !== 'audio') throw new Error("Expected 'track' kind = 'audio'");
  }

  getVolume() {
    return this.audioElement ? this.audioElement.volume * 100 : null;
  }

  setVolume(value: number) {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    if (this.audioElement) {
      this.audioElement.volume = value / 100;
    }
  }

  setAudioElement(element: HTMLAudioElement | null) {
    this.audioElement = element;
  }

  getOutputDevice() {
    return this.outputDevice;
  }

  cleanup() {
    super.cleanup();
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement.remove();
      this.audioElement = null;
    }
  }

  async setOutputDevice(device: MediaDeviceInfo) {
    if (!this.audioElement) {
      HMSLogger.w(this.TAG, 'No Audio element attached to track yet');
      return;
    }
    try {
      // @ts-ignore
      if (typeof this.audioElement.setSinkId === 'function') {
        // @ts-ignore
        await this.audioElement?.setSinkId(device.deviceId);
        this.outputDevice = device;
      } else {
        HMSLogger.w(this.TAG, 'setSinkId not supported - cannot set output device');
      }
    } catch (error) {
      // Firefox throws error even when accessing setSinkId on audioElement
      HMSLogger.w(this.TAG, 'setSinkId failed', error);
    }
  }
}

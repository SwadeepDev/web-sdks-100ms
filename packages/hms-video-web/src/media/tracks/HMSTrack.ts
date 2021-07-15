import HMSMediaStream from '../streams/HMSMediaStream';
import { HMSTrackType } from './HMSTrackType';

export type HMSTrackSource = 'regular' | 'screen' | 'plugin';

export abstract class HMSTrack {
  // @internal
  readonly stream: HMSMediaStream;
  source?: HMSTrackSource;

  //name of processors
  processors: Array<string>;

  /** Changes when un-muting and adding processor the local track
   * i.e replacing the nativeTrack with different `deviceId`
   * track.
   * @internal */
  nativeTrack: MediaStreamTrack;

  abstract readonly type: HMSTrackType;

  public get enabled(): boolean {
    return this.nativeTrack.enabled;
  }

  public get trackId(): string {
    return this.nativeTrack.id;
  }

  getMediaTrackSettings(): MediaTrackSettings {
    return this.nativeTrack.getSettings();
  }

  async setEnabled(value: boolean): Promise<void> {
    this.nativeTrack.enabled = value;
  }

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: HMSTrackSource) {
    this.stream = stream;
    this.nativeTrack = track;
    this.source = source;
    this.processors = [];
  }
}

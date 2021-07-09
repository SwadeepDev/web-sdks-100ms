export default interface HMSPolicy {
  name: string;
  publishParams: {
    audio: {
      bitRate: number;
      codec: string;
    };
    video: {
      bitRate: number;
      codec: string;
      frameRate: number;
      width: number;
      height: number;
    };
    screen: {
      codec: string;
      frameRate: number;
      width: number;
      height: number;
    };
    allowed: string[];
  };
  subscribeParams: {
    subscribeToRoles: string[];
    maxSubsBitRate: number;
  };
  permissions: {
    endRoom: boolean;
    removeOthers: boolean;
    stopPresentation: boolean;
    muteAll: boolean;
    askToUnmute: boolean;
    muteSelective: boolean;
    changeRole: boolean;
  };
  priority: number;
}

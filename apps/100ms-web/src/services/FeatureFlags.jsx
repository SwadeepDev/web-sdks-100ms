import { useEffect } from "react";

export class FeatureFlags {
  static enableTranscription =
    process.env.REACT_APP_ENABLE_TRANSCRIPTION === "true";
  static enableStatsForNerds =
    process.env.REACT_APP_ENABLE_STATS_FOR_NERDS === "true";
  static enableWhiteboard =
    process.env.REACT_APP_ENABLE_WHITEBOARD &&
    process.env.REACT_APP_PUSHER_APP_KEY &&
    process.env.REACT_APP_PUSHER_AUTHENDPOINT;
  static enableHLSQualityLevels =
    process.env.REACT_APP_ENABLE_HLS_QUALITY_LVL === "true";

  static init() {
    if (!window.HMS) {
      window.HMS = {};
    }
    // unsubscribe for muted audio tracks
    window.HMS.AUDIO_SINK = false;
    // some extra config to hls js to bring down latency
    window.HMS.OPTIMISE_HLS_LATENCY = false;
    // ask permissions in preview even if role doesn't have it
    window.HMS.ALWAYS_REQUEST_PERMISSIONS = false;
    // add support for server degradation
    window.HMS.FREEZE_VIDEO_LIST = false; // process.env.REACT_APP_ENV === "qa";
    // to send http events
    window.HMS.CLIENT_EVENTS = process.env.SEND_CLIENT_EVENTS === "true";
  }

  static freezeVideoList() {
    return window.HMS.FREEZE_VIDEO_LIST;
  }

  static optimiseHLSLatency() {
    return window.HMS.OPTIMISE_HLS_LATENCY;
  }

  static alwaysRequestPermissions() {
    return window.HMS.ALWAYS_REQUEST_PERMISSIONS;
  }
}

export function FeatureFlagsInit() {
  useEffect(() => {
    FeatureFlags.init();
  }, []);
  return null;
}

import adapter from 'webrtc-adapter';

console.log(`%c ${adapter.browserDetails.browser} v${adapter.browserDetails.version}`, 'color: #2F80FF');

export * from './sdk';
export * from './media/tracks';
export * from './utils/media';
export * from './utils/device-error';
export * from './utils/support';
export * from './error/HMSException';
export * from './interfaces';
export * from './rtc-stats';
export * from './plugins';
export * from './utils/logger';

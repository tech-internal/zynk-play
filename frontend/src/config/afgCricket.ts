/** MI India Cricket — WebGL build hosted on AWS S3 */

export const AFG_CRICKET_GAME_URL =
  'https://unitybucket67.s3.us-east-1.amazonaws.com/index.html';

/** Same URL in a new tab (embed fallback / external play). */
export const AFG_CRICKET_STANDALONE_URL = AFG_CRICKET_GAME_URL;

/** Permissions — match Unity WebGL iframe (fullscreen, gamepad, etc.) */
export const AFG_CRICKET_IFRAME_ALLOW =
  'autoplay; fullscreen *; gamepad *; microphone; xr-spatial-tracking';

export const LIVE_STREAM_HLS_URL =
  'https://d1clrt8nxj7onv.cloudfront.net/live/myStream/playlist.m3u8';

export type HlsLite = {
  loadSource: (url: string) => void;
  attachMedia: (media: HTMLVideoElement) => void;
  destroy: () => void;
};

export type HlsConstructor = {
  isSupported: () => boolean;
  new (config?: Record<string, unknown>): HlsLite;
};

export function getWindowHls(): HlsConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Hls?: HlsConstructor }).Hls;
}

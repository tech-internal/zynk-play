/** Afghan Soccer — Unity WebGL on CloudFront */
export const AFG_SOCCER_GAME_BASE_URL =
  'https://dd0pkk35jdxki.cloudfront.net/index.html';

/**
 * Soccer CDN responds with `X-Frame-Options: SAMEORIGIN`, so browsers block
 * cross-origin iframes. Use external launch until CloudFront removes that header.
 */
export const AFG_SOCCER_REQUIRES_EXTERNAL_LAUNCH = true;

/** MI India Cricket — Unity WebGL on CloudFront */
export const AFG_CRICKET_GAME_BASE_URL =
  'https://d3kqwmfqrqx099.cloudfront.net/index.html';

/** @deprecated Use AFG_CRICKET_GAME_BASE_URL */
export const AFG_CRICKET_GAME_URL = AFG_CRICKET_GAME_BASE_URL;

/** @deprecated Use buildUnityGameUrl(AFG_CRICKET_GAME_BASE_URL, userId) */
export const AFG_CRICKET_STANDALONE_URL = AFG_CRICKET_GAME_BASE_URL;

/** Permissions — match Unity WebGL iframe (fullscreen, gamepad, etc.) */
export const AFG_CRICKET_IFRAME_ALLOW =
  'autoplay; fullscreen *; gamepad *; microphone; xr-spatial-tracking';

export const UNITY_GAME_IFRAME_ALLOW = AFG_CRICKET_IFRAME_ALLOW;

export function buildUnityGameUrl(
  baseUrl: string,
  userId: string | null | undefined,
): string {
  if (!userId) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set('userid', userId);
  return url.toString();
}

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

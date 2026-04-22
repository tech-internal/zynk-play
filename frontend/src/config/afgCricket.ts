/** AFG Cricket (itch.io) — same embed targets as the standalone Game Palazio HTML portal */

export const AFG_CRICKET_GAME_URL =
  'https://html-classic.itch.zone/html/16844939/Build%204/index.html?v=1773811903';

export const AFG_CRICKET_ITCH_URL = 'https://daredevil101.itch.io/afg-cricket';

/** Permissions — match working static `index.html` iframe (Unity / WebGL + fullscreen) */
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

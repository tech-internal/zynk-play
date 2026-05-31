import { API_BASE } from '../api/client';

export type ReelItem = {
  id: string;
  key: string;
  title: string;
  /** Local file in frontend/public/reels (preferred). */
  src: string;
  /** Direct S3 URL when the bucket allows public read. */
  fallbackSrc: string;
  /** Backend stream from S3. */
  proxySrc: string;
};

function buildLocalReelUrl(key: string): string {
  const encodedPath = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/reels/${encodedPath}`;
}

function withApiBase(proxySrc: string): string {
  if (proxySrc.startsWith('http://') || proxySrc.startsWith('https://')) {
    return proxySrc;
  }
  return `${API_BASE}${proxySrc}`;
}

export async function fetchReels(): Promise<ReelItem[]> {
  const res = await fetch(`${API_BASE}/api/v1/reels`);
  if (!res.ok) {
    throw new Error('Failed to load reels');
  }
  const data = (await res.json()) as Array<{
    id: string;
    key: string;
    title: string;
    fallbackSrc: string;
    proxySrc: string;
  }>;

  return data.map((reel) => ({
    ...reel,
    src: buildLocalReelUrl(reel.key),
    proxySrc: withApiBase(reel.proxySrc),
  }));
}

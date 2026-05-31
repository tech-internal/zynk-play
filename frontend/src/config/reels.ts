import manifest from './reelsManifest.json';
import { API_BASE } from '../api/client';

export type ReelFolder = {
  id: string;
  /** Optional S3 key prefix for all files in this folder. */
  s3Prefix?: string;
  files: string[];
};

export type ReelItem = {
  id: string;
  folderId: string;
  filePath: string;
  title: string;
  /** Local file in frontend/public/reels (preferred). */
  src: string;
  /** Direct S3 URL when the bucket allows public read. */
  fallbackSrc: string;
  /** Backend stream from S3. */
  proxySrc: string;
};

const folders = manifest as ReelFolder[];

const S3_BUCKET = process.env.REACT_APP_AWS_S3_BUCKET ?? 'gamepalazio-content';
const S3_REGION = process.env.REACT_APP_AWS_S3_REGION ?? 'ap-southeast-2';

/** Served from frontend/public/reels/{folderId}/… */
export function buildLocalReelUrl(folderId: string, filePath: string): string {
  const encodedPath = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/reels/${folderId}/${encodedPath}`;
}

/** Build a direct S3 URL for a reel object key. */
export function buildS3ReelUrl(folder: ReelFolder, filePath: string): string {
  const prefix = folder.s3Prefix?.replace(/\/$/, '') ?? '';
  const key = prefix ? `${prefix}/${filePath}` : filePath;
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodedKey}`;
}

export function buildReelProxyUrl(folderId: string, filePath: string): string {
  const params = new URLSearchParams({ folder: folderId, file: filePath });
  return `${API_BASE}/api/v1/reels/stream?${params.toString()}`;
}

function reelTitleFromPath(filePath: string): string {
  const base = filePath.split('/').pop() ?? filePath;
  const withoutExt = base.replace(/\.mp4$/i, '');
  const reelMatch = /^Reel_\d+_(.+)$/.exec(withoutExt);
  if (reelMatch) {
    return reelMatch[1].replace(/_/g, ' ');
  }
  return withoutExt.replace(/_/g, ' ');
}

export function getAllReels(): ReelItem[] {
  const items: ReelItem[] = [];
  for (const folder of folders) {
    for (const filePath of folder.files) {
      const slug = filePath.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
      items.push({
        id: `${folder.id}-${slug}`,
        folderId: folder.id,
        filePath,
        title: reelTitleFromPath(filePath),
        src: buildLocalReelUrl(folder.id, filePath),
        fallbackSrc: buildS3ReelUrl(folder, filePath),
        proxySrc: buildReelProxyUrl(folder.id, filePath),
      });
    }
  }
  return items;
}

export { folders as reelFolders };

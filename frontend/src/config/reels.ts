import manifest from './reelsManifest.json';
import { API_BASE } from '../api/client';

export type ReelFolder = {
  id: string;
  folderId: string;
  folderKey: string;
  rlkey: string;
  files: string[];
};

export type ReelItem = {
  id: string;
  folderId: string;
  filePath: string;
  title: string;
  /** Local file in frontend/public/reels (preferred). */
  src: string;
  /** Dropbox direct URL if local missing. */
  fallbackSrc: string;
  /** Backend stream from Dropbox zip cache. */
  proxySrc: string;
};

const folders = manifest as ReelFolder[];

/** Served from frontend/public/reels/{folderId}/… */
export function buildLocalReelUrl(folderId: string, filePath: string): string {
  const encodedPath = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `/reels/${folderId}/${encodedPath}`;
}

/** Build a direct Dropbox stream URL for a file inside a shared folder. */
export function buildDropboxReelUrl(folder: ReelFolder, filePath: string): string {
  const encodedPath = filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return (
    `https://www.dropbox.com/scl/fo/${folder.folderId}/${folder.folderKey}` +
    `/${encodedPath}?rlkey=${folder.rlkey}&raw=1`
  );
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
        fallbackSrc: buildDropboxReelUrl(folder, filePath),
        proxySrc: buildReelProxyUrl(folder.id, filePath),
      });
    }
  }
  return items;
}

export { folders as reelFolders };

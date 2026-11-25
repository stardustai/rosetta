import { t } from '../i18n';
import type { DataRecord } from '../annotation/schema';

export type LocalFile = { path: string; file: File };
export type ResourceFile = { path: string; name: string; url: string };
export type DataKind = 'pointcloud' | 'image' | 'audio' | 'video' | 'text';
export type LocalImport = {
  id: string;
  name: string;
  files: LocalFile[];
  records: DataRecord[];
  totalSize: number;
};
const formats: Record<DataKind, string[]> = {
  pointcloud: ['pcd', 'ply'],
  image: ['png', 'jpg', 'jpeg', 'bmp', 'webp'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  video: ['mp4', 'webm', 'mov'],
  text: ['txt', 'md', 'html', 'pdf', 'docx'],
};
const sort = new Intl.Collator('en', { numeric: true, sensitivity: 'variant' });

export function normalizePath(path: string) {
  const segments = path.replace(/\\/g, '/').split('/').filter(Boolean);
  if (
    !segments.length ||
    segments.some(
      (part) => part === '..' || part === '.' || part.includes('\0'),
    )
  )
    throw new Error(t('Invalid file path'));
  return segments.join('/');
}
export function fileKind(path: string): DataKind | undefined {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return (Object.keys(formats) as DataKind[]).find((kind) =>
    formats[kind].includes(ext),
  );
}
export function fromFileList(list: FileList | File[]) {
  return Array.from(list).map((file) => ({
    path: normalizePath(file.webkitRelativePath || file.name),
    file,
  }));
}
export function localURL(id: string, path: string) {
  return `local://${id}/${normalizePath(path)
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

export function buildLocalImport(
  entries: LocalFile[],
  kind: DataKind,
  sequence: boolean,
  id: string,
): LocalImport {
  const seen = new Set<string>();
  const files = entries
    .filter(
      (entry) =>
        !entry.path
          .split('/')
          .some((p) => p.startsWith('.') || p === '__MACOSX'),
    )
    .map((entry) => ({ ...entry, path: normalizePath(entry.path) }));
  if (!files.length) throw new Error(t('No files to import'));
  for (const entry of files) {
    if (seen.has(entry.path))
      throw new Error(t('Duplicate file path: {{v0}}', { v0: entry.path }));
    if (!entry.file.size)
      throw new Error(t('The file is empty: {{v0}}', { v0: entry.path }));
    if (fileKind(entry.path) !== kind)
      throw new Error(
        t('The file format does not match the selected data type: {{v0}}', {
          v0: entry.path,
        }),
      );
    seen.add(entry.path);
  }
  files.sort((a, b) => sort.compare(a.path, b.path));
  const records = buildResourceRecords(
    files.map((entry) => ({
      path: entry.path,
      name: entry.file.name,
      url: localURL(id, entry.path),
    })),
    kind,
    sequence,
  );
  return {
    id,
    name: files[0].path.split('/')[0],
    files,
    records,
    totalSize: files.reduce((sum, entry) => sum + entry.file.size, 0),
  };
}

export function buildResourceRecords(
  entries: ResourceFile[],
  kind: DataKind,
  sequence: boolean,
): DataRecord[] {
  const groups = new Map<string, ResourceFile[]>();
  const consecutive = sequence && ['pointcloud', 'image'].includes(kind);
  for (const entry of [...entries].sort((a, b) =>
    sort.compare(a.path, b.path),
  )) {
    const key = consecutive
      ? entry.path.slice(0, entry.path.lastIndexOf('/') + 1) || 'sequence'
      : entry.path;
    groups.set(key, [...(groups.get(key) || []), entry]);
  }
  return Array.from(groups, ([name, group]) => {
    const urls = group.map((entry) => entry.url);
    let attachmentType: string;
    let attachment: any;
    if (kind === 'pointcloud') {
      attachmentType = consecutive ? 'POINTCLOUD_SEQUENCE' : 'POINTCLOUD';
      const sources = group.map((entry, i) => ({
        name: entry.name,
        url: urls[i],
      }));
      attachment = consecutive ? sources : sources[0];
    } else {
      attachmentType = consecutive
        ? 'IMAGE_SEQUENCE'
        : { image: 'IMAGE', audio: 'AUDIO', video: 'VIDEO', text: 'TEXT' }[
            kind
          ];
      attachment = consecutive ? urls : urls[0];
    }
    return {
      attachmentType,
      attachment,
      metadata: { title: name.replace(/\/$/, '') },
    } as DataRecord;
  });
}

export function formatSize(size: number) {
  const i = Math.min(
    3,
    Math.max(0, Math.floor(Math.log(Math.max(size, 1)) / Math.log(1024))),
  );
  return `${(size / 1024 ** i).toFixed(i ? 1 : 0)} ${
    ['B', 'KB', 'MB', 'GB'][i]
  }`;
}

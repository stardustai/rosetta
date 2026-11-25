import { t } from '../i18n';
import type { DataRecord } from '../annotation/schema';

export interface DataFileNode {
  key: string;
  title: string;
  path: string;
  isLeaf: boolean;
  children?: DataFileNode[];
}

const naturalOrder = new Intl.Collator('en', { numeric: true });
const isResource = (value: string) =>
  /^(\w+:\/|\/)|\.[a-z0-9]{1,8}(?:[?#].*)?$/i.test(value);
const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

function resourcePath(url: string, name?: string) {
  if (/^(data|blob):/.test(url)) return name || t('Embedded files');
  const local = url.match(/^local:\/\/[^/]+\/(.+)$/);
  if (local) return decode(local[1]);
  try {
    const parsed = new URL(url);
    return decode(parsed.pathname).replace(/^\/+/, '') || name || t('Files');
  } catch {
    return (
      decode(url.split(/[?#]/)[0]).replace(/^\/+/, '') || name || t('Files')
    );
  }
}

// Display resource files only, never annotation/configuration properties.
export function buildFileTree(records: DataRecord[]) {
  const resources = new Map<string, string>();
  function visit(value: unknown, direct = false) {
    if (typeof value === 'string') {
      if (direct || isResource(value))
        resources.set(value, resourcePath(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const child of value)
        if (typeof child === 'string' || typeof child === 'object')
          visit(child, direct);
      return;
    }
    if (!value || typeof value !== 'object') return;
    const source = value as Record<string, unknown>;
    if (typeof source.url === 'string')
      resources.set(
        source.url,
        resourcePath(
          source.url,
          typeof source.name === 'string' ? source.name : undefined,
        ),
      );
    for (const [key, child] of Object.entries(source)) {
      if (key !== 'url' && key !== 'name') visit(child);
    }
  }
  records.forEach((record, index) => {
    if (
      record.attachmentType === 'TEXT' &&
      typeof record.attachment === 'string' &&
      !isResource(record.attachment)
    ) {
      resources.set(
        `inline:${index}`,
        record.metadata?.title || t('Text data'),
      );
    } else visit(record.attachment, true);
  });

  const tree: DataFileNode[] = [];
  const directories = new Map<string, DataFileNode>();
  for (const [url, path] of resources) {
    const segments = path.split('/').filter(Boolean);
    let children = tree;
    let current = '';
    segments.forEach((title, index) => {
      current = current ? `${current}/${title}` : title;
      if (index === segments.length - 1) {
        children.push({ key: `file:${url}`, title, path, isLeaf: true });
      } else {
        let directory = directories.get(current);
        if (!directory) {
          directory = {
            key: `folder:${current}`,
            title,
            path: current,
            isLeaf: false,
            children: [],
          };
          directories.set(current, directory);
          children.push(directory);
        }
        children = directory.children!;
      }
    });
  }
  function sort(nodes: DataFileNode[]) {
    nodes.sort(
      (a, b) =>
        Number(a.isLeaf) - Number(b.isLeaf) ||
        naturalOrder.compare(a.title, b.title),
    );
    nodes.forEach((node) => node.children && sort(node.children));
  }
  sort(tree);
  return { tree, count: resources.size };
}

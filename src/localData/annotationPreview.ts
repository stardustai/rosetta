import { t } from '../i18n';
import type { PublicAnnotationInput } from '../annotation/schema';
import type { DBSchema } from 'idb';
import { openDB } from 'idb';
import type { StorageSource } from '../objectStorage/types';
import { publicSource } from '../objectStorage/paths';
import { commitTransaction } from '../storage/transaction';
import type { LocalImport } from './files';
import type { QuickSessionState } from './quickSession';
import { sessionRecords } from './sessionInfo';
import {
  releaseStagedImports,
  stageImport,
  stagedImportsFor,
} from './stagedImports';

export interface AnnotationPreview {
  id: string;
  input: PublicAnnotationInput;
  index: number;
  quickSession: QuickSessionState;
  cloudSources: StorageSource[];
  imports: LocalImport[];
  expiresAt: number;
}
interface PreviewDatabase extends DBSchema {
  previews: {
    key: string;
    value: AnnotationPreview;
    indexes: { expiresAt: number };
  };
}
const lifetime = 24 * 60 * 60 * 1000;
let connection: ReturnType<typeof openDB<PreviewDatabase>>;
const database = () =>
  (connection ||= openDB<PreviewDatabase>('annotation-tool-previews', 1, {
    upgrade(db) {
      db.createObjectStore('previews', { keyPath: 'id' }).createIndex(
        'expiresAt',
        'expiresAt',
      );
    },
    blocking() {
      void connection.then((db) => db.close());
      connection = undefined;
    },
    terminated() {
      connection = undefined;
    },
  }));

// A launch snapshot is temporary data transport, separate from saved tasks.
// IndexedDB preserves local File/Blob objects across tabs and page refreshes.
// Credentials are handed off in memory and never belong in this snapshot.
export async function prepareAnnotationPreview(
  input: PublicAnnotationInput,
  index: number,
  quickSession: QuickSessionState,
  cloudSources: StorageSource[],
) {
  if (!sessionRecords(input)[index])
    throw new Error(t('Select data to annotate first'));
  const value: AnnotationPreview = {
    id: crypto.randomUUID(),
    input,
    index,
    quickSession,
    cloudSources: cloudSources.map(publicSource),
    imports: stagedImportsFor(input),
    expiresAt: Date.now() + lifetime,
  };
  const db = await database();
  const tx = db.transaction('previews', 'readwrite');
  await commitTransaction(tx, async () => {
    let cursor = await tx.store
      .index('expiresAt')
      .openCursor(IDBKeyRange.upperBound(Date.now()));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.store.put(value);
  });
  return value;
}

export async function loadAnnotationPreview(id: string) {
  const db = await database();
  const value = await db.get('previews', id);
  if (!value || value.expiresAt <= Date.now()) {
    if (value) await db.delete('previews', id);
    throw new Error(
      t(
        'The temporary annotation data has expired. Return to tool configuration and open it again.',
      ),
    );
  }
  return value;
}

export function activateAnnotationPreview(
  value: AnnotationPreview,
  owner: object,
) {
  value.imports.forEach((data) => stageImport(owner, data));
  return () => releaseStagedImports(owner);
}

export async function checkpointAnnotationPreview(
  value: AnnotationPreview,
  input: PublicAnnotationInput,
  index: number,
  quickSession: QuickSessionState,
) {
  const next = {
    ...value,
    input,
    index,
    quickSession,
    imports: stagedImportsFor(input),
    expiresAt: Date.now() + lifetime,
  };
  await (await database()).put('previews', next);
  return next;
}

export async function deleteAnnotationPreview(id: string) {
  await (await database()).delete('previews', id);
}

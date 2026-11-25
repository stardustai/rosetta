import { t } from '../i18n';
import type { PublicAnnotationInput } from '../annotation/schema';
import type { DBSchema } from 'idb';
import { openDB } from 'idb';
interface SaveReport {
  id: string;
  userId: string;
  taskId: string;
  kind: 'annotation' | 'configuration';
  createdAt: number;
}
import type { ExportSettings } from '../exports/types';
import type { SavedStorageConnection } from '../objectStorage/types';
import type { AnnotationSession, SessionSummary } from './sessionInfo';
import {
  normalizeSession,
  recordName,
  sessionRecords,
  sessionSummary,
} from './sessionInfo';
import { filterTaskInput, inputResults } from './taskInput';

export interface Database extends DBSchema {
  files: {
    key: string;
    value: { url: string; blob: Blob; path: string; importId: string };
    indexes: { importId: string };
  };
  imports: {
    key: string;
    value: {
      id: string;
      name: string;
      count: number;
      totalSize: number;
      status: 'importing' | 'ready';
      createdAt: number;
    };
  };
  sessions: {
    key: string;
    value: AnnotationSession;
  };
  taskSummaries: {
    key: string;
    value: SessionSummary;
  };
  // Compatibility archive only; new tasks never read or write this store.
  // Retain old empty-draft templates and metadata during the v6 flattening.
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      createdAt: number;
      updatedAt: number;
      legacySessionId?: string;
      inputTemplate?: PublicAnnotationInput;
    };
  };
  connections: { key: string; value: SavedStorageConnection };
  exportSettings: { key: string; value: ExportSettings };
  saveReports: { key: string; value: SaveReport };
}

let connection: ReturnType<typeof openDB<Database>> | undefined;
export const database = () =>
  (connection ||= openDB<Database>('annotation-tool-local', 7, {
    async upgrade(db, oldVersion, _newVersion, tx) {
      // openDB reports upgrade failure via its own promise; also observe the
      // transaction promise when a migration explicitly aborts.
      void tx.done.catch(() => {});
      try {
        if (oldVersion < 1) {
          db.createObjectStore('files', { keyPath: 'url' }).createIndex(
            'importId',
            'importId',
          );
          db.createObjectStore('imports', { keyPath: 'id' });
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          db.createObjectStore('connections', { keyPath: 'id' });
          db.createObjectStore('taskSummaries', { keyPath: 'id' });
        }
        if (oldVersion < 3) {
          let cursor = await tx.objectStore('sessions').openCursor();
          while (cursor) {
            const session = normalizeSession(cursor.value);
            await cursor.update(session);
            await tx.objectStore('taskSummaries').put(sessionSummary(session));
            cursor = await cursor.continue();
          }
        }
        if (oldVersion < 4)
          db.createObjectStore('exportSettings', { keyPath: 'id' });
        if (oldVersion < 5) {
          db.createObjectStore('projects', { keyPath: 'id' });
          // Snapshot before adding children so newly split tasks are never migrated
          // again. The whole project/task conversion is one version transaction.
          const previous = await tx.objectStore('sessions').getAll();
          const usedIds = new Set(previous.map((task) => task.id));
          await tx.objectStore('sessions').clear();
          await tx.objectStore('taskSummaries').clear();
          for (const stored of previous) {
            const task = normalizeSession(stored);
            const projectId = `legacy-project:${task.id}`;
            const records = sessionRecords(task.input);
            await tx.objectStore('projects').put({
              id: projectId,
              name: task.name,
              description: task.description,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              legacySessionId: task.id,
              ...(!records.length ? { inputTemplate: task.input } : {}),
            });
            for (let i = 0; i < records.length; i++) {
              let id = task.id;
              if (i !== task.index) {
                id = `${task.id}::data:${i}`;
                while (usedIds.has(id)) id += ':copy';
                usedIds.add(id);
              }
              const submitted = task.submittedIndices.includes(i);
              const hasResult = inputResults(task.input)[i] != null;
              const value = normalizeSession({
                ...task,
                id,
                projectId,
                index: 0,
                name:
                  records.length === 1
                    ? task.name
                    : recordName(records[i], t('Data {{v0}}', { v0: i + 1 })),
                input: filterTaskInput(task.input, [i]),
                submittedIndices: submitted ? [0] : [],
                lastSavedAt:
                  hasResult || submitted ? task.lastSavedAt : undefined,
                legacyProgress: task.legacyProgress && hasResult && !submitted,
                status:
                  i === task.index && task.status === 'in_progress'
                    ? 'in_progress'
                    : 'pending',
                contentRevision:
                  task.contentRevision + (records.length > 1 ? 1 : 0),
              });
              await tx.objectStore('sessions').put(value);
              await tx.objectStore('taskSummaries').put(sessionSummary(value));
            }
          }
        }
        if (oldVersion < 6) {
          // Keep task IDs, file references, results and revisions intact. Rebuild
          // summaries so neither records nor list rows retain a grouping key.
          for (const storeName of ['sessions', 'taskSummaries'] as const) {
            const store = tx.objectStore(storeName);
            if ((store.indexNames as DOMStringList).contains('projectId'))
              store.deleteIndex('projectId' as never);
          }
          await tx.objectStore('taskSummaries').clear();
          let cursor = await tx.objectStore('sessions').openCursor();
          while (cursor) {
            const task = normalizeSession(cursor.value);
            await cursor.update(task);
            await tx.objectStore('taskSummaries').put(sessionSummary(task));
            cursor = await cursor.continue();
          }
        }
        if (oldVersion < 7)
          db.createObjectStore('saveReports', { keyPath: 'id' });
      } catch (error) {
        // An async upgrade callback is not awaited by IndexedDB. Explicitly
        // abort on code errors too, so clearing/splitting never partially commits.
        try {
          tx.abort();
        } catch {
          /* already aborted */
        }
        console.error(
          t(
            'The task data migration did not complete. The original data has been preserved',
          ),
          error instanceof Error ? error.name : 'UnknownError',
        );
      }
    },
    blocking() {
      connection?.then((db) => db.close());
      connection = undefined;
    },
    terminated() {
      connection = undefined;
    },
  }));

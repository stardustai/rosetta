import { t } from '../i18n';
import type {
  PublicAnnotationInput,
  TaskResult,
  TaskParamVersion,
} from '../annotation/schema';
import type { RosettaAnnotationDraft } from '../annotation/contracts/frame-v1';
import { filterTaskInput, inputOperators, inputResults } from './taskInput';
import { sessionRecords } from './sessionInfo';
import type { AnnotationSession } from './sessionInfo';
import {
  loadSession,
  saveQuickRecovery,
  saveSession,
  saveSessionDraft,
  saveSessionResult,
} from './storage';

export interface QuickSessionState {
  details: Array<{ name: string; description?: string }>;
  sessions: Array<[string, Pick<AnnotationSession, 'id' | 'contentRevision'>]>;
}

// One preview may contain many records; each persisted task still contains one.
// Serialize saves and retain IDs so retries do not create duplicate tasks.
export class QuickSession {
  private details: Array<{ name: string; description?: string }> = [];
  private sessions = new Map<
    string,
    Pick<AnnotationSession, 'id' | 'contentRevision'>
  >();
  private pending: Promise<unknown> = Promise.resolve();
  private key(input: PublicAnnotationInput, index: number) {
    const record = sessionRecords(input)[index];
    return JSON.stringify([index, record?.attachmentType, record?.attachment]);
  }
  setDetails(details: Array<{ name: string; description?: string }>) {
    this.details = details;
  }
  snapshot(): QuickSessionState {
    return structuredClone({
      details: this.details,
      sessions: [...this.sessions].map(
        ([key, { id, contentRevision }]) =>
          [
            key,
            { id, contentRevision },
          ] as QuickSessionState['sessions'][number],
      ),
    });
  }
  linkTask(input: PublicAnnotationInput, id: string, contentRevision: number) {
    this.sessions.set(this.key(input, 0), { id, contentRevision });
  }
  async restore(state: QuickSessionState) {
    const sessions = await Promise.all(
      state.sessions.map(async ([key, reference]) => {
        const session = await loadSession(reference.id);
        if (session.contentRevision !== reference.contentRevision)
          throw new Error(
            t(
              'The task data has changed. Reopen the annotation workspace from the configuration page.',
            ),
          );
        return [key, session] as const;
      }),
    );
    this.details = state.details;
    this.sessions = new Map(sessions);
  }
  reset() {
    this.sessions.clear();
    this.details = [];
  }
  private queue<T>(operation: () => Promise<T>) {
    const result = this.pending.then(operation);
    this.pending = result.catch(() => {});
    return result;
  }
  private async saveOne(
    input: PublicAnnotationInput,
    index: number,
    recovery = false,
  ) {
    if (!sessionRecords(input)[index]) throw new Error(t('No data to save'));
    const key = this.key(input, index);
    const previous = this.sessions.get(key);
    const id = previous?.id || crypto.randomUUID();
    const item = filterTaskInput(input, [index]);
    const saved = recovery
      ? await saveQuickRecovery(item, id, previous?.contentRevision)
      : await saveSession(item, id, undefined, undefined, {
          preserveResults: true,
          name: this.details[index]?.name,
          description: this.details[index]?.description,
          requireExisting: !!previous,
          expectedRevision: previous?.contentRevision,
        });
    this.sessions.set(key, saved);
    return saved;
  }
  saveAll(input: PublicAnnotationInput) {
    const snapshot = structuredClone(input);
    return this.queue(async () => {
      const saved: AnnotationSession[] = [];
      for (let index = 0; index < sessionRecords(snapshot).length; index++) {
        saved.push(await this.saveOneDraft(snapshot, index));
      }
      return saved;
    });
  }
  private async saveOneDraft(input: PublicAnnotationInput, index: number) {
    let task = await this.saveOne(input, index);
    const result = inputResults(input)[index];
    if (result) {
      task = await saveSessionDraft(
        task.id,
        {
          index: 0,
          result,
          params: {
            version: '1.0.0' as TaskParamVersion,
            record: sessionRecords(input)[index],
            operators: inputOperators(filterTaskInput(input, [index])),
          },
        },
        task.contentRevision,
      );
      this.sessions.set(this.key(input, index), task);
    }
    return task;
  }
  saveCurrent(input: PublicAnnotationInput, index: number) {
    const snapshot = structuredClone(input);
    return this.queue(() => this.saveOneDraft(snapshot, index));
  }
  saveResult(input: PublicAnnotationInput, result: TaskResult, index: number) {
    const snapshot = structuredClone(input);
    const value = structuredClone(result);
    return this.queue(async () => {
      const task = await this.saveOne(snapshot, index);
      const saved = await saveSessionResult(
        task.id,
        value,
        0,
        task.contentRevision,
      );
      this.sessions.set(this.key(snapshot, index), saved);
      return saved;
    });
  }
  recover(input: PublicAnnotationInput, draft?: RosettaAnnotationDraft) {
    const snapshot = structuredClone(input);
    return this.queue(async () => {
      const saved: AnnotationSession[] = [];
      for (let index = 0; index < sessionRecords(snapshot).length; index++) {
        let task = await this.saveOne(snapshot, index, true);
        if (draft?.index === index)
          task = await saveSessionDraft(
            task.id,
            { ...draft, index: 0 },
            task.contentRevision,
          );
        this.sessions.set(this.key(snapshot, index), task);
        saved.push(task);
      }
      return saved;
    });
  }
}

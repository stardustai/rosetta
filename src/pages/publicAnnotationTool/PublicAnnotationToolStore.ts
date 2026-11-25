import { t } from '../../i18n';
import {
  createEmptyAnnotationFromTaskParams,
  DataRecord,
  migrateAnnotation,
  ProjectAlgorithm,
  PublicAnnotationInput,
  TaskParamVersion,
} from '../../annotation/schema';
import { RosettaAnnotationDraft } from '../../annotation/contracts/frame-v1';
import { toJS as toJsRecursively } from 'mobx';
import { debounce } from 'lodash';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import {
  kindFromRecord,
  createDefaultOperators,
  operatorsForImport,
} from '../../localData/presets';
import type { AnnotationSession } from '../../localData/storage';
import {
  saveSession,
  saveSessionConfigurationDraft,
} from '../../localData/storage';
import { getRecordOperators, getRecordTaskResult } from './preprocessedData';
import { QuickSession } from '../../localData/quickSession';
import {
  applyAnnotationDraft,
  releaseStagedImports,
} from '../../localData/stagedImports';

export enum formatType {
  JSON = 'JSON',
  OperatorEditor = 'OperatorEditor',
  AlgoEditor = 'AlgoEditor',
}

export class PublicAnnotationToolStore {
  constructor() {
    makeObservable(this);
    this.resetCustom();
  }

  @observable error?: Error;

  @observable input?: PublicAnnotationInput;

  @observable sessionId?: string;

  @observable taskName?: string;

  @observable managedTask = false;

  @observable contentRevision = 0;

  @observable activeRecordIndex = 0;

  readonly quickSession = new QuickSession();

  dispose() {
    this.setDataWithString.cancel();
    releaseStagedImports(this);
  }

  private pendingWrite: Promise<unknown> = Promise.resolve();

  @computed get records(): DataRecord[] {
    if (!this.input) return [];
    const params = this.input.taskParams;
    if (params.type !== 'include') return params.records || [];
    return params.value.record?.attachmentType ? [params.value.record] : [];
  }

  @action resetCustom() {
    releaseStagedImports(this);
    this.quickSession.reset();
    this.managedTask = false;
    this.setData({
      taskParams: {
        type: 'multiple',
        records: [],
        operators: [],
      },
    });
  }

  @computed get operators() {
    const value = this.input;
    if (value == null) {
      return null;
    }
    const fallback =
      value.taskParams.type === 'include'
        ? value.taskParams.value.operators
        : value.taskParams.operators;
    return this.records[this.activeRecordIndex]
      ? getRecordOperators(this.records[this.activeRecordIndex], fallback)
      : fallback;
  }

  @computed get algorithms() {
    const value = this.input;
    if (value == null) {
      return [];
    }
    return value.algorithms;
  }

  @action setAlgorithms(algorithms: ProjectAlgorithm | ProjectAlgorithm[]) {
    if (this.input == null) {
      return;
    }
    if (this.input.algorithms == null) {
      this.input.algorithms = [];
    }
    if (Array.isArray(algorithms)) {
      this.input.algorithms = algorithms;
    } else {
      this.input.algorithms = [...this.input.algorithms, algorithms];
    }
  }

  @observable format = formatType.OperatorEditor;

  @action setFormat(format: formatType) {
    this.format = format;
  }

  @action setData(
    data?: PublicAnnotationInput,
    keepSession = this.managedTask,
  ) {
    if (this.managedTask && data) {
      const count =
        data.taskParams.type === 'include' ? 1 : data.taskParams.records.length;
      if (count !== 1)
        throw new Error(
          t(
            'Each task contains one data item. Import batches from the task list',
          ),
        );
    }
    if (!keepSession) {
      this.sessionId = undefined;
      this.taskName = undefined;
      this.contentRevision = 0;
    }
    this.input = data;
    this.activeRecordIndex = Math.min(
      this.activeRecordIndex,
      Math.max(0, this.records.length - 1),
    );
    this.error = undefined;
  }

  assertImportCompatible(records: DataRecord[]) {
    if (this.managedTask && records.length !== 1)
      throw new Error(
        t(
          'Each task contains one data item. Import batches from the task list',
        ),
      );
    const previousKind = kindFromRecord(this.records[0]);
    const kind = kindFromRecord(records[0]);
    if (
      this.managedTask &&
      this.records.length &&
      kind &&
      previousKind &&
      kind !== previousKind
    )
      throw new Error(
        t(
          'This data has a different type. Return to the task list and import it separately.',
        ),
      );
  }

  @action setRecords(records: DataRecord[]) {
    this.assertImportCompatible(records);
    const previousKind = kindFromRecord(this.records[0]);
    const kind = kindFromRecord(records[0]);
    const previous = this.input;
    if (!this.managedTask) {
      this.sessionId = undefined;
      this.taskName = undefined;
      this.contentRevision = 0;
    }
    this.error = undefined;
    const fallbackOperators =
      this.input?.taskParams.type === 'include'
        ? this.input?.taskParams.value.operators
        : this.input?.taskParams.operators;
    const defaults = kind
      ? operatorsForImport(kind, previousKind, fallbackOperators)
      : fallbackOperators ?? [];
    const operators = records[0]
      ? getRecordOperators(records[0], defaults)
      : fallbackOperators ?? [];
    const incoming: PublicAnnotationInput = {
      taskParams: {
        type: 'multiple',
        operators,
        records: records.map((record) => {
          const recordKind = kindFromRecord(record);
          return recordKind && recordKind !== kind
            ? ({
                ...record,
                metadata: {
                  ...record.metadata,
                  preprocessedData: {
                    ...record.metadata?.preprocessedData,
                    operators: getRecordOperators(
                      record,
                      createDefaultOperators(recordKind),
                    ),
                  },
                },
              } as DataRecord)
            : record;
        }),
        taskResults: records.map((record) => getRecordTaskResult(record)),
      },
    };
    this.input = this.managedTask ? { ...previous, ...incoming } : incoming;
    this.activeRecordIndex = 0;
  }

  @computed get stringAttachment(): string | null {
    if (this.input == null) {
      return null;
    }
    const record =
      this.input.taskParams.type === 'include'
        ? this.input.taskParams.value.record
        : this.input.taskParams.records[0];
    if (typeof record?.attachment === 'string') {
      return record.attachment;
    }
    return null;
  }

  @action setAttachmentString(url: string) {
    if (this.input == null) {
      return;
    }
    const record =
      this.input.taskParams.type === 'include'
        ? this.input.taskParams.value.record
        : this.input.taskParams.records[0];
    if (typeof record?.attachment === 'string') {
      record.attachment = url;
    }
  }

  async getFinalInput() {
    return toJsRecursively(this.input);
  }

  @action selectRecord(index: number) {
    if (!this.records[index]) return;
    this.activeRecordIndex = index;
  }

  @action applyPreviewDraft(draft: RosettaAnnotationDraft) {
    if (!this.input) return;
    this.input = applyAnnotationDraft(this, toJsRecursively(this.input), draft);
    this.activeRecordIndex = draft.index;
  }

  @action restoreTask(session: AnnotationSession, managed = true) {
    this.setData(session.input, false);
    this.sessionId = session.id;
    this.taskName = session.name;
    this.managedTask = managed;
    this.contentRevision = session.contentRevision;
  }

  async persistTask(name?: string) {
    const id = this.sessionId;
    const input = await this.getFinalInput();
    if (!input || (!this.records.length && !this.managedTask))
      throw new Error(t('Import annotation data first'));
    return this.persistConfiguration(input, id, name);
  }

  async persistProtectionDraft() {
    const id = this.sessionId;
    const input = await this.getFinalInput();
    if (!input || !this.records.length)
      throw new Error(
        t('Data has not finished loading. The current page was kept open'),
      );
    if (!id) return this.quickSession.recover(input);
    await this.pendingWrite;
    if (this.sessionId !== id)
      throw new Error(t('The task changed. Automatic exit was canceled'));
    const saved = await saveSessionConfigurationDraft(
      id,
      input,
      this.contentRevision,
    );
    runInAction(() => {
      this.contentRevision = saved.contentRevision;
    });
    return saved;
  }

  persistConfiguration(
    input: PublicAnnotationInput,
    id: string | undefined,
    name?: string,
  ) {
    const current = this.input;
    const revision = this.contentRevision;
    const managed = this.managedTask;
    const operation = this.pendingWrite.then(async () => {
      const targetId =
        id || (this.input === current ? this.sessionId : undefined);
      const saved = await saveSession(input, targetId, undefined, undefined, {
        name: managed && targetId ? undefined : name,
        preserveResults: true,
        requireExisting: !!targetId,
        expectedRevision: targetId
          ? this.sessionId === targetId
            ? this.contentRevision
            : revision
          : undefined,
      });
      if (
        targetId
          ? this.sessionId === targetId
          : this.input === current && !this.sessionId
      )
        runInAction(() => {
          this.sessionId = saved.id;
          this.taskName = saved.name;
          this.contentRevision = saved.contentRevision;
        });
      return saved;
    });
    this.pendingWrite = operation.catch(() => {});
    return operation;
  }

  async migrateInput() {
    if (this.input == null) {
      throw new Error('No input');
    }
    const input = toJsRecursively(this.input);
    if (input.taskParams.type === 'include') {
      const taskResult = input.taskResult ?? {
        notes: [],
        issues: [],
        annotations: createEmptyAnnotationFromTaskParams(
          input.taskParams.value,
        ),
      };
      const annotations = migrateAnnotation(
        taskResult.annotations,
        input.taskParams.value.operators,
      );
      taskResult.annotations = annotations;
      input.taskResult = taskResult;
      return input;
    }

    const fallbackOperators = input.taskParams.operators;
    if (fallbackOperators == null) {
      throw new Error('No operators');
    }
    const taskResults = input.taskParams.taskResults;
    const newTaskResults = input.taskParams.records
      .map((record, i) => {
        return {
          taskParams: {
            version: TaskParamVersion.V100,
            record,
            operators: getRecordOperators(record, fallbackOperators),
          },
          taskResult: getRecordTaskResult(record, taskResults?.[i]),
        };
      })
      .map((r) => {
        const taskResult = r.taskResult ?? {
          notes: [],
          issues: [],
          annotations: createEmptyAnnotationFromTaskParams(r.taskParams),
        };
        taskResult.annotations = migrateAnnotation(
          taskResult.annotations,
          r.taskParams.operators,
        );
        return taskResult;
      });
    input.taskParams.taskResults = newTaskResults;
    return input;
  }

  setDataWithString = debounce(
    action((v: string) => {
      try {
        const input = JSON.parse(v);
        this.setData(input, true);
      } catch (e) {
        this.error = e as Error;
      }
    }),
    1000,
  );
}

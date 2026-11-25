import { t } from '../i18n';
import type { DataRecord, PublicAnnotationInput } from '../annotation/schema';
import type { StorageSource } from '../objectStorage/types';

export type TaskStatus = 'draft' | 'pending' | 'in_progress' | 'completed';
export const taskStatusLabels: Record<TaskStatus, string> = {
  get draft() {
    return t('Draft');
  },
  get pending() {
    return t('To annotate');
  },
  get in_progress() {
    return t('In progress');
  },
  get completed() {
    return t('Completed');
  },
};

export interface AnnotationSession {
  id: string;
  input: PublicAnnotationInput;
  index: number;
  name: string;
  description: string;
  status: TaskStatus;
  submittedIndices: number[];
  legacyProgress: boolean;
  contentRevision: number;
  createdAt: number;
  updatedAt: number;
  lastSavedAt?: number;
  cloudSources?: StorageSource[];
}

export interface SessionSummary {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  submittedCount: number;
  legacyProgress: boolean;
  count: number;
  index: number;
  source: string;
  attachmentType?: string;
  createdAt: number;
  updatedAt: number;
  lastSavedAt?: number;
}

export function recordName(record: DataRecord, fallback = t('Untitled data')) {
  const name = (record as { name?: unknown })?.name || record?.metadata?.title;
  if (typeof name === 'string' && name.trim()) return name.trim().slice(0, 100);
  if (
    typeof record?.attachment === 'string' &&
    record.attachmentType !== 'TEXT'
  ) {
    const value = record.attachment
      .split(/[?#]/)[0]
      .split('/')
      .filter(Boolean)
      .pop();
    if (value) {
      try {
        return decodeURIComponent(value).slice(0, 100);
      } catch {
        return value.slice(0, 100);
      }
    }
  }
  return fallback.slice(0, 100);
}

export function sessionRecords(input: PublicAnnotationInput) {
  return input.taskParams.type === 'include'
    ? input.taskParams.value.record?.attachmentType
      ? [input.taskParams.value.record]
      : []
    : input.taskParams.records;
}

export function referencedImportIds(input: PublicAnnotationInput) {
  const found = new Set<string>();
  function visit(value: unknown) {
    if (typeof value === 'string') {
      const match = /^local:\/\/([^/]+)\//.exec(value);
      if (match) found.add(match[1]);
    } else if (Array.isArray(value)) {
      if (typeof value[0] !== 'number') value.forEach(visit);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  }
  visit(input);
  return found;
}

// Existing version-1 tasks already contain their results; only metadata is new.
export function normalizeSession(
  stored: Partial<AnnotationSession> &
    Pick<AnnotationSession, 'id' | 'input'> & { projectId?: string },
): AnnotationSession {
  // Older databases stored a grouping key. Tasks now stand on their own.
  const { projectId: _legacyGroup, ...value } = stored;
  let input = value.input;
  if (
    input.taskParams.type !== 'include' &&
    input.taskParams.taskResults?.every((result) => result == null)
  ) {
    const { taskResults: _empty, ...params } = input.taskParams;
    input = { ...input, taskParams: params };
  }
  const records = sessionRecords(input);
  const count = records.length;
  const record = records[0];
  const recordName = (record as { name?: unknown })?.name;
  const submittedIndices = [...new Set(value.submittedIndices || [])]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < count)
    .sort((a, b) => a - b);
  const completed = count > 0 && submittedIndices.length === count;
  return {
    ...value,
    input,
    name:
      value.name ||
      (typeof recordName === 'string' && recordName) ||
      t('Untitled task'),
    description: value.description || '',
    submittedIndices,
    legacyProgress:
      !completed &&
      (value.legacyProgress ??
        (!!value.lastSavedAt && value.submittedIndices == null)),
    contentRevision: value.contentRevision || 0,
    status: !count
      ? 'draft'
      : completed
      ? 'completed'
      : submittedIndices.length ||
        value.status === 'in_progress' ||
        value.lastSavedAt
      ? 'in_progress'
      : 'pending',
    createdAt: value.createdAt || value.updatedAt || Date.now(),
    updatedAt: value.updatedAt || Date.now(),
    index: Math.max(0, Math.min(value.index || 0, Math.max(0, count - 1))),
  };
}

export function sessionSummary(value: AnnotationSession): SessionSummary {
  const session = normalizeSession(value);
  const sources =
    session.cloudSources?.map(
      (source) => `${source.provider.toUpperCase()} · ${source.bucket}`,
    ) || [];
  if (referencedImportIds(session.input).size)
    sources.unshift(t('Local files'));
  return {
    id: session.id,
    name: session.name,
    description: session.description,
    status: session.status,
    submittedCount: session.submittedIndices.length,
    legacyProgress: session.legacyProgress,
    count: sessionRecords(session.input).length,
    index: session.index,
    source:
      sources.join(' / ') ||
      (sessionRecords(session.input).length
        ? t('JSON / example data')
        : t('No data imported')),
    attachmentType: sessionRecords(session.input)[0]?.attachmentType,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastSavedAt: session.lastSavedAt,
  };
}

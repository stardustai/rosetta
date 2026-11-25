import { t } from '../i18n';
import type { PublicAnnotationInput } from '../annotation/schema';
import type { RosettaAnnotationDraft } from '../annotation/contracts/frame-v1';
import type { LocalFile, LocalImport } from './files';
import { buildLocalImport, localURL } from './files';
import { planLocalTasks } from './batchTasks';
import { referencedImportIds } from './sessionInfo';

// Files selected for a quick preview stay in memory until the user saves them.
// Their local:// addresses are identical before and after persistence.
const staged = new Map<string, { owner: object; data: LocalImport }>();

export function stageImport(owner: object, data: LocalImport) {
  staged.set(data.id, { owner, data });
}
export function stageLocalFiles(
  owner: object,
  files: LocalFile[],
  folder: boolean,
) {
  const plan = planLocalTasks(files, folder ? 'folder' : 'file', true);
  if (!plan.tasks.length)
    throw new Error(
      t(
        'No supported images, point clouds, audio, video, or text files were found',
      ),
    );
  const imports = plan.tasks.map((task) =>
    buildLocalImport(task.files, task.kind, task.sequence, crypto.randomUUID()),
  );
  imports.forEach((data) => stageImport(owner, data));
  return {
    imports,
    records: imports.flatMap((data) => data.records),
    skipped: plan.skippedCount,
  };
}
export function stagedFile(url: string): Blob | undefined {
  const match = url.match(/^local:\/\/([^/]+)\/(.+)$/);
  if (!match) return;
  const data = staged.get(match[1])?.data;
  return data?.files.find((entry) => localURL(data.id, entry.path) === url)
    ?.file;
}
export function stagedImportsFor(input: PublicAnnotationInput) {
  return [...referencedImportIds(input)].flatMap(
    (id) => staged.get(id)?.data || [],
  );
}
export function releaseStagedImports(owner: object) {
  for (const [id, entry] of staged)
    if (entry.owner === owner) staged.delete(id);
}
export function adoptStagedImports(previous: object, owner: object) {
  for (const entry of staged.values())
    if (entry.owner === previous) entry.owner = owner;
}

export function applyAnnotationDraft(
  owner: object,
  input: PublicAnnotationInput,
  draft: RosettaAnnotationDraft,
): PublicAnnotationInput {
  const value = structuredClone(input) as PublicAnnotationInput & {
    extraData?: Record<string, unknown>;
    extraDataList?: Record<string, unknown>[];
  };
  const count =
    value.taskParams.type === 'include' ? 1 : value.taskParams.records.length;
  if (!Number.isInteger(draft.index) || draft.index < 0 || draft.index >= count)
    throw new Error(t('Invalid annotation data location'));
  if (value.taskParams.type === 'include')
    value.taskResult = structuredClone(draft.result);
  else {
    value.taskParams.taskResults ||= value.taskParams.records.map(
      () => undefined,
    );
    value.taskParams.taskResults[draft.index] = structuredClone(draft.result);
  }
  if (draft.segmentation) {
    const id = crypto.randomUUID();
    const file = new File(
      [new Uint8Array(draft.segmentation)],
      'segmentation.sdbf',
      { type: 'application/octet-stream' },
    );
    stageImport(owner, {
      id,
      name: file.name,
      totalSize: file.size,
      files: [{ path: file.name, file }],
      records: [],
    });
    const extra = { segmentationDataUrl: localURL(id, file.name) };
    if (value.taskParams.type === 'include')
      value.extraData = { ...value.extraData, ...extra };
    else {
      value.extraDataList ||= value.taskParams.records.map(() => ({}));
      value.extraDataList[draft.index] = {
        ...value.extraDataList[draft.index],
        ...extra,
      };
    }
  }
  return value;
}

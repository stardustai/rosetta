import { t } from '../i18n';
import type { PublicAnnotationInput } from '../annotation/schema';
import type { NewTask } from './storage';
import { appendTaskInput } from './taskInput';
import { adoptStagedImports } from './stagedImports';

const drafts = new Map<
  string,
  {
    owner: object;
    input: PublicAnnotationInput;
    details: Array<{ name: string; description?: string }>;
  }
>();

export function prepareQuickDraft(tasks: NewTask[], owner: object) {
  if (!tasks.length) throw new Error(t('Select data to preview first'));
  const id = crypto.randomUUID();
  const input = tasks
    .slice(1)
    .reduce(
      (value, task) => appendTaskInput(value, task.input),
      tasks[0].input,
    );
  drafts.set(id, {
    owner,
    input,
    details: tasks.map(({ name, description }) => ({ name, description })),
  });
  return id;
}
export function takeQuickDraft(id: string, owner: object) {
  const draft = drafts.get(id);
  if (!draft)
    throw new Error(
      t('This temporary preview has ended. Select the files again.'),
    );
  drafts.delete(id);
  adoptStagedImports(draft.owner, owner);
  return draft;
}

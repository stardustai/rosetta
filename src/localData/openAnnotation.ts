import { t } from '../i18n';
import type { PublicAnnotationInput } from '../annotation/schema';
import { getPathWithBase, history } from '../navigation';
import { prepareCredentialHandoff } from '../objectStorage/handoff';
import { connectionProfiles } from '../objectStorage/registry';
import type { QuickSessionState } from './quickSession';
import {
  deleteAnnotationPreview,
  prepareAnnotationPreview,
} from './annotationPreview';
import type { AnnotationSession } from './storage';
import {
  loadSession,
  saveSession,
  saveSessionIndex,
  startSession,
} from './storage';

// Call directly from the click handler: reserve the tab before any async work.
export async function openAnnotationPreview(
  prepare: () => Promise<{
    input: PublicAnnotationInput;
    index: number;
    quickSession: QuickSessionState;
  }>,
) {
  const target = window.open('about:blank', '_blank');
  if (!target)
    throw new Error(
      t(
        'The browser blocked the new page. Allow pop-ups for this site and try again.',
      ),
    );
  let id: string;
  let cancelHandoff: (() => void) | undefined;
  try {
    const { input, index, quickSession } = await prepare();
    if (target.closed)
      throw new Error(t('The annotation page has closed. Open it again.'));
    const sources = connectionProfiles(input);
    const preview = await prepareAnnotationPreview(
      input,
      index,
      quickSession,
      sources,
    );
    id = preview.id;
    if (target.closed)
      throw new Error(t('The annotation page has closed. Open it again.'));
    if (sources.length)
      cancelHandoff = prepareCredentialHandoff(target, id, sources);
    else target.opener = null;
    target.location.replace(getPathWithBase(`/annotate#preview/${id}`));
  } catch (error) {
    cancelHandoff?.();
    target.close();
    if (id) await deleteAnnotationPreview(id).catch(() => {});
    throw error;
  }
}

export async function openAnnotation(
  input: PublicAnnotationInput,
  target: Window | null,
  sessionId?: string,
  contentRevision?: number,
) {
  const session = await saveSession(input, sessionId, undefined, undefined, {
    preserveResults: true,
    requireExisting: !!sessionId,
    expectedRevision: contentRevision,
  });
  navigateToSession(
    await startSession(session.id, session.contentRevision),
    target,
  );
}

export async function openSavedAnnotation(
  id: string,
  target: Window | null,
  index?: number,
  expectedRevision?: number,
) {
  const session = await loadSession(id);
  if (expectedRevision != null && expectedRevision !== session.contentRevision)
    throw new Error(
      t('The task data has changed. Refresh the task details and try again.'),
    );
  if (index != null) await saveSessionIndex(id, index, session.contentRevision);
  navigateToSession(await startSession(id, session.contentRevision), target);
}

function navigateToSession(
  session: AnnotationSession,
  target: Window | null,
  index?: number,
) {
  const position = index != null ? `?index=${index}` : '';
  const url = getPathWithBase(`/annotate${position}#session/${session.id}`);
  if (target) {
    if (session.cloudSources?.length)
      prepareCredentialHandoff(target, session.id, session.cloudSources);
    else target.opener = null;
    target.location.replace(url);
  } else history.push(url);
}

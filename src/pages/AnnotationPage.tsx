import { LanguageSelect } from '../LanguageProvider';
import { useLanguage, getLanguage, t } from '../i18n';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type {
  PublicAnnotationInput,
  TaskParams,
  TaskResult,
} from '../annotation/schema';
import type { RosettaAnnotationDraft } from '../annotation/contracts/frame-v1';
import { Alert, Button, Dropdown, Modal, message } from 'antd';
import { fetchResourceURL } from '../annotation/configuration';
import { GlobalSpinner } from '../annotation/GlobalSpinner';
import { useLocation, useNavigate } from 'react-router-dom';
import { validateSchema } from '../annotation/schema';
import { get } from 'idb-keyval';
import { useCallback, useEffect, useState } from 'react';
import ExportTaskModal from '../exports/ExportTaskModal';
import { loadAnnotationPreview } from '../localData/annotationPreview';
import type { AnnotationPreview } from '../localData/annotationPreview';
import { openSavedAnnotation } from '../localData/openAnnotation';
import type { AnnotationSession } from '../localData/storage';
import {
  loadSession,
  saveSessionDraft,
  saveSessionIndex,
  saveSessionResult,
} from '../localData/storage';
import CloudConnectionForm from '../objectStorage/CloudConnectionForm';
import { receiveCredentialHandoff } from '../objectStorage/handoff';
import {
  connectionProfiles,
  restoreSavedConnections,
} from '../objectStorage/registry';
import type { StorageSource } from '../objectStorage/types';
import AnnotationWorkspace from './AnnotationWorkspace';
import QuickAnnotationPage from './QuickAnnotationPage';
import AnnotationTaskDrawer from './tasks/AnnotationTaskDrawer';
import ImportSharedData from './tasks/ImportSharedData';
import { useTaskList } from './tasks/useLocalTasks';

async function readInput() {
  const hash = window.location.hash.split('----')[0];
  if (hash.startsWith('#preview/')) {
    // Preserve older example protocols supported by the SDK, including matrix
    // time frames. Strict JSON-import validation applies to shared input below.
    const preview = await loadAnnotationPreview(
      decodeURIComponent(hash.slice('#preview/'.length)),
    );
    return { preview };
  }
  if (hash.startsWith('#session/')) {
    const value = await loadSession(
      decodeURIComponent(hash.slice('#session/'.length)),
    );
    const position = new URLSearchParams(window.location.search).get('index');
    const index = position == null ? value.index : Number(position);
    return Number.isInteger(index) && index >= 0
      ? {
          ...value,
          index: Math.min(
            index,
            Math.max(
              0,
              (value.input.taskParams.type === 'include'
                ? 1
                : value.input.taskParams.records.length) - 1,
            ),
          ),
        }
      : value;
  }
  let input: PublicAnnotationInput;
  if (hash === '#fromLocalStorage')
    input = JSON.parse(
      localStorage.getItem('_publicAnnotationInput') || 'null',
    );
  else if (hash === '#fromIndexDB') input = await get('_publicAnnotationInput');
  else if (hash === '#fromWindow')
    input = (window as any)._publicAnnotationInput;
  else if (hash.startsWith('#fromLink/'))
    input = await (
      await fetch(
        await fetchResourceURL(
          decodeURIComponent(hash.slice('#fromLink/'.length)),
        ),
      )
    ).json();
  else input = JSON.parse(decodeURIComponent(hash.slice(1)));
  if (!input)
    throw new Error(
      t('Annotation data was not found. Reopen it from the task list'),
    );
  const check = validateSchema('PublicAnnotationInput', input);
  if (!check.valid) throw new Error(check.errorMessage);
  return { incoming: input };
}

export default function AnnotationPage() {
  useLanguage();
  const location = useLocation();
  return <AnnotationSessionPage key={location.hash} />;
}

function AnnotationSessionPage() {
  useLanguage();
  const navigate = useNavigate();
  const isPreview = useLocation().hash.startsWith('#preview/');
  const [session, setSession] = useState<AnnotationSession>();
  const [incoming, setIncoming] = useState<PublicAnnotationInput>();
  const [preview, setPreview] = useState<AnnotationPreview>();
  const [savedAt, setSavedAt] = useState<number>();
  const [error, setError] = useState('');
  const [editingSource, setEditingSource] = useState<StorageSource>();
  const [saving, setSaving] = useState(false);
  const [, setCurrentIndex] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [blockingDialogOpen, setBlockingDialogOpen] = useState(false);
  const [taskListOpen, setTaskListOpen] = useState(false);
  const { tasks, loading: tasksLoading, error: tasksError } = useTaskList();
  const ordered = [...tasks].sort(
    (a, b) =>
      a.createdAt - b.createdAt ||
      a.name.localeCompare(b.name, getLanguage(), { numeric: true }) ||
      a.id.localeCompare(b.id),
  );
  const position = ordered.findIndex((task) => task.id === session?.id);
  function changeData(id: string) {
    setTaskListOpen(false);
    if (id === session?.id) return;
    Modal.confirm({
      title: t('Switch annotation data'),
      content: t('Submit the current annotation before switching tasks.'),
      okText: t('Switch data'),
      onOk: () => openSavedAnnotation(id, null),
    });
  }
  useEffect(() => {
    let disposed = false;
    readInput()
      .then(async (value) => {
        if ('incoming' in value) {
          if (!disposed) setIncoming(value.incoming);
          return;
        }
        const data = 'preview' in value ? value.preview : value;
        const sources = connectionProfiles(data.input, data.cloudSources);
        try {
          await restoreSavedConnections(sources);
        } catch {
          /* The connection form can still recover unavailable local profiles. */
        }
        await receiveCredentialHandoff(data.id, sources);
        if (disposed) return;
        if ('preview' in value) {
          setPreview({ ...value.preview, cloudSources: sources });
          return;
        }
        const restored = { ...value, cloudSources: sources };
        setSavedAt(value.lastSavedAt);
        setCurrentIndex(value.index);
        setSession(restored);
      })
      .catch((error) => !disposed && setError(error.message));
    return () => {
      disposed = true;
    };
  }, []);
  const save = useCallback(
    async (
      result: TaskResult,
      _params: TaskParams,
      index: number,
      draft?: RosettaAnnotationDraft,
    ) => {
      setSaving(true);
      try {
        if (draft?.segmentation)
          await saveSessionDraft(
            session!.id,
            { ...draft, index, result },
            session!.contentRevision,
          );
        const saved = await saveSessionResult(
          session!.id,
          result,
          index,
          session!.contentRevision,
        );
        setSavedAt(saved.lastSavedAt);
      } finally {
        setSaving(false);
      }
    },
    [session?.id],
  );
  const changeIndex = useCallback(
    (index: number) => {
      if (!session) return;
      setCurrentIndex(index);
      saveSessionIndex(session.id, index, session.contentRevision).catch(
        (error) => message.error(error.message),
      );
    },
    [session?.id],
  );
  const saveBeforeProtectionExit = useCallback(
    async (draft: RosettaAnnotationDraft) => {
      if (!session)
        throw new Error(
          t('The task has not finished loading. Try again later'),
        );
      await saveSessionDraft(session.id, draft, session.contentRevision);
    },
    [session?.id, session?.contentRevision],
  );
  const sources = session?.cloudSources || [];
  const header = (
    <>
      <header className="annotation-session-toolbar">
        <LanguageSelect />
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={saving}
          onClick={() => {
            if (isPreview) window.close();
            if (!window.closed)
              navigate(isPreview ? '/annotationTool' : '/tasks');
          }}
        >
          {isPreview ? t('Back to tool configuration') : t('Back to task list')}
        </Button>
        <div className="annotation-session-context">
          <small>
            {isPreview ? t('Data annotation') : t('Task annotation')}
          </small>
          <strong title={session?.name}>
            {session?.name ||
              (isPreview ? t('Opening annotation data') : t('Opening task'))}
          </strong>
        </div>
        {session && (
          <span className="annotation-session-position">
            {t('Task')}
            {Math.max(0, position) + 1} / {ordered.length || 1}
          </span>
        )}
        <span
          className="annotation-session-save ml-auto text-workspace-muted text-[11px]"
          role="status"
        >
          {saving
            ? t('Saving results…')
            : savedAt
            ? t('Last submitted {{v0}}', {
                v0: new Date(savedAt).toLocaleTimeString(getLanguage()),
              })
            : t('Annotation results are saved after submission')}
        </span>
        {session && (
          <>
            <Button
              disabled={saving || blockingDialogOpen}
              onClick={() => setTaskListOpen(true)}
            >
              {t('Task list')}
            </Button>
            <Button
              disabled={saving || position <= 0}
              onClick={() => changeData(ordered[position - 1].id)}
            >
              {t('Previous')}
            </Button>
            <Button
              disabled={
                saving || position < 0 || position >= ordered.length - 1
              }
              onClick={() => changeData(ordered[position + 1].id)}
            >
              {t('Next')}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              disabled={saving || blockingDialogOpen}
              onClick={() => setExportOpen(true)}
            >
              {t('Export')}
            </Button>
            {!!sources.length && (
              <Dropdown
                trigger={['click']}
                disabled={saving}
                menu={{
                  items: [
                    ...(sources.length
                      ? [
                          ...sources.map((source) => ({
                            key: `${source.provider}:${source.bucket}`,
                            label: t('Update connection · {{v0}}', {
                              v0: source.bucket,
                            }),
                            onClick: () => setEditingSource(source),
                          })),
                        ]
                      : []),
                  ],
                }}
              >
                <Button
                  icon={<MoreOutlined />}
                  aria-label={t('Annotation workspace actions')}
                />
              </Dropdown>
            )}
          </>
        )}
      </header>
      {session && (
        <AnnotationTaskDrawer
          open={taskListOpen && !blockingDialogOpen}
          tasks={ordered}
          currentTaskId={session.id}
          loading={tasksLoading}
          error={tasksError}
          disabled={saving}
          onSelect={changeData}
          onClose={() => setTaskListOpen(false)}
        />
      )}
      {exportOpen && session && (
        <ExportTaskModal
          sessionId={session.id}
          open={!blockingDialogOpen}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  );
  if (preview) return <QuickAnnotationPage preview={preview} />;
  if (incoming)
    return (
      <div className="cloud-annotation-page flex flex-col w-full h-full min-h-0 annotation-focus-page">
        {header}
        <ImportSharedData input={incoming} />
      </div>
    );
  if (error)
    return (
      <div className="cloud-annotation-page flex flex-col w-full h-full min-h-0 annotation-focus-page">
        {header}
        <div className="cloud-access-page">
          <Alert type="error" showIcon message={error} />
        </div>
      </div>
    );
  if (!session)
    return (
      <div className="cloud-annotation-page flex flex-col w-full h-full min-h-0 annotation-focus-page">
        {header}
        <GlobalSpinner />
      </div>
    );
  return (
    <div className="cloud-annotation-page flex flex-col w-full h-full min-h-0 annotation-focus-page">
      {header}
      <AnnotationWorkspace
        taskId={session.id}
        sources={sources}
        input={session.input}
        initialIndex={session.index}
        onSave={save}
        onChangeIndex={changeIndex}
        onProtectionSave={saveBeforeProtectionExit}
        onBlockingDialogChange={setBlockingDialogOpen}
      />
      <Modal
        title={t('Update object storage connection')}
        open={!!editingSource}
        onCancel={() => setEditingSource(undefined)}
        destroyOnClose
        footer={null}
        width={800}
      >
        {editingSource && (
          <CloudConnectionForm
            key={`${editingSource.provider}:${editingSource.bucket}`}
            initial={editingSource}
            fixedSource
            onConnected={() => setEditingSource(undefined)}
          />
        )}
      </Modal>
    </div>
  );
}

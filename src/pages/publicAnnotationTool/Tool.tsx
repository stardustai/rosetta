import { AlgorithmEditor, OperatorsEditor } from '../../annotationService';
import { useLanguage, getLanguage, t } from '../../i18n';
import {
  ArrowRightOutlined,
  DatabaseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Alert, Button, Modal, Select, Tooltip, message } from 'antd';
import { GlobalSpinner } from '../../annotation/GlobalSpinner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { PublicAnnotationInput } from '../../annotation/schema';
import { debounce } from 'lodash';
import { reaction, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { ElementRef, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { loadSession } from '../../localData/storage';
import { openAnnotationPreview } from '../../localData/openAnnotation';
import { QuickSession } from '../../localData/quickSession';
import { dataKindLabels, kindFromRecord } from '../../localData/recordKind';
import { recordName } from '../../localData/sessionInfo';
import TaskLayout from '../tasks/TaskLayout';
import CacheManagerModal from './components/CacheManagerModal';
import DataPreview from './components/DataPreview';
import SceneSelect from './SceneSelect';
import { takeQuickDraft } from '../../localData/quickDrafts';
import {
  formatType,
  PublicAnnotationToolStore,
} from './PublicAnnotationToolStore';
const JsonEditor = lazy(() => import('./JSONEdit'));
const PublicAnnotationJSONEditor = observer(
  ({ store }: { store: PublicAnnotationToolStore }) => {
    useLanguage();
    const jsonEditorRef = useRef<ElementRef<typeof JsonEditor>>(null);
    return (
      <Suspense fallback={<GlobalSpinner />}>
        <JsonEditor
          ref={jsonEditorRef}
          value={store.input}
          onChange={(value) => store.setDataWithString(value)}
        />
      </Suspense>
    );
  },
);
const PublicAnnotationOperatorsEditor = observer(
  ({ store }: { store: PublicAnnotationToolStore }) => {
    useLanguage();
    return (
      <div className="annotation-operator-editor">
        {store.records.length ? (
          <OperatorsEditor
            input={toJS(store.input)}
            initialIndex={store.activeRecordIndex}
            onInputChange={(input) => store.setData(input, true)}
            onProtectionSave={async () => {
              store.setDataWithString.flush();
              if (store.error) throw store.error;
              await store.persistProtectionDraft();
            }}
          />
        ) : (
          <div className="annotation-tools-empty flex items-center justify-center h-[var(--annotation-editor-height)] text-[var(--ant-color-text-tertiary,_#8a8a8a)] text-[12px] rounded-lg bg-white dark:bg-gray-900">
            {t('Upload data to automatically match annotation tools')}
          </div>
        )}
      </div>
    );
  },
);
export const PublicAnnotationAlgoEditor = observer(
  ({ store }: { store: PublicAnnotationToolStore }) => {
    useLanguage();
    return store.records.length ? (
      <AlgorithmEditor
        input={toJS(store.input)}
        initialIndex={store.activeRecordIndex}
        onInputChange={(input) => store.setData(input, true)}
      />
    ) : (
      <div className="annotation-tools-empty flex items-center justify-center h-[var(--annotation-editor-height)] text-[var(--ant-color-text-tertiary,_#8a8a8a)] text-[12px] rounded-lg bg-white dark:bg-gray-900">
        {t('Upload data to configure algorithm assistance')}
      </div>
    );
  },
);
const formatTypeToName = (format: formatType) => {
  switch (format) {
    case formatType.OperatorEditor:
      return t('Annotation tools');
    case formatType.AlgoEditor:
      return t('Algorithm assistance');
    case formatType.JSON:
      return t('JSON');
  }
};

const PublicAnnotationTool = observer(function () {
  useLanguage();
  const [store] = useState(() => new PublicAnnotationToolStore());
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const taskId = params.get('task');
  const legacyTasks = params.has('tasks');
  const draftId = params.get('draft');
  const [loadingTask, setLoadingTask] = useState(!!taskId);
  const [taskError, setTaskError] = useState('');
  const [busy, setBusy] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSavedAt, setConfigSavedAt] = useState<number>();
  const [savedCount, setSavedCount] = useState(0);
  const [showCacheManager, setShowCacheManager] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => () => store.dispose(), [store]);
  useEffect(
    () =>
      reaction(
        () => toJS(store.input),
        () => {
          if (!store.managedTask) setConfigSavedAt(undefined);
        },
      ),
    [store],
  );

  useEffect(() => {
    if (legacyTasks) {
      navigate('/tasks', { replace: true });
      return;
    }
    let disposed = false;
    setTaskError('');
    setSavedCount(0);
    if (!taskId) {
      store.resetCustom();
      if (draftId) {
        try {
          const draft = takeQuickDraft(draftId, store);
          store.setData(draft.input, false);
          store.quickSession.setDetails(draft.details);
        } catch (error) {
          setTaskError((error as Error).message);
        }
      }
      setLoadingTask(false);
      return;
    }
    setLoadingTask(true);
    loadSession(taskId)
      .then((value) => {
        if (!disposed) {
          store.restoreTask(value);
        }
      })
      .catch((error) => !disposed && setTaskError(error.message))
      .finally(() => !disposed && setLoadingTask(false));
    return () => {
      disposed = true;
    };
  }, [taskId, draftId, legacyTasks, store, navigate]);

  useEffect(() => {
    if (!store.managedTask) return;
    const persist = debounce(
      async ({ id, input }: { id: string; input: PublicAnnotationInput }) => {
        setConfigSaving(true);
        try {
          await store.persistConfiguration(input, id);
          setConfigSavedAt(Date.now());
        } catch (error) {
          message.error(
            t('Failed to save task configuration: {{v0}}', {
              v0: (error as Error).message,
            }),
          );
        } finally {
          setConfigSaving(false);
        }
      },
      500,
    );
    const dispose = reaction(
      () => ({ id: store.sessionId, input: toJS(store.input) }),
      ({ id, input }) => {
        if (id && input) persist({ id, input });
        else persist.cancel();
      },
    );
    return () => {
      dispose();
      persist.cancel();
    };
  }, [store, store.managedTask]);

  async function captureCurrent() {
    store.setDataWithString.flush();
    if (store.error) throw store.error;
  }
  async function startAnnotation() {
    if (busy) return;
    setBusy(true);
    try {
      await openAnnotationPreview(async () => {
        await captureCurrent();
        if (store.managedTask) await store.persistTask();
        const input = await store.migrateInput();
        let quickSession = store.quickSession;
        if (store.managedTask && store.sessionId) {
          quickSession = new QuickSession();
          quickSession.linkTask(input, store.sessionId, store.contentRevision);
        }
        return {
          input,
          index: store.activeRecordIndex,
          quickSession: quickSession.snapshot(),
        };
      });
    } catch (error) {
      message.error(
        (error as Error).message ||
          t('Cannot open the annotation page. Try again'),
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveConfiguration() {
    await captureCurrent();
    if (store.managedTask) await store.persistTask();
    else {
      const input = await store.getFinalInput();
      const saved = await store.quickSession.saveAll(input);
      setSavedCount(saved.length);
    }
    setConfigSavedAt(Date.now());
  }
  async function saveToTasks() {
    if (busy) return;
    setBusy(true);
    try {
      await saveConfiguration();
      message.success(t('Saved as a local task'));
    } catch (error) {
      message.error((error as Error).message || t('Save failed. Try again'));
    } finally {
      setBusy(false);
    }
  }
  async function selectData(index: number) {
    if (busy) return;
    setBusy(true);
    try {
      await captureCurrent();
      store.selectRecord(index);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function openExample(input: PublicAnnotationInput) {
    setBusy(true);
    try {
      store.setData(input, false);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    Modal.confirm({
      title: t('Change data'),
      content: t('Save the current data and annotations before changing data.'),
      okText: t('Change data'),
      onOk: () => {
        store.resetCustom();
        setSavedCount(0);
        setConfigSavedAt(undefined);
      },
    });
  }

  function confirmLeaving(): Promise<boolean> {
    if (configSavedAt) return Promise.resolve(true);
    return new Promise((resolve) => {
      Modal.confirm({
        title: t('Leave the current annotation data?'),
        content: t('Save as a task first to keep your changes.'),
        okText: t('Leave workspace'),
        cancelText: t('Continue editing'),
        onOk: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  }

  if (loadingTask)
    return (
      <TaskLayout>
        <GlobalSpinner />
      </TaskLayout>
    );
  if (taskError)
    return (
      <TaskLayout>
        <Alert
          type="error"
          showIcon
          message={taskError}
          action={
            <Button onClick={() => navigate('/tasks')}>
              {t('Back to task list')}
            </Button>
          }
        />
      </TaskLayout>
    );
  const hasData = store.records.length > 0;
  const active = store.records[store.activeRecordIndex];
  const kind = kindFromRecord(active);
  return (
    <TaskLayout
      task={
        store.managedTask && store.sessionId
          ? { id: store.sessionId, name: store.taskName || t('Current task') }
          : undefined
      }
      section="configuration"
      contentClassName={'annotation-tool-page-content'}
      onStartNew={hasData && !store.managedTask ? reset : undefined}
      onBeforeNavigate={
        hasData && !store.managedTask
          ? confirmLeaving
          : store.managedTask
          ? saveConfiguration
          : undefined
      }
      actions={
        <>
          <Tooltip title={t('Data cache management')}>
            <Button
              aria-label={t('Data cache management')}
              icon={<DatabaseOutlined />}
              onClick={() => setShowCacheManager(true)}
            />
          </Tooltip>
        </>
      }
      footer={
        <>
          <div className="workspace-footer-note">
            <strong>
              {t('{{count}} records', { count: store.records.length })}
              {savedCount ? t(' · {{v0}} tasks saved', { v0: savedCount }) : ''}
            </strong>
            <span>
              {configSaving
                ? t('Saving configuration…')
                : configSavedAt
                ? t('Saved · {{v0}}', {
                    v0: new Date(configSavedAt).toLocaleTimeString(
                      getLanguage(),
                    ),
                  })
                : store.managedTask
                ? t('Configuration is saved automatically on this device')
                : t('Data has not been saved as a task')}
            </span>
          </div>
          <Button
            disabled={busy || !hasData}
            loading={busy}
            onClick={saveToTasks}
          >
            {store.managedTask ? t('Save configuration') : t('Save as task')}
          </Button>
          <Button
            type="primary"
            disabled={busy || !hasData}
            onClick={startAnnotation}
          >
            {t('Start annotating')}
            <ArrowRightOutlined />
          </Button>
        </>
      }
    >
      {!store.managedTask && (
        <div>
          <SceneSelect
            store={store}
            onSelect={(input) => {
              void openExample(input);
            }}
          />
        </div>
      )}
      {hasData && (
        <div className="annotation-current-data">
          <span>
            {store.managedTask ? store.taskName : recordName(active)} ·{' '}
            {kind ? dataKindLabels[kind] : active?.attachmentType}
          </span>
          <div>
            {store.records.length > 1 && (
              <Select
                aria-label={t('Select current data')}
                value={store.activeRecordIndex}
                disabled={busy}
                options={store.records.map((record, index) => ({
                  value: index,
                  label: `${index + 1}. ${recordName(record)}`,
                }))}
                onChange={(index) => {
                  void selectData(index);
                }}
              />
            )}
            {!store.managedTask && (
              <Button size="small" disabled={busy} onClick={reset}>
                {t('Change data')}
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="annotation-tool-body">
        <div
          className="annotation-configuration-view"
          role="tabpanel"
          aria-label={t('Tool configuration and data preview')}
        >
          <div className="annotation-config-toolbar flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mb-3">
            <div
              className="annotation-config-tabs"
              role="tablist"
              aria-label={t('Annotation tool configuration')}
            >
              {[
                formatType.OperatorEditor,
                formatType.AlgoEditor,
                formatType.JSON,
              ].map((format) => (
                <button
                  type="button"
                  key={format}
                  aria-pressed={store.format === format}
                  role="tab"
                  onClick={() => store.setFormat(format)}
                >
                  {formatTypeToName(format)}
                </button>
              ))}
            </div>
            <Button
              size="small"
              icon={previewOpen ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              aria-expanded={previewOpen}
              onClick={() => setPreviewOpen((open) => !open)}
            >
              {previewOpen
                ? t('Collapse data and files')
                : t('View data and files')}
            </Button>
          </div>
          <div
            className="annotation-config-layout"
            data-preview-open={previewOpen}
          >
            <div className="annotation-config-main min-w-0 h-[var(--annotation-editor-height)] min-h-0">
              {store.format === formatType.OperatorEditor ? (
                <PublicAnnotationOperatorsEditor store={store} />
              ) : store.format === formatType.AlgoEditor ? (
                <PublicAnnotationAlgoEditor store={store} />
              ) : (
                <PublicAnnotationJSONEditor store={store} />
              )}
            </div>
            {previewOpen && (
              <DataPreview store={store} onAnnotate={startAnnotation} />
            )}
          </div>
        </div>
      </div>
      <CacheManagerModal
        visible={showCacheManager}
        onClose={() => setShowCacheManager(false)}
      />
    </TaskLayout>
  );
});

export default PublicAnnotationTool;

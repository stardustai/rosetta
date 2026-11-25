import { LanguageSelect } from '../LanguageProvider';
import { useLanguage, getLanguage, t } from '../i18n';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import type { RosettaAnnotationDraft } from '../annotation/contracts/frame-v1';
import type { RosettaAnnotationHandle } from '../annotation/EditorFrame';
import type { TaskParams, TaskResult } from '../annotation/schema';
import { Alert, Button, Modal, message } from 'antd';
import { GlobalSpinner } from '../annotation/GlobalSpinner';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import ExportTaskModal from '../exports/ExportTaskModal';
import type { AnnotationPreview } from '../localData/annotationPreview';
import {
  activateAnnotationPreview,
  checkpointAnnotationPreview,
} from '../localData/annotationPreview';
import { QuickSession } from '../localData/quickSession';
import { recordName, sessionRecords } from '../localData/sessionInfo';
import { applyAnnotationDraft } from '../localData/stagedImports';
import AnnotationWorkspace from './AnnotationWorkspace';

export default function QuickAnnotationPage({
  preview,
}: {
  preview: AnnotationPreview;
}) {
  useLanguage();
  const navigate = useNavigate();
  const editor = useRef<RosettaAnnotationHandle>(null);
  const [owner] = useState(() => ({}));
  const [quickSession] = useState(() => new QuickSession());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(preview.index);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number>();
  const [exportId, setExportId] = useState<string>();
  const [blockingDialogOpen, setBlockingDialogOpen] = useState(false);
  const current = useRef(preview);
  const input = useRef(preview.input);
  const pending = useRef(false);

  useEffect(() => {
    let disposed = false;
    const release = activateAnnotationPreview(preview, owner);
    quickSession
      .restore(preview.quickSession)
      .then(() => !disposed && setReady(true))
      .catch((error) => !disposed && setError((error as Error).message));
    return () => {
      disposed = true;
      release();
    };
  }, [preview, owner, quickSession]);

  const apply = useCallback(
    (draft: RosettaAnnotationDraft) => {
      input.current = applyAnnotationDraft(owner, input.current, draft);
    },
    [owner],
  );
  async function checkpoint(position: number) {
    current.current = await checkpointAnnotationPreview(
      current.current,
      input.current,
      position,
      quickSession.snapshot(),
    );
  }
  const save = useCallback(
    async (
      result: TaskResult,
      params: TaskParams,
      position: number,
      draft?: RosettaAnnotationDraft,
    ) => {
      if (pending.current) throw new Error(t('Saving. Try again shortly'));
      pending.current = true;
      setSaving(true);
      try {
        apply({ ...draft, result, params, index: position });
        await quickSession.saveResult(input.current, result, position);
        await checkpoint(position);
        setSavedAt(Date.now());
      } finally {
        pending.current = false;
        setSaving(false);
      }
    },
    [apply, quickSession],
  );
  const recover = useCallback(
    async (draft: RosettaAnnotationDraft) => {
      // saveSessionDraft writes segmentation once, after its local recovery task exists.
      apply({ ...draft, segmentation: undefined });
      await quickSession.recover(input.current, draft);
    },
    [apply, quickSession],
  );

  async function saveToTasks(exportCurrent = false) {
    if (!editor.current || pending.current) return;
    pending.current = true;
    setSaving(true);
    try {
      if (exportCurrent) await editor.current.authorizeExport();
      const operationId = await editor.current.authorizeSave();
      const draft = await editor.current.captureDraft();
      apply(draft);
      const saved = exportCurrent
        ? [await quickSession.saveCurrent(input.current, draft.index)]
        : await quickSession.saveAll(input.current);
      await checkpoint(draft.index);
      await editor.current.confirmSave(operationId);
      setSavedAt(Date.now());
      if (exportCurrent) setExportId(saved[0].id);
      else message.success(t('Saved {{v0}} tasks', { v0: saved.length }));
    } catch (error) {
      message.error((error as Error).message || t('Save failed. Try again'));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  const records = sessionRecords(preview.input);
  function returnToConfiguration() {
    Modal.confirm({
      title: t('Back to tool configuration'),
      content: t('Save the annotation before returning to configuration.'),
      okText: t('Back to configuration'),
      cancelText: t('Continue annotating'),
      onOk: () => {
        window.close();
        if (!window.closed) navigate('/annotationTool');
      },
    });
  }
  return (
    <div className="cloud-annotation-page flex flex-col w-full h-full min-h-0 annotation-focus-page">
      <header className="annotation-session-toolbar">
        <LanguageSelect />
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={saving}
          onClick={returnToConfiguration}
        >
          {t('Back to tool configuration')}
        </Button>
        <div className="annotation-session-context">
          <small>{t('Data annotation')}</small>
          <strong>{recordName(records[index])}</strong>
        </div>
        <span className="annotation-session-position">
          {t('Data')}
          {index + 1} / {records.length}
        </span>
        <span
          className="annotation-session-save ml-auto text-workspace-muted text-[11px]"
          role="status"
        >
          {saving
            ? t('Saving…')
            : savedAt
            ? t('Last saved {{v0}}', {
                v0: new Date(savedAt).toLocaleTimeString(getLanguage()),
              })
            : t('Results are stored in this browser')}
        </span>
        <Button disabled={saving || !ready} onClick={() => saveToTasks()}>
          {t('Save as task')}
        </Button>
        <Button
          icon={<DownloadOutlined />}
          disabled={saving || !ready || blockingDialogOpen}
          onClick={() => saveToTasks(true)}
        >
          {t('Export current data')}
        </Button>
      </header>
      {error ? (
        <div className="cloud-access-page">
          <Alert type="error" showIcon message={error} />
        </div>
      ) : ready ? (
        <AnnotationWorkspace
          taskId={preview.id}
          sources={preview.cloudSources}
          editorRef={editor}
          input={preview.input}
          initialIndex={preview.index}
          onChangeIndex={setIndex}
          onSave={save}
          onProtectionSave={recover}
          onBlockingDialogChange={setBlockingDialogOpen}
        />
      ) : (
        <GlobalSpinner />
      )}
      {exportId && (
        <ExportTaskModal
          sessionId={exportId}
          open={!blockingDialogOpen}
          onClose={() => setExportId(undefined)}
        />
      )}
    </div>
  );
}

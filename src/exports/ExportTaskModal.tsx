import { useLanguage, t } from '../i18n';
import { Alert, Button, Descriptions, Modal, Radio, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import type { SessionExport } from '../localData/export';
import { prepareSessionExport } from '../localData/export';
import { formatSize } from '../localData/files';
import { useSavedConnections } from '../objectStorage/useSavedConnections';
import type { ExportReceipt } from './deliver';
import { deliverExport } from './deliver';
import { apiExportURL } from './settings';
import type { ExportMethod } from './types';
import { useExportSettings } from './useExportSettings';

export default function ExportTaskModal({
  sessionId,
  onClose,
  open = true,
}: {
  sessionId: string;
  onClose: () => void;
  open?: boolean;
}) {
  useLanguage();
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
  } = useExportSettings();
  const {
    sources,
    loading: sourcesLoading,
    error: sourcesError,
  } = useSavedConnections();
  const [payload, setPayload] = useState<SessionExport>();
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<ExportMethod>('download');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<ExportReceipt>();
  const initialized = useRef(false);
  const sending = useRef(false);
  const source = sources.find(
    (value) => value.id === settings?.storage?.sourceId,
  );
  useEffect(() => {
    let disposed = false;
    prepareSessionExport(sessionId)
      .then((value) => {
        if (!disposed) setPayload(value);
      })
      .catch((error) => {
        if (!disposed) setError((error as Error).message);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [sessionId]);
  useEffect(() => {
    if (!settings || sourcesLoading || initialized.current) return;
    initialized.current = true;
    setMethod(
      settings.defaultMethod === 'api' && settings.api
        ? 'api'
        : settings.defaultMethod === 'storage' && source
        ? 'storage'
        : 'download',
    );
  }, [settings, sourcesLoading, source]);
  const ready =
    !!payload && !!settings && !loading && !settingsLoading && !sourcesLoading;
  const available =
    method === 'download' || (method === 'api' ? !!settings?.api : !!source);
  async function send() {
    if (!payload || !settings || !available || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      setReceipt(await deliverExport(payload, method, settings));
    } catch (error) {
      setError(
        (error as Error).message || t('Export failed. Please try again'),
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  let apiURL = '';
  if (settings?.api && payload) {
    try {
      apiURL = apiExportURL(settings.api.url, payload.taskId);
    } catch {
      /* The settings page can repair an invalid target. */
    }
  }
  return (
    <Modal
      title={t('Export task')}
      open={open}
      width={700}
      style={{ top: 32 }}
      bodyStyle={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}
      maskClosable={!busy}
      closable={!busy}
      keyboard={!busy}
      onCancel={onClose}
      footer={
        <div className="export-dialog-footer">
          <Link to="/exportSettings" target="_blank" rel="noopener noreferrer">
            {t('Export settings ↗')}
          </Link>
          {!receipt && (
            <Button disabled={busy} onClick={onClose}>
              {t('Cancel')}
            </Button>
          )}
          {receipt ? (
            <Button type="primary" onClick={onClose}>
              {t('Done')}
            </Button>
          ) : (
            <Button
              type="primary"
              loading={busy}
              disabled={!ready || !available}
              onClick={send}
            >
              {t('Export')}
            </Button>
          )}
        </div>
      }
    >
      {!ready && !error && !settingsError && !sourcesError && (
        <div className="task-loading flex items-center justify-center min-h-60 p-8">
          <Spin />
        </div>
      )}
      {payload && (
        <>
          <Descriptions size="small" column={1} className="export-task-summary">
            <Descriptions.Item label={t('Task')}>
              {payload.taskName}
            </Descriptions.Item>
            <Descriptions.Item label={t('Files')}>
              {payload.filename} · {formatSize(payload.blob.size)}
            </Descriptions.Item>
            <Descriptions.Item label={t('Data')}>
              {t('{{count}} records, ', { count: payload.recordCount })}
              {payload.legacyProgress
                ? t('Submission progress is unconfirmed')
                : t('{{v0}} submitted', { v0: payload.submittedCount })}
            </Descriptions.Item>
          </Descriptions>
          <p className="export-content-note mt-3 mx-0 mb-5 text-[var(--ant-color-text-secondary,_#92969e)] text-[12px] leading-[1.8]">
            {t(
              'Export data references, tool configuration, and saved results. Original files are stored separately.',
            )}
          </p>
          <Radio.Group
            className="export-method-options flex flex-wrap gap-3"
            value={method}
            disabled={busy}
            onChange={(event) => {
              setMethod(event.target.value);
              setReceipt(undefined);
              setError('');
            }}
          >
            <Radio value="download">{t('Local download')}</Radio>
            <Radio value="api" disabled={!settings?.api}>
              API{!settings?.api ? t('(not configured)') : ''}
            </Radio>
            <Radio value="storage" disabled={!source}>
              {t('Object storage')}
              {!source ? t('(not configured)') : ''}
            </Radio>
          </Radio.Group>
          <div className="export-target-preview">
            {method === 'download' ? (
              <span>{t('Download to this device')}</span>
            ) : method === 'api' ? (
              <>
                <strong>{settings?.api?.method}</strong>
                <span>{apiURL}</span>
              </>
            ) : (
              <>
                <strong>{source?.name}</strong>
                <span>
                  {source?.connection.provider.toUpperCase()} ·{' '}
                  {source?.connection.bucket} / {settings?.storage?.prefix}
                </span>
                <small>{payload.objectFilename}</small>
              </>
            )}
          </div>
        </>
      )}
      {(error || settingsError || sourcesError) && (
        <Alert
          type="error"
          showIcon
          message={error || settingsError || sourcesError}
          className="mt-3"
        />
      )}
      {settings?.storage && !source && !sourcesLoading && (
        <Alert
          type="info"
          showIcon
          message={t(
            'The export data source is unavailable. Select it again in export settings.',
          )}
          className="mt-3"
        />
      )}
      {receipt && (
        <Alert
          type="success"
          showIcon
          className="mt-3"
          message={
            receipt.method === 'api'
              ? t('API accepted the data, HTTP {{v0}}', { v0: receipt.status })
              : receipt.method === 'storage'
              ? t('Uploaded to object storage')
              : t('Download started')
          }
          description={
            receipt.method === 'storage' ? (
              <Typography.Paragraph className="export-location" copyable>
                {receipt.location}
              </Typography.Paragraph>
            ) : undefined
          }
        />
      )}
    </Modal>
  );
}

import { useLanguage, t } from '../../i18n';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Segmented, Select, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { saveExportSettings } from '../../exports/settings';
import type { ExportMethod, ExportSettings } from '../../exports/types';
import { useExportSettings } from '../../exports/useExportSettings';
import { useSavedConnections } from '../../objectStorage/useSavedConnections';
import TaskLayout from '../tasks/TaskLayout';

export default function ExportSettingsPage() {
  useLanguage();
  const navigate = useNavigate();
  const { settings, loading, error: loadError } = useExportSettings();
  const {
    sources,
    loading: sourcesLoading,
    error: sourceError,
  } = useSavedConnections();
  const [form] = Form.useForm<ExportSettings>();
  const method: ExportMethod =
    Form.useWatch('defaultMethod', form) || 'download';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hydrated = useRef(false);
  useEffect(() => {
    if (!settings || hydrated.current) return;
    hydrated.current = true;
    form.setFieldsValue({
      ...settings,
      api: settings.api || { url: '', method: 'POST', headers: [] },
      storage: settings.storage || {
        sourceId: undefined,
        prefix: 'annotation-results/',
      },
    });
  }, [settings, form]);
  return (
    <TaskLayout
      actions={
        <Button onClick={() => navigate('/tasks')}>
          {t('Back to task list')}
        </Button>
      }
      footer={
        <>
          <span className="workspace-footer-note">
            {t('Settings are stored in this browser')}
          </span>
          <Button
            type="primary"
            loading={busy}
            disabled={loading || !settings}
            onClick={() => form.submit()}
          >
            {t('Save settings')}
          </Button>
        </>
      }
    >
      <div className="task-page-heading">
        <div>
          <h1>{t('Export settings')}</h1>
          <p>{t('Choose an export method and enter the destination.')}</p>
        </div>
      </div>
      {(error || loadError || sourceError) && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={error || loadError || sourceError}
        />
      )}
      {loading ? (
        <div className="task-loading flex items-center justify-center min-h-60 p-8">
          <Spin />
        </div>
      ) : (
        settings && (
          <Form
            className="export-settings-form max-w-250 border border-solid border-workspace-border rounded-md bg-workspace-surface"
            layout="vertical"
            form={form}
            disabled={busy}
            onValuesChange={() => setError('')}
            onFinish={async () => {
              setBusy(true);
              setError('');
              try {
                const saved = await saveExportSettings(
                  form.getFieldsValue(true),
                );
                form.setFieldsValue({
                  ...saved,
                  api: saved.api || { url: '', method: 'POST', headers: [] },
                  storage: saved.storage || {
                    sourceId: undefined,
                    prefix: 'annotation-results/',
                  },
                });
                message.success(t('Export settings saved'));
              } catch (error) {
                setError(
                  (error as Error).message || t('Save failed. Try again'),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <section className="export-settings-switch">
              <h2>{t('Export method')}</h2>
              <p>{t('Use this as the default export method after saving.')}</p>
              <Form.Item name="defaultMethod" initialValue="download">
                <Segmented
                  block
                  disabled={busy}
                  aria-label={t('Export method')}
                  options={[
                    {
                      value: 'download',
                      label: t('Local download'),
                      icon: <DownloadOutlined />,
                    },
                    { value: 'api', label: 'API', icon: <LinkOutlined /> },
                    {
                      value: 'storage',
                      label: t('Object storage'),
                      icon: <CloudUploadOutlined />,
                    },
                  ]}
                />
              </Form.Item>
            </section>
            {method === 'download' && (
              <section className="export-settings-section export-settings-local">
                <DownloadOutlined />
                <h2>{t('Download annotation results to this device')}</h2>
                <p>
                  {t(
                    'Download JSON containing data references, tool configuration, and saved results.',
                  )}
                </p>
              </section>
            )}
            {method === 'api' && (
              <section
                className="export-settings-section"
                aria-label={t('API export configuration')}
              >
                <h2>{t('API export')}</h2>
                <p>
                  {t(
                    'Send JSON. Export completes when the endpoint returns HTTP 2xx.',
                  )}
                </p>
                <div className="export-api-address">
                  <Form.Item
                    name={['api', 'method']}
                    label={t('Request method')}
                  >
                    <Select
                      options={['POST', 'PUT'].map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name={['api', 'url']}
                    label={t('Destination URL')}
                    extra={t(
                      'Supports the {taskId} placeholder, such as https://example.com/api/tasks/{taskId}/annotations',
                    )}
                  >
                    <Input
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="https://example.com/api/annotations"
                    />
                  </Form.Item>
                </div>
                <div className="export-headers-label text-[12px] mb-3">
                  {t(
                    'Request headers (optional; for Authorization, X-API-Key, and other authentication)',
                  )}
                </div>
                <Form.List name={['api', 'headers']}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <div className="export-header-row" key={field.key}>
                          <Form.Item name={[field.name, 'name']}>
                            <Input
                              aria-label={t('Header name')}
                              placeholder={t('For example, Authorization')}
                              autoComplete="off"
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, 'value']}>
                            <Input.Password
                              aria-label={t('Header value')}
                              placeholder={t('For example, Bearer token')}
                              autoComplete="new-password"
                            />
                          </Form.Item>
                          <Button
                            icon={<DeleteOutlined />}
                            aria-label={t('Delete header')}
                            onClick={() => remove(field.name)}
                          />
                        </div>
                      ))}
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => add({ name: '', value: '' })}
                      >
                        {t('Add header')}
                      </Button>
                    </>
                  )}
                </Form.List>
                <p className="export-settings-note">
                  {t(
                    'The request body is PublicAnnotationInput JSON. The endpoint must allow cross-origin requests from this site. Authentication headers are stored locally.',
                  )}
                </p>
              </section>
            )}
            {method === 'storage' && (
              <section
                className="export-settings-section"
                aria-label={t('Object storage export configuration')}
              >
                <h2>{t('Object storage export')}</h2>
                <p>
                  {t(
                    'Select an OSS, OBS, or TOS data source to upload task JSON.',
                  )}
                </p>
                <Form.Item
                  name={['storage', 'sourceId']}
                  label={t('Destination data source')}
                  extra={t('Manage connections in Data sources.')}
                >
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    loading={sourcesLoading}
                    placeholder={t('Select data source')}
                    options={sources.map((source) => ({
                      value: source.id,
                      label: `${
                        source.name
                      } · ${source.connection.provider.toUpperCase()} / ${
                        source.connection.bucket
                      }`,
                    }))}
                    onChange={(id) => {
                      const source = sources.find((value) => value.id === id);
                      form.setFieldsValue({
                        storage: {
                          prefix: `${
                            source?.connection.prefix || ''
                          }annotation-results/`,
                        },
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name={['storage', 'prefix']}
                  label={t('Export directory')}
                  extra={t(
                    'Enter a directory prefix within the bucket. Each export creates a new file.',
                  )}
                >
                  <Input
                    placeholder={t('For example, annotation-results/')}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Form.Item>
                <p className="export-settings-note">
                  {t(
                    'The credentials must allow PutObject uploads to this directory. Bucket CORS must allow PUT requests from this site.',
                  )}
                </p>
              </section>
            )}
          </Form>
        )
      )}
    </TaskLayout>
  );
}

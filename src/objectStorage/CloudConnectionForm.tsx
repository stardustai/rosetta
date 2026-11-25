import { useLanguage, t } from '../i18n';
import { Alert, Button, Checkbox, Form, Input, Popconfirm, Select } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createStorageClient, storageError } from './adapters';
import { defaultEndpoint, normalizeConnection, publicSource } from './paths';
import { rememberConnection } from './registry';
import { deleteSavedConnection, saveConnection } from './savedConnections';
import type {
  SavedStorageConnection,
  StorageClient,
  StorageConnection,
  StoragePage,
  StorageSource,
} from './types';
import { defaultRegions, providerLabels } from './types';
import { useSavedConnections } from './useSavedConnections';

export interface ConnectedStorage {
  source: StorageSource;
  client: StorageClient;
  page: StoragePage;
}

export default function CloudConnectionForm({
  initial,
  fixedSource = false,
  showSavedConnections = true,
  editing,
  manage = false,
  onSaved,
  onCancel,
  onBusyChange,
  onConnected,
}: {
  initial?: Partial<StorageSource>;
  fixedSource?: boolean;
  showSavedConnections?: boolean;
  editing?: SavedStorageConnection;
  manage?: boolean;
  onSaved?: (value: SavedStorageConnection) => void;
  onCancel?: () => void;
  onBusyChange?: (busy: boolean) => void;
  onConnected?: (value: ConnectedStorage) => void;
}) {
  useLanguage();
  const [form] = Form.useForm<
    StorageConnection & { connectionName?: string; remember: boolean }
  >();
  const [provider, setProvider] = useState(initial?.provider || 'oss');
  const { sources, loading, error: loadError } = useSavedConnections();
  const saved = useMemo(
    () =>
      sources.filter(
        (value) =>
          !fixedSource ||
          (value.connection.provider === initial?.provider &&
            value.connection.bucket === initial?.bucket &&
            (!initial?.region || initial.region === value.connection.region) &&
            (!initial?.endpoint ||
              initial.endpoint === value.connection.endpoint)),
      ),
    [
      sources,
      fixedSource,
      initial?.provider,
      initial?.bucket,
      initial?.region,
      initial?.endpoint,
    ],
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tested, setTested] = useState(false);
  const request = useRef(0);
  const hydrated = useRef(false);
  const sourceKey = JSON.stringify(initial);
  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  function selectSaved(value?: SavedStorageConnection) {
    const connection = value?.connection;
    setSelectedId(value?.id);
    setProvider(connection?.provider || initial?.provider || 'oss');
    form.setFieldsValue({
      provider: initial?.provider || 'oss',
      region: defaultRegions[initial?.provider || 'oss'],
      bucket: '',
      endpoint: '',
      prefix: '',
      accessKeyId: '',
      accessKeySecret: '',
      securityToken: '',
      ...initial,
      ...connection,
      connectionName: value?.name || '',
      remember: true,
    });
    setError('');
    setTested(false);
  }
  useEffect(() => {
    hydrated.current = false;
    setBusy(false);
    selectSaved(editing);
    return () => {
      request.current++;
    };
  }, [editing?.id, manage, showSavedConnections, sourceKey]);
  useEffect(() => {
    if (manage || !showSavedConnections || loading || hydrated.current) return;
    hydrated.current = true;
    if (saved[0]) selectSaved(saved[0]);
  }, [manage, showSavedConnections, loading, saved, sourceKey]);

  async function testConnection() {
    const current = ++request.current;
    try {
      const values = await form.validateFields();
      if (current !== request.current) return;
      const connection = normalizeConnection(values);
      setBusy(true);
      setError('');
      setTested(false);
      const client = await createStorageClient(connection);
      if (current !== request.current) return;
      await client.list({ prefix: connection.prefix, delimiter: '/' });
      if (current === request.current) setTested(true);
    } catch (error) {
      if (
        current === request.current &&
        !(error && typeof error === 'object' && 'errorFields' in error)
      )
        setError(storageError(error));
    } finally {
      if (current === request.current) setBusy(false);
    }
  }
  return (
    <Form
      form={form}
      preserve={false}
      disabled={busy}
      layout="vertical"
      initialValues={{
        provider: 'oss',
        region: defaultRegions[initial?.provider || 'oss'],
        prefix: '',
        remember: true,
        ...initial,
      }}
      onValuesChange={() => {
        setTested(false);
        setError('');
      }}
      onFinish={async (values) => {
        const current = ++request.current;
        setBusy(true);
        setError('');
        let connection: StorageConnection;
        let saving = false;
        try {
          connection = normalizeConnection(values);
        } catch (error) {
          setError((error as Error).message);
          setBusy(false);
          return;
        }
        try {
          const client = await createStorageClient(connection);
          if (current !== request.current) return;
          if (manage) {
            saving = true;
            const saved = await saveConnection(
              connection,
              values.connectionName,
              {
                previousId: editing?.id,
                requireNew: !editing,
              },
            );
            if (current !== request.current) return;
            rememberConnection(connection, client);
            onSaved?.(saved);
            return;
          }
          const page = await client.list({
            prefix: connection.prefix,
            delimiter: '/',
          });
          if (current !== request.current) return;
          saving = true;
          if (values.remember)
            await saveConnection(connection, values.connectionName);
          else await deleteSavedConnection(connection);
          if (current !== request.current) return;
          rememberConnection(connection, client);
          form.setFieldsValue({
            accessKeyId: '',
            accessKeySecret: '',
            securityToken: '',
          });
          onConnected?.({ source: publicSource(connection), client, page });
        } catch (error) {
          if (current === request.current)
            setError(
              manage
                ? (error as Error).message ||
                    t('Failed to save the data source. Try again')
                : saving
                ? t(
                    'Connected, but saving locally failed. Check browser storage or clear “Save connection on this device” and try again.',
                  )
                : storageError(error),
            );
        } finally {
          if (current === request.current) setBusy(false);
        }
      }}
    >
      {!manage && showSavedConnections && saved.length > 0 && (
        <div className="cloud-saved-connection">
          <span>{t('Saved connections')}</span>
          <Select
            aria-label={t('Saved connections')}
            value={selectedId}
            disabled={busy}
            allowClear
            placeholder={t('Select a saved connection')}
            options={saved.map((value) => ({
              value: value.id,
              label: `${
                value.name
              } · ${value.connection.provider.toUpperCase()} / ${
                value.connection.bucket
              }`,
            }))}
            onChange={(id) =>
              selectSaved(saved.find((value) => value.id === id))
            }
          />
          {selectedId && (
            <Popconfirm
              title={t('Delete this locally saved connection?')}
              onConfirm={async () => {
                const value = saved.find((item) => item.id === selectedId);
                if (!value) return;
                try {
                  await deleteSavedConnection(value.connection);
                  selectSaved();
                } catch {
                  setError(t('Failed to delete the connection. Try again.'));
                }
              }}
            >
              <Button disabled={busy}>{t('Delete connection')}</Button>
            </Popconfirm>
          )}
        </div>
      )}
      <div className="cloud-connection-fields">
        <Form.Item
          name="connectionName"
          label={
            manage ? t('Data source name') : t('Connection name (optional)')
          }
          rules={
            manage
              ? [
                  {
                    required: true,
                    whitespace: true,
                    message: t('Enter a data source name'),
                  },
                  { max: 100 },
                ]
              : []
          }
        >
          <Input
            disabled={busy}
            placeholder={t('For example, training set / test data')}
            maxLength={100}
          />
        </Form.Item>
        <Form.Item
          name="provider"
          label={t('Object storage')}
          rules={[{ required: true }]}
        >
          <Select
            disabled={fixedSource || busy}
            options={Object.entries(providerLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(value) => {
              setProvider(value);
              setSelectedId(undefined);
              form.setFieldsValue({
                region: defaultRegions[value],
                endpoint: '',
                accessKeyId: '',
                accessKeySecret: '',
                securityToken: '',
              });
            }}
          />
        </Form.Item>
        <Form.Item
          name="bucket"
          label="Bucket"
          rules={[{ required: true, message: t('Enter the bucket name') }]}
        >
          <Input
            disabled={fixedSource || busy}
            placeholder={t('For example, my-annotation-data')}
            autoComplete="off"
            spellCheck={false}
          />
        </Form.Item>
        <Form.Item
          name="region"
          label="Region"
          rules={[{ required: true, message: t('Enter the bucket region') }]}
        >
          <Input
            disabled={busy}
            placeholder={defaultRegions[provider]}
            autoComplete="off"
            spellCheck={false}
          />
        </Form.Item>
        <Form.Item
          name="endpoint"
          label={t('Endpoint (optional; generated from the region by default)')}
        >
          <Input
            disabled={busy}
            placeholder={defaultEndpoint(provider, defaultRegions[provider])}
            autoComplete="off"
            spellCheck={false}
          />
        </Form.Item>
        <Form.Item
          name="accessKeyId"
          label="AccessKey ID"
          rules={[{ required: true, message: t('Enter the access key ID') }]}
        >
          <Input.Password disabled={busy} autoComplete="off" placeholder="AK" />
        </Form.Item>
        <Form.Item
          name="accessKeySecret"
          label="Secret AccessKey"
          rules={[
            { required: true, message: t('Enter the secret access key') },
          ]}
        >
          <Input.Password
            disabled={busy}
            autoComplete="new-password"
            placeholder="SK"
          />
        </Form.Item>
        <Form.Item
          name="securityToken"
          label={t('Security token (for temporary credentials)')}
        >
          <Input.Password
            disabled={busy}
            autoComplete="off"
            placeholder={t('Leave blank for permanent access keys')}
          />
        </Form.Item>
        <Form.Item name="prefix" label={t('Starting directory (optional)')}>
          <Input
            disabled={busy}
            placeholder={t('For example, dataset/scene-01/')}
            autoComplete="off"
            spellCheck={false}
          />
        </Form.Item>
      </div>
      {!manage && (
        <Form.Item name="remember" valuePropName="checked">
          <Checkbox disabled={busy}>
            {t(
              'Save connection on this device (including access keys and token)',
            )}
          </Checkbox>
        </Form.Item>
      )}
      <p className="cloud-storage-note text-[var(--ant-color-text-tertiary,_#8a8a8a)] text-[12px] leading-[1.8] mt-1 mx-0 mb-4 font-normal">
        {manage
          ? t(
              'Connection details are stored in this browser. Testing checks read permission for the starting directory.',
            )
          : t(
              'Saved connections can be reused in this browser. The connection needs list and read permissions, plus GET and HEAD CORS configuration.',
            )}
      </p>
      {(error || (!manage && showSavedConnections && loadError)) && (
        <Alert
          type="error"
          showIcon
          message={error || loadError}
          className="cloud-storage-error mb-4"
        />
      )}
      {tested && (
        <Alert
          type="success"
          showIcon
          message={t('Connected. The directory is readable')}
          className="cloud-storage-error mb-4"
        />
      )}
      <div className="cloud-form-actions">
        {manage && (
          <>
            <Button disabled={busy} onClick={onCancel}>
              {t('Cancel')}
            </Button>
            <Button disabled={busy} onClick={testConnection}>
              {t('Test connection')}
            </Button>
          </>
        )}
        <Button type="primary" htmlType="submit" loading={busy}>
          {manage ? t('Save data source') : t('Connect and read directory')}
        </Button>
      </div>
    </Form>
  );
}

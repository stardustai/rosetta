import { useLanguage, t } from '../i18n';
import { Alert, Button, Select, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { createStorageClient, storageError } from './adapters';
import type { ConnectedStorage } from './CloudConnectionForm';
import CloudConnectionForm from './CloudConnectionForm';
import { publicSource } from './paths';
import { rememberConnection } from './registry';
import type { SavedStorageConnection } from './types';
import { useSavedConnections } from './useSavedConnections';

export default function CloudSourcePicker({
  initialSourceId,
  onConnected,
}: {
  initialSourceId?: string;
  onConnected: (value: ConnectedStorage) => void;
}) {
  useLanguage();
  const { sources, loading, error: loadError } = useSavedConnections();
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSourceId,
  );
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const started = useRef(false);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  async function connect(saved: SavedStorageConnection) {
    const current = ++request.current;
    setBusy(true);
    setError('');
    try {
      const client = await createStorageClient(saved.connection);
      const page = await client.list({
        prefix: saved.connection.prefix,
        delimiter: '/',
      });
      if (current !== request.current) return;
      rememberConnection(saved.connection, client);
      onConnected({ source: publicSource(saved.connection), client, page });
    } catch (error) {
      if (current === request.current) setError(storageError(error));
    } finally {
      if (current === request.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (loading || started.current) return;
    const saved = sources.find((source) => source.id === initialSourceId);
    if (initialSourceId) {
      started.current = true;
      if (saved) void connect(saved);
      else
        setError(t('This data source was deleted. Select another data source'));
    } else if (
      !sources.some((source) => source.id === selectedId) &&
      sources[0]
    )
      setSelectedId(sources[0].id);
  }, [loading, sources, initialSourceId]);

  if (loading)
    return (
      <div className="task-loading flex items-center justify-center min-h-60 p-8">
        <Spin />
      </div>
    );
  return (
    <div className="cloud-source-picker">
      {!creating && sources.length > 0 ? (
        <>
          <label>{t('Select a saved data source')}</label>
          <div className="cloud-source-picker-row">
            <Select
              aria-label={t('Select a saved data source')}
              showSearch
              optionFilterProp="label"
              value={selectedId}
              disabled={busy}
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
                setSelectedId(id);
                setError('');
              }}
            />
            <Button
              type="primary"
              loading={busy}
              disabled={!sources.some((source) => source.id === selectedId)}
              onClick={() => {
                const saved = sources.find(
                  (source) => source.id === selectedId,
                );
                if (saved) void connect(saved);
              }}
            >
              {t('Open data source')}
            </Button>
          </div>
          <div className="cloud-source-picker-links">
            <Button
              type="link"
              disabled={busy}
              onClick={() => setCreating(true)}
            >
              {t('Use a new connection')}
            </Button>
            <Link to="/dataSources">{t('Manage data sources')}</Link>
          </div>
        </>
      ) : (
        <>
          {sources.length > 0 && (
            <Button className="mb-4" onClick={() => setCreating(false)}>
              {t('Back to saved data sources')}
            </Button>
          )}
          <CloudConnectionForm
            showSavedConnections={false}
            onConnected={onConnected}
          />
        </>
      )}
      {(error || loadError) && (
        <Alert
          className="mt-3"
          type="error"
          showIcon
          message={error || loadError}
        />
      )}
    </div>
  );
}

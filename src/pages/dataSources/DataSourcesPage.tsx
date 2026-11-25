import { useLanguage, t } from '../../i18n';
import {
  CloudServerOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Alert, Button, Dropdown, Input, Modal, Table, Tabs, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  createStorageClient,
  storageError,
} from '../../objectStorage/adapters';
import CloudConnectionForm from '../../objectStorage/CloudConnectionForm';
import { deleteSavedConnection } from '../../objectStorage/savedConnections';
import type {
  SavedStorageConnection,
  StorageProvider,
} from '../../objectStorage/types';
import { useSavedConnections } from '../../objectStorage/useSavedConnections';
import TaskLayout from '../tasks/TaskLayout';

export default function DataSourcesPage() {
  useLanguage();
  const navigate = useNavigate();
  const { sources, loading, error } = useSavedConnections();
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<StorageProvider | 'all'>('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavedStorageConnection>();
  const [formBusy, setFormBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [deleting, setDeleting] = useState<SavedStorageConnection>();
  function openForm(value?: SavedStorageConnection) {
    setEditing(value);
    setFormBusy(false);
    setFormOpen(true);
  }
  async function testConnection(source: SavedStorageConnection) {
    setBusyId(source.id);
    try {
      const client = await createStorageClient(source.connection);
      await client.list({ prefix: source.connection.prefix, delimiter: '/' });
      message.success(
        t('Connected to “{{v0}}”. The directory is readable', {
          v0: source.name,
        }),
      );
    } catch (error) {
      message.error(storageError(error));
    } finally {
      setBusyId('');
    }
  }
  const matching = sources.filter((source) =>
    `${source.name} ${source.connection.provider} ${source.connection.bucket} ${source.connection.region} ${source.connection.endpoint} ${source.connection.prefix}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <TaskLayout
      actions={
        <Button onClick={() => navigate('/tasks')}>
          {t('Back to task list')}
        </Button>
      }
    >
      <div className="task-page-heading">
        <div>
          <h1>{t('Data sources')}</h1>
          <p>
            {t(
              'Save object storage connections to select them when creating tasks.',
            )}
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openForm()}
        >
          {t('New data source')}
        </Button>
      </div>
      {error && (
        <Alert type="error" showIcon message={error} className="mb-4" />
      )}
      <div className="task-list-panel">
        <div className="task-list-filters">
          <Tabs
            activeKey={provider}
            onChange={(key) => {
              setProvider(key as StorageProvider | 'all');
              setPage(1);
            }}
            items={['all', 'oss', 'obs', 'tos'].map((value) => ({
              key: value,
              label: `${
                value === 'all' ? t('All data sources') : value.toUpperCase()
              } ${
                matching.filter(
                  (source) =>
                    value === 'all' || source.connection.provider === value,
                ).length
              }`,
            }))}
          />
          <Input.Search
            aria-label={t('Search data sources')}
            allowClear
            placeholder={t('Search by name, bucket, or directory')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Table<SavedStorageConnection>
          rowKey="id"
          loading={loading}
          tableLayout="fixed"
          scroll={{ x: 1050 }}
          dataSource={matching.filter(
            (source) =>
              provider === 'all' || source.connection.provider === provider,
          )}
          pagination={{
            current: page,
            onChange: setPage,
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (count) => t('{{v0}} data sources', { v0: count }),
            locale: { items_per_page: t('/page') },
          }}
          locale={{
            emptyText: sources.length ? (
              t('No matching data sources')
            ) : (
              <div className="task-data-empty">
                <strong>{t('No saved data sources yet')}</strong>
                <p>
                  {t('Add an OSS, OBS, or TOS connection to reuse it later.')}
                </p>
                <Button type="primary" onClick={() => openForm()}>
                  {t('New data source')}
                </Button>
              </div>
            ),
          }}
          columns={[
            {
              title: t('Data source name'),
              render: (_, source) => (
                <div className="task-name-row flex items-center gap-3 min-w-0">
                  <span className="task-folder-icon flex items-center justify-center w-8 h-8.5 shrink-0 rounded-[5px] bg-workspace-secondary text-[#779dd3] text-[17px]">
                    <CloudServerOutlined />
                  </span>
                  <div className="task-name-cell">
                    <span className="data-source-name" title={source.name}>
                      {source.name}
                    </span>
                    <span title={source.connection.endpoint}>
                      {source.connection.endpoint}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              title: t('Type'),
              width: 80,
              render: (_, source) => source.connection.provider.toUpperCase(),
            },
            {
              title: t('Bucket / starting directory'),
              width: 240,
              render: (_, source) => (
                <div className="data-source-location">
                  <span title={source.connection.bucket}>
                    {source.connection.bucket}
                  </span>
                  <small title={source.connection.prefix}>
                    {source.connection.prefix || t('Bucket root')}
                  </small>
                </div>
              ),
            },
            {
              title: t('Region'),
              width: 130,
              render: (_, source) => source.connection.region,
            },
            {
              title: t('Actions'),
              width: 290,
              render: (_, source) => (
                <div className="task-row-actions">
                  <Button
                    size="small"
                    disabled={!!busyId}
                    onClick={() =>
                      navigate(
                        `/tasks?batchSource=${encodeURIComponent(source.id)}`,
                      )
                    }
                  >
                    {t('Batch create tasks')}
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    disabled={!!busyId}
                    onClick={() => openForm(source)}
                  >
                    {t('Edit')}
                  </Button>
                  <Dropdown
                    disabled={!!busyId}
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'test',
                          label:
                            busyId === source.id
                              ? t('Testing…')
                              : t('Test connection'),
                          onClick: () => void testConnection(source),
                        },
                        { type: 'divider' },
                        {
                          key: 'delete',
                          danger: true,
                          label: t('Delete data source'),
                          onClick: () => setDeleting(source),
                        },
                      ],
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      loading={busyId === source.id}
                    >
                      {t('More')}
                    </Button>
                  </Dropdown>
                </div>
              ),
            },
          ]}
        />
      </div>
      {formOpen && (
        <Modal
          title={editing ? t('Edit data source') : t('New data source')}
          open
          width={760}
          style={{ top: 32 }}
          bodyStyle={{ maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' }}
          footer={null}
          maskClosable={!formBusy}
          closable={!formBusy}
          keyboard={!formBusy}
          onCancel={() => setFormOpen(false)}
        >
          <CloudConnectionForm
            manage
            editing={editing}
            onBusyChange={setFormBusy}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              setProvider('all');
              setQuery('');
              setPage(1);
              message.success(t('Data source saved'));
            }}
          />
        </Modal>
      )}
      <Modal
        title={t('Delete data source')}
        open={!!deleting}
        okText={t('Delete data source')}
        cancelText={t('Keep')}
        okButtonProps={{ danger: true }}
        confirmLoading={!!busyId}
        onCancel={() => !busyId && setDeleting(undefined)}
        onOk={async () => {
          if (!deleting) return;
          setBusyId(deleting.id);
          try {
            await deleteSavedConnection(deleting.connection);
            setDeleting(undefined);
            setPage(1);
            message.success(t('Local data source configuration deleted'));
          } catch (error) {
            message.error(
              (error as Error).message || t('Delete failed. Try again'),
            );
          } finally {
            setBusyId('');
          }
        }}
      >
        {t('Delete the local connection for “{{name}}”?', {
          name: deleting?.name,
        })}
      </Modal>
    </TaskLayout>
  );
}

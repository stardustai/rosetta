import { useLanguage, getLanguage, t } from '../../i18n';
import {
  MoreOutlined,
  PlayCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Dropdown, Input, Modal, Table, Tabs, message } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ExportTaskModal from '../../exports/ExportTaskModal';
import { openSavedAnnotation } from '../../localData/openAnnotation';
import type { SessionSummary, TaskStatus } from '../../localData/sessionInfo';
import { deleteSession, updateTaskDetails } from '../../localData/storage';
import BatchTaskCreateModal from './BatchTaskCreateModal';
import TaskFormModal from './TaskFormModal';
import TaskLayout from './TaskLayout';
import { TaskStatusTag } from './TaskStatus';
import { useTaskList } from './useLocalTasks';

export default function TaskManagerPage() {
  useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const source = search.get('batchSource') || undefined;
  const { tasks, loading, error } = useTaskList();
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TaskStatus | 'all'>('all');
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState<SessionSummary>();
  const [deleting, setDeleting] = useState<SessionSummary>();
  const [exportId, setExportId] = useState('');
  useEffect(() => {
    if (source) setImportOpen(true);
  }, [source]);
  async function start(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      await openSavedAnnotation(id, null);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setBusy('');
    }
  }
  function closeImport() {
    setImportOpen(false);
    if (source) {
      const next = new URLSearchParams(search);
      next.delete('batchSource');
      setSearch(next, { replace: true });
    }
  }
  const rows = tasks.filter(
    (task) =>
      `${task.name} ${task.description} ${task.source}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (status === 'all' || task.status === status),
  );
  const first = tasks.find((task) => task.status !== 'completed') || tasks[0];
  return (
    <TaskLayout>
      <div className="task-page-heading">
        <div>
          <h1>{t('Task management')}</h1>
          <p>{t('Import data, then select a task to start annotating.')}</p>
        </div>
        <div className="task-heading-actions flex items-center gap-2 flex-wrap">
          <Button
            icon={<PlayCircleOutlined />}
            disabled={!first || !!busy}
            loading={!!busy}
            onClick={() => first && start(first.id)}
          >
            {t('Start annotating')}
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
          >
            {t('New task / batch create')}
          </Button>
        </div>
      </div>
      <div className="task-summary-strip">
        <span>
          {t('Total tasks')}
          <strong>{tasks.length}</strong>
        </span>
        <span>
          {t('To annotate')}{' '}
          <strong>
            {tasks.filter((task) => task.status === 'pending').length}
          </strong>
        </span>
        <span>
          {t('In progress')}{' '}
          <strong>
            {tasks.filter((task) => task.status === 'in_progress').length}
          </strong>
        </span>
        <span>
          {t('Completed')}{' '}
          <strong>
            {tasks.filter((task) => task.status === 'completed').length}
          </strong>
        </span>
        <small>
          {t('Each task contains one data item or a sequence of frames.')}
        </small>
      </div>
      {error && (
        <Alert type="error" showIcon message={error} className="mb-4" />
      )}
      <div className="task-list-panel">
        <div className="task-list-filters">
          <Tabs
            activeKey={status}
            onChange={(value) => setStatus(value as any)}
            items={[
              {
                key: 'all',
                label: t('All tasks {{v0}}', { v0: tasks.length }),
              },
              { key: 'pending', label: t('To annotate') },
              { key: 'in_progress', label: t('In progress') },
              { key: 'completed', label: t('Completed') },
            ]}
          />
          <Input.Search
            aria-label={t('Search tasks')}
            placeholder={t('Search by task name, instructions, or source')}
            allowClear
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Table<SessionSummary>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          tableLayout="fixed"
          scroll={{ x: 920 }}
          pagination={{
            defaultPageSize: 20,
            showTotal: (count) => t('{{v0}} tasks', { v0: count }),
          }}
          locale={{
            emptyText: tasks.length
              ? t('No matching tasks')
              : t(
                  'No tasks yet. Click “New task / batch create” to import data',
                ),
          }}
          columns={[
            {
              title: t('Task name'),
              render: (_, task) => (
                <div className="task-name-cell">
                  <Link to={`/tasks/${task.id}`}>{task.name}</Link>
                  <span>{task.description || t('Single data item task')}</span>
                </div>
              ),
            },
            {
              title: t('Status'),
              width: 100,
              render: (_, task) => <TaskStatusTag status={task.status} />,
            },
            {
              title: t('Type'),
              width: 145,
              dataIndex: 'attachmentType',
              ellipsis: true,
            },
            {
              title: t('Data source'),
              width: 200,
              dataIndex: 'source',
              render: (value: string) =>
                value
                  .split(' / ')
                  .map((part) => t(part))
                  .join(' / '),
              ellipsis: true,
            },
            {
              title: t('Last saved'),
              width: 175,
              render: (_, task) =>
                task.lastSavedAt
                  ? new Date(task.lastSavedAt).toLocaleString(getLanguage())
                  : t('Not submitted yet'),
            },
            {
              title: t('Actions'),
              width: 155,
              render: (_, task) => (
                <div className="task-row-actions">
                  <Button
                    type="link"
                    loading={busy === task.id}
                    disabled={!!busy && busy !== task.id}
                    onClick={() => start(task.id)}
                  >
                    {task.status === 'completed'
                      ? t('View annotations')
                      : t('Open annotation workspace')}
                  </Button>
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'detail',
                          label: t('View data and results'),
                          onClick: () => navigate(`/tasks/${task.id}`),
                        },
                        {
                          key: 'tools',
                          label: t('Configure annotation tools'),
                          onClick: () =>
                            navigate(`/annotationTool?task=${task.id}`),
                        },
                        {
                          key: 'export',
                          label: t('Export data and results'),
                          onClick: () => setExportId(task.id),
                        },
                        {
                          key: 'edit',
                          label: t('Edit name and instructions'),
                          onClick: () => setEditing(task),
                        },
                        { type: 'divider' },
                        {
                          key: 'delete',
                          label: t('Delete task'),
                          danger: true,
                          onClick: () => setDeleting(task),
                        },
                      ],
                    }}
                  >
                    <Button
                      type="text"
                      aria-label={t('Actions for {{v0}}', { v0: task.name })}
                      icon={<MoreOutlined />}
                    />
                  </Dropdown>
                </div>
              ),
            },
          ]}
        />
      </div>
      {importOpen && (
        <BatchTaskCreateModal
          initialSourceId={source}
          onCancel={closeImport}
          onCreated={(count) => {
            closeImport();
            message.success(t('Created {{v0}} tasks', { v0: count }));
          }}
        />
      )}
      {editing && (
        <TaskFormModal
          open
          initial={editing}
          onCancel={() => setEditing(undefined)}
          onSubmit={async (details) => {
            await updateTaskDetails(editing.id, details);
            setEditing(undefined);
          }}
        />
      )}
      {exportId && (
        <ExportTaskModal sessionId={exportId} onClose={() => setExportId('')} />
      )}
      <Modal
        title={t('Delete task')}
        open={!!deleting}
        okText={t('Delete')}
        okButtonProps={{ danger: true }}
        confirmLoading={busy === 'delete'}
        onCancel={() => !busy && setDeleting(undefined)}
        onOk={async () => {
          if (!deleting || busy) return;
          setBusy('delete');
          try {
            await deleteSession(deleting.id);
            setDeleting(undefined);
          } catch (error) {
            message.error((error as Error).message);
          } finally {
            setBusy('');
          }
        }}
      >
        {t('Delete task “{{name}}” and its annotation results.', {
          name: deleting?.name,
        })}
      </Modal>
    </TaskLayout>
  );
}

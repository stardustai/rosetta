import { useLanguage, getLanguage, t } from '../../i18n';
import {
  DownloadOutlined,
  PlayCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Alert, Button, Descriptions, Spin, Tree, message } from 'antd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import ExportTaskModal from '../../exports/ExportTaskModal';
import { buildFileTree } from '../../localData/fileTree';
import { openSavedAnnotation } from '../../localData/openAnnotation';
import { dataKindLabels, kindFromRecord } from '../../localData/presets';
import { sessionRecords } from '../../localData/sessionInfo';
import { inputResults } from '../../localData/taskInput';
import TaskLayout from './TaskLayout';
import { TaskStatusTag } from './TaskStatus';
import { useLocalTask } from './useLocalTasks';

export default function TaskDetailPage() {
  useLanguage();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { task, loading, error } = useLocalTask(id);
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  if (loading)
    return (
      <TaskLayout>
        <div className="task-loading flex items-center justify-center min-h-60 p-8">
          <Spin />
        </div>
      </TaskLayout>
    );
  if (!task)
    return (
      <TaskLayout>
        <Alert
          type="error"
          showIcon
          message={error || t('Task not found')}
          action={
            <Button onClick={() => navigate('/tasks')}>
              {t('Back to task list')}
            </Button>
          }
        />
      </TaskLayout>
    );
  const records = sessionRecords(task.input);
  const files = buildFileTree(records);
  const result = inputResults(task.input)[0];
  const kind = kindFromRecord(records[0]);
  return (
    <TaskLayout
      task={task}
      section={params.get('view') === 'results' ? 'results' : 'overview'}
    >
      <div className="task-page-heading">
        <div>
          <h1>{task.name}</h1>
          <p>
            {task.description ||
              t(
                'This task contains one data item. Its annotation results are saved independently.',
              )}
          </p>
        </div>
        <div className="task-heading-actions flex items-center gap-2 flex-wrap">
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate(`/annotationTool?task=${task.id}`)}
          >
            {t('Configure annotation tools')}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => setExportOpen(true)}
          >
            {t('Export')}
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await openSavedAnnotation(task.id, null);
              } catch (error) {
                message.error((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('Open annotation workspace')}
          </Button>
        </div>
      </div>
      <div className="task-list-panel task-data-details">
        <Descriptions size="small" column={2}>
          <Descriptions.Item label={t('Status')}>
            <TaskStatusTag status={task.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('Data type')}>
            {kind ? dataKindLabels[kind] : records[0]?.attachmentType}
          </Descriptions.Item>
          <Descriptions.Item label={t('Attachment type')}>
            {records[0]?.attachmentType}
          </Descriptions.Item>
          <Descriptions.Item label={t('File count')}>
            {files.count}
          </Descriptions.Item>
          <Descriptions.Item label={t('Last submitted')}>
            {task.lastSavedAt
              ? new Date(task.lastSavedAt).toLocaleString(getLanguage())
              : t('Not submitted yet')}
          </Descriptions.Item>
        </Descriptions>
      </div>
      <div className="task-data-columns">
        <section className="task-list-panel task-data-details">
          <h2>{t('File list')}</h2>
          <Tree treeData={files.tree} defaultExpandAll selectable={false} />
        </section>
        <section className="task-list-panel task-data-details">
          <h2>{t('Annotation results')}</h2>
          {result ? (
            <pre className="task-result-json max-h-120 overflow-auto whitespace-pre-wrap wrap-anywhere text-[12px] text-workspace-ink">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p>
              {t(
                'No annotation results have been saved for this data. Submit them from the annotation workspace.',
              )}
            </p>
          )}
        </section>
      </div>
      {exportOpen && (
        <ExportTaskModal
          sessionId={task.id}
          onClose={() => setExportOpen(false)}
        />
      )}
    </TaskLayout>
  );
}

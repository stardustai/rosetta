import { useLanguage, t } from '../../i18n';
import {
  FolderOpenOutlined,
  InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { DataRecord } from '../../annotation/schema';
import { Alert, Button, Input, Modal, Progress, Radio, Table, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { validateSchema } from '../../annotation/schema';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TaskGroup, TaskSplit } from '../../localData/batchTasks';
import { planLocalTasks } from '../../localData/batchTasks';
import { inputsFromJSON, tasksFromInput } from '../../localData/dataTasks';
import { useLocalFileDrop } from '../../localData/useLocalFileDrop';
import type { LocalFile, LocalImport } from '../../localData/files';
import {
  stageImport,
  releaseStagedImports,
} from '../../localData/stagedImports';
import { prepareQuickDraft } from '../../localData/quickDrafts';
import {
  buildLocalImport,
  formatSize,
  fromFileList,
} from '../../localData/files';
import { buildFileTree } from '../../localData/fileTree';
import {
  createDefaultOperators,
  dataKindLabels,
} from '../../localData/presets';
import { kindFromRecord } from '../../localData/recordKind';
import { sessionRecords } from '../../localData/sessionInfo';
import type { NewTask } from '../../localData/storage';
import {
  createTasks,
  releaseUnusedImports,
  storeImport,
} from '../../localData/storage';
import { storageError } from '../../objectStorage/adapters';
import type { CloudDirectorySelection } from '../../objectStorage/CloudDirectoryBrowser';
import CloudDirectoryBrowser from '../../objectStorage/CloudDirectoryBrowser';
import {
  buildCloudImport,
  listDirectoryObjects,
  planCloudTasks,
} from '../../objectStorage/import';
import type { StorageObject, StorageSource } from '../../objectStorage/types';

function defaultName(task: TaskGroup<unknown>) {
  return `${task.name}${
    task.mixedKinds ? ` · ${dataKindLabels[task.kind]}` : ''
  }`.slice(0, 100);
}

export default function BatchTaskCreateModal({
  initialSourceId,
  onCancel,
  onCreated,
}: {
  initialSourceId?: string;
  onCancel: () => void;
  onCreated: (count: number) => void;
}) {
  useLanguage();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController>();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [mode, setMode] = useState<'local' | 'cloud' | 'json'>(
    initialSourceId ? 'cloud' : 'local',
  );
  const [directory, setDirectory] = useState<CloudDirectorySelection>();
  const [cloudFiles, setCloudFiles] = useState<StorageObject[]>();
  const [jsonText, setJsonText] = useState('');
  const [jsonName, setJsonName] = useState('data.json');
  const [readCount, setReadCount] = useState(0);
  const [root, setRoot] = useState('');
  const [split, setSplit] = useState<TaskSplit>(
    initialSourceId ? 'folder' : 'file',
  );
  const sequence = true;
  const [selected, setSelected] = useState<string[]>();
  const [names, setNames] = useState<Record<string, string>>({});
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<'idle' | 'reading' | 'files' | 'tasks'>(
    'idle',
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const busy = phase !== 'idle';
  const { collecting, dragging, getRootProps } = useLocalFileDrop({
    disabled: busy,
    onFiles: (entries) =>
      pick(
        entries,
        entries.some((entry) => entry.path.includes('/')),
      ),
    onError: (error) => setError(error.message),
  });
  useEffect(() => () => controller.current?.abort(), []);
  const localPlan = useMemo(() => {
    try {
      return { ...planLocalTasks(files, split, sequence, root), error: '' };
    } catch (error) {
      return { tasks: [], skippedCount: 0, error: (error as Error).message };
    }
  }, [files, split, sequence, root]);
  const cloudPlan = useMemo(() => {
    try {
      return {
        ...planCloudTasks(
          cloudFiles || [],
          split,
          sequence,
          directory?.prefix || '',
          directory?.connected.source.bucket || '',
        ),
        error: '',
      };
    } catch (error) {
      return { tasks: [], skippedCount: 0, error: (error as Error).message };
    }
  }, [cloudFiles, split, sequence, directory]);
  const jsonPlan = useMemo(() => {
    try {
      const tasks = jsonText.trim()
        ? inputsFromJSON(jsonText, jsonName, (record) =>
            createDefaultOperators(kindFromRecord(record)!),
          )
            .flatMap((input) => {
              const check = validateSchema('PublicAnnotationInput', input);
              if (!check.valid) throw new Error(check.errorMessage);
              return tasksFromInput(input, jsonName.replace(/\.jsonl?$/i, ''));
            })
            .map((task, index) => ({
              key: `json:${index}`,
              name: task.name,
              path: jsonName,
              kind: kindFromRecord(sessionRecords(task.input!)[0]) || 'text',
              mixedKinds: false,
              sequence: sessionRecords(task.input!)[0].attachmentType.includes(
                'SEQUENCE',
              ),
              files: [task.input],
              recordCount: 1,
              fileCount: buildFileTree(sessionRecords(task.input!)).count,
              totalSize: new Blob([JSON.stringify(task.input)]).size,
              input: task.input!,
              submitted: task.submitted,
            }))
        : [];
      return { tasks, skippedCount: 0, error: '' };
    } catch (error) {
      return { tasks: [], skippedCount: 0, error: (error as Error).message };
    }
  }, [jsonText, jsonName]);
  const plan: {
    tasks: TaskGroup<unknown>[];
    skippedCount: number;
    error: string;
  } = mode === 'json' ? jsonPlan : mode === 'cloud' ? cloudPlan : localPlan;
  const selectedKeys = useMemo(() => selected && new Set(selected), [selected]);
  const selectedTasks = plan.tasks.filter(
    (task) => !selectedKeys || selectedKeys.has(task.key),
  );
  const totalSize = selectedTasks.reduce(
    (sum, task) => sum + task.totalSize,
    0,
  );
  const nameError = selectedTasks.some(
    (task) => !(names[task.key] ?? defaultName(task)).trim(),
  );

  function pick(entries: LocalFile[], folder: boolean) {
    if (!entries.length) {
      setError(t('No files found. Select them again'));
      return;
    }
    const firstRoot = entries[0].path.split('/')[0];
    setRoot(
      folder && entries.every((entry) => entry.path.startsWith(`${firstRoot}/`))
        ? firstRoot
        : '',
    );
    setFiles(entries);
    setSplit(folder ? 'folder' : 'file');
    setSelected(undefined);
    setNames({});
    setError('');
    setProgress(0);
  }

  async function readDirectory() {
    if (!directory || busy || controller.current) return;
    const abort = new AbortController();
    controller.current = abort;
    setPhase('reading');
    setError('');
    setReadCount(0);
    try {
      const objects = await listDirectoryObjects(
        directory.connected.client,
        directory.prefix,
        { recursive: true, signal: abort.signal, onProgress: setReadCount },
      );
      if (abort.signal.aborted)
        throw new DOMException(t('Reading canceled'), 'AbortError');
      setCloudFiles(objects);
      setSelected(undefined);
      setNames({});
    } catch (error) {
      setError(
        (error as Error).name === 'AbortError'
          ? t('Directory reading canceled. No tasks were created')
          : storageError(error),
      );
    } finally {
      controller.current = undefined;
      setPhase('idle');
    }
  }

  function prepareTask(
    task: TaskGroup<unknown>,
    records: DataRecord[],
    source?: StorageSource,
  ): NewTask {
    for (const record of records) {
      const check = validateSchema('DataRecord', record);
      if (!check.valid) throw new Error(check.errorMessage);
    }
    return {
      name: (names[task.key] ?? defaultName(task)).trim(),
      description,
      cloudSources: source ? [source] : undefined,
      input: {
        taskParams: {
          type: 'multiple',
          records,
          operators: createDefaultOperators(task.kind),
        },
      },
    };
  }

  async function collectTasks(onLocal: (data: LocalImport) => Promise<void>) {
    const pending: NewTask[] = [];
    if (mode === 'local') {
      for (const task of localPlan.tasks.filter(
        (task) => !selectedKeys || selectedKeys.has(task.key),
      )) {
        const data = buildLocalImport(
          task.files,
          task.kind,
          task.sequence,
          crypto.randomUUID(),
        );
        const pendingTask = prepareTask(task, data.records);
        await onLocal(data);
        pending.push(pendingTask);
      }
    } else if (mode === 'cloud') {
      if (!directory || !cloudFiles)
        throw new Error(
          t('Select a cloud directory and read its file list first'),
        );
      for (const task of cloudPlan.tasks.filter(
        (task) => !selectedKeys || selectedKeys.has(task.key),
      )) {
        const data = buildCloudImport(
          task.files,
          directory.connected.source,
          task.sequence,
        );
        pending.push(
          prepareTask(task, data.records, directory.connected.source),
        );
      }
    } else {
      for (const task of jsonPlan.tasks.filter(
        (task) => !selectedKeys || selectedKeys.has(task.key),
      ))
        pending.push({
          name: (names[task.key] ?? task.name).trim(),
          description,
          input: task.input,
          submitted: task.submitted,
        });
    }
    return pending;
  }

  async function previewSelection() {
    if (busy || collecting || !selectedTasks.length || nameError || plan.error)
      return;
    const owner = {};
    setPhase('tasks');
    setError('');
    try {
      const tasks = await collectTasks(async (data) =>
        stageImport(owner, data),
      );
      const id = prepareQuickDraft(tasks, owner);
      onCancel();
      navigate(`/annotationTool?draft=${id}`);
    } catch (error) {
      releaseStagedImports(owner);
      setError((error as Error).message || t('Cannot preview data'));
    } finally {
      setPhase('idle');
    }
  }

  async function submit() {
    if (
      controller.current ||
      busy ||
      !selectedTasks.length ||
      nameError ||
      plan.error
    )
      return;
    const abort = new AbortController();
    controller.current = abort;
    setPhase(mode === 'local' ? 'files' : 'tasks');
    setError('');
    setProgress(0);
    const importIds: string[] = [];
    let committed = false;
    try {
      let completed = 0;
      const pending = await collectTasks(async (data) => {
        importIds.push(data.id);
        await storeImport(data, abort.signal, (value) =>
          setProgress(
            Math.round(
              ((completed + (data.totalSize * value) / 100) / totalSize) * 100,
            ),
          ),
        );
        completed += data.totalSize;
      });
      setProgress(100);
      if (abort.signal.aborted)
        throw new DOMException(t('Import canceled'), 'AbortError');
      setPhase('tasks');
      const created = await createTasks(pending);
      committed = true;
      onCreated(created.length);
    } catch (error) {
      if (!committed && importIds.length) {
        try {
          await releaseUnusedImports(importIds);
        } catch {
          setError(
            t(
              'No tasks were created, but some temporary files could not be cleaned up. Check browser storage.',
            ),
          );
          return;
        }
      }
      setError(
        (error as Error).name === 'AbortError'
          ? t(
              'Import canceled. No tasks were created. Adjust the list and try again.',
            )
          : (error as Error).message || t('Batch creation failed. Try again'),
      );
    } finally {
      controller.current = undefined;
      setPhase('idle');
    }
  }

  return (
    <Modal
      title={t('New task / batch create')}
      open
      width={960}
      style={{ top: 32 }}
      bodyStyle={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}
      maskClosable={!busy && !collecting}
      closable={!busy && !collecting}
      keyboard={!busy && !collecting}
      onCancel={onCancel}
      footer={
        <div className="batch-task-footer">
          <span>
            {t('{{count}} tasks selected · {{size}}', {
              count: selectedTasks.length,
              size: formatSize(totalSize),
            })}
          </span>
          <Button
            disabled={collecting || phase === 'tasks'}
            onClick={() => (busy ? controller.current?.abort() : onCancel())}
          >
            {phase === 'reading'
              ? t('Cancel reading')
              : phase === 'files'
              ? t('Cancel import')
              : t('Cancel')}
          </Button>
          <Button
            disabled={
              busy ||
              collecting ||
              !selectedTasks.length ||
              nameError ||
              !!plan.error
            }
            onClick={previewSelection}
          >
            {t('Preview and configure tools')}
          </Button>
          <Button
            type="primary"
            loading={phase === 'files' || phase === 'tasks'}
            disabled={
              busy ||
              collecting ||
              !selectedTasks.length ||
              nameError ||
              !!plan.error
            }
            onClick={submit}
          >
            {phase === 'tasks'
              ? t('Creating tasks')
              : t('Create {{v0}} tasks', { v0: selectedTasks.length })}
          </Button>
        </div>
      }
    >
      <Tabs
        activeKey={mode}
        onChange={(value) => {
          setMode(value as 'local' | 'cloud' | 'json');
          setSelected(undefined);
          setNames({});
          setError('');
          if (value === 'cloud') {
            setDirectory(undefined);
            setCloudFiles(undefined);
          }
          setSplit(
            value === 'cloud' || files.some((entry) => entry.path.includes('/'))
              ? 'folder'
              : 'file',
          );
        }}
        items={[
          {
            key: 'local',
            label: t('Local files'),
            disabled: busy || collecting,
          },
          {
            key: 'cloud',
            label: t('Object storage'),
            disabled: busy || collecting,
          },
          { key: 'json', label: 'JSON / JSONL', disabled: busy || collecting },
        ]}
      />
      <p className="batch-task-intro">
        {t(
          'Create one task per data item. Select multiple files for batch creation; consecutive frames in the same directory can be grouped into one data item.',
        )}
      </p>
      <div style={{ display: mode === 'local' ? undefined : 'none' }}>
        <div
          {...getRootProps()}
          className={`batch-task-drop${dragging ? ' is-dragging' : ''}`}
        >
          <InboxOutlined />
          <div>
            <strong>
              {collecting
                ? t('Reading files…')
                : t('Drop files or a parent folder')}
            </strong>
            <p>{t('PCD / PLY, images, audio, video, text, and documents')}</p>
          </div>
          <div className="batch-task-pickers">
            <Button
              icon={<UploadOutlined />}
              disabled={busy || collecting}
              onClick={() => fileInput.current?.click()}
            >
              {t('Select multiple files')}
            </Button>
            <Button
              icon={<FolderOpenOutlined />}
              disabled={busy || collecting}
              onClick={() => folderInput.current?.click()}
            >
              {t('Select parent folder')}
            </Button>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length)
              pick(fromFileList(event.target.files), false);
            event.target.value = '';
          }}
        />
      </div>
      {mode === 'cloud' && (
        <div className="batch-cloud-source">
          <CloudDirectoryBrowser
            initialSourceId={initialSourceId}
            disabled={busy}
            onChange={(value) => {
              setDirectory(value);
              setCloudFiles(undefined);
              setSelected(undefined);
              setNames({});
              setError('');
            }}
          />
          <div className="batch-cloud-read">
            <span className="batch-task-hint">
              {t(
                'Only file references are saved; original files are read on demand during annotation. The list includes all subdirectories of the selected directory.',
              )}
            </span>
            <Button disabled={!directory || busy} onClick={readDirectory}>
              {t('Read directory to build list')}
            </Button>
          </div>
        </div>
      )}
      <input
        ref={folderInput}
        type="file"
        multiple
        hidden
        {...{ webkitdirectory: '', directory: '' }}
        onChange={(event) => {
          if (event.target.files?.length)
            pick(fromFileList(event.target.files), true);
          event.target.value = '';
        }}
      />
      {mode === 'json' && (
        <div className="task-json-import">
          <label>
            {t('Upload PublicAnnotationInput JSON or DataRecord JSONL')}{' '}
            <input
              type="file"
              accept=".json,.jsonl"
              disabled={busy}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setJsonName(file.name);
                setJsonText(await file.text());
                setSelected(undefined);
                setNames({});
                event.target.value = '';
              }}
            />
          </label>
          <Input.TextArea
            rows={7}
            value={jsonText}
            disabled={busy}
            aria-label={t('JSON data')}
            placeholder={t(
              'You can also paste PublicAnnotationInput JSON. Multiple records are split automatically.',
            )}
            onChange={(event) => {
              setJsonText(event.target.value);
              setSelected(undefined);
              setNames({});
            }}
          />
        </div>
      )}
      {mode !== 'json' && (
        <div className="batch-task-options">
          <span>{t('Data grouping')}</span>
          <Radio.Group
            value={split}
            disabled={busy || collecting}
            onChange={(event) => {
              setSplit(event.target.value);
              setSelected(undefined);
              setNames({});
              setError('');
            }}
          >
            <Radio value="file">{t('One task per file')}</Radio>
            <Radio
              value="folder"
              disabled={
                mode === 'local' &&
                !files.some((entry) => entry.path.includes('/'))
              }
            >
              {t('Consecutive frames in the same directory')}
            </Radio>
          </Radio.Group>
        </div>
      )}
      <p className="batch-task-hint">
        {split === 'folder'
          ? t(
              'Group point clouds or images in the same directory into consecutive frames. Other files become individual tasks; subdirectories are processed separately.',
            )
          : t(
              'Create a separate task for each file. For consecutive point cloud or image frames, put them in the same directory and select “Consecutive frames in the same directory”.',
            )}
      </p>
      <div className="batch-task-preview-heading">
        <strong>
          {t('Task list')}
          <span>
            {plan.tasks.length} {t('items')}
          </span>
        </strong>
        <span>{t('Edit task names and clear the tasks you do not need')}</span>
      </div>
      <Table<TaskGroup<unknown>>
        size="small"
        rowKey="key"
        dataSource={plan.tasks}
        scroll={{ x: 710 }}
        pagination={{
          defaultPageSize: 5,
          showSizeChanger: false,
          size: 'small',
        }}
        rowSelection={{
          selectedRowKeys: selectedTasks.map((task) => task.key),
          onChange: (keys) => setSelected(keys as string[]),
          getCheckboxProps: () => ({ disabled: busy || collecting }),
        }}
        locale={{
          emptyText:
            mode === 'cloud'
              ? cloudFiles
                ? t('This directory has no supported files')
                : t(
                    'Select a data source and directory, then click “Read directory to build list”',
                  )
              : files.length
              ? t('No supported files. Select them again')
              : t('Select files or a parent folder to preview data here'),
        }}
        columns={[
          {
            title: t('Task name'),
            width: 230,
            render: (_, task) => (
              <Input
                aria-label={t('Task name for {{v0}}', { v0: task.path })}
                value={names[task.key] ?? defaultName(task)}
                maxLength={100}
                status={
                  selectedTasks.includes(task) &&
                  !(names[task.key] ?? defaultName(task)).trim()
                    ? 'error'
                    : undefined
                }
                disabled={busy || collecting}
                onChange={(event) =>
                  setNames((current) => ({
                    ...current,
                    [task.key]: event.target.value,
                  }))
                }
              />
            ),
          },
          { title: t('Source'), dataIndex: 'path', ellipsis: true },
          {
            title: t('Type'),
            width: 125,
            render: (_, task) =>
              `${dataKindLabels[task.kind]}${
                task.sequence ? t('Consecutive frames') : ''
              }`,
          },
          {
            title: t('Files / data'),
            width: 105,
            render: (_, task) =>
              `${task.fileCount ?? task.files.length} / ${task.recordCount}`,
          },
        ]}
      />
      {!!plan.skippedCount && (
        <p className="batch-task-hint">
          {t('Ignored')}
          {plan.skippedCount} {t('unsupported, hidden, or empty files.')}
        </p>
      )}
      {!!plan.tasks.length && (
        <label className="batch-task-description">
          {t('Annotation instructions (apply to all tasks in this batch)')}
          <Input.TextArea
            rows={2}
            maxLength={2000}
            showCount
            value={description}
            disabled={busy || collecting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('Optional instructions for annotating this batch')}
          />
        </label>
      )}
      {busy && (
        <div className="batch-task-progress mt-4 text-[12px]">
          <span>
            {phase === 'reading'
              ? t('Reading directory, found {{v0}} files…', { v0: readCount })
              : phase === 'files'
              ? t('Saving local files…')
              : t('Creating tasks…')}
          </span>
          {phase !== 'reading' && (
            <Progress percent={progress} status="active" />
          )}
        </div>
      )}
      {(error || plan.error || nameError) && (
        <Alert
          className="mt-3"
          type="error"
          showIcon
          message={
            error || plan.error || t('Enter names for all selected data items')
          }
        />
      )}
    </Modal>
  );
}

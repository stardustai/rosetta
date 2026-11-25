import { useLanguage, t } from '../i18n';
import {
  ArrowUpOutlined,
  CloudOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Alert, Button, Checkbox, Input, Modal, Table, message } from 'antd';
import { validateSchema } from '../annotation/schema';
import { useEffect, useRef, useState } from 'react';
import { formatSize } from '../localData/files';
import type { PublicAnnotationToolStore } from '../pages/publicAnnotationTool/PublicAnnotationToolStore';
import { storageError } from './adapters';
import type { ConnectedStorage } from './CloudConnectionForm';
import CloudSourcePicker from './CloudSourcePicker';
import { buildCloudImport, listDirectoryObjects } from './import';
import { directoryPrefix } from './paths';
import type { StoragePage } from './types';

export default function CloudDataImport({
  store,
}: {
  store: PublicAnnotationToolStore;
}) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState<ConnectedStorage>();
  const [prefix, setPrefix] = useState('');
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState<StoragePage>({
    objects: [],
    directories: [],
  });
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [count, setCount] = useState(0);
  const [recursive, setRecursive] = useState(true);
  const [sequence, setSequence] = useState(true);
  const [error, setError] = useState('');
  const controller = useRef<AbortController>();
  const request = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);

  async function browse(value: string, append = false) {
    if (!connected) return;
    const next = directoryPrefix(value);
    const revision = ++request.current;
    if (!next.startsWith(connected.source.prefix)) {
      setError(
        t(
          'Select data within the starting directory specified for this connection.',
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await connected.client.list({
        prefix: next,
        delimiter: '/',
        cursor: append ? page.nextCursor : undefined,
      });
      if (revision !== request.current) return;
      setPrefix(next);
      setDraft(next);
      setPage(
        append
          ? {
              objects: [...page.objects, ...result.objects],
              directories: [
                ...new Set([...page.directories, ...result.directories]),
              ],
              nextCursor: result.nextCursor,
            }
          : result,
      );
    } catch (error) {
      if (revision === request.current) setError(storageError(error));
    } finally {
      if (revision === request.current) setBusy(false);
    }
  }

  async function importDirectory() {
    if (!connected || busy || importing || draft !== prefix) return;
    const abort = new AbortController();
    controller.current = abort;
    setImporting(true);
    setError('');
    setCount(0);
    try {
      const objects = await listDirectoryObjects(connected.client, prefix, {
        recursive,
        signal: abort.signal,
        onProgress: setCount,
      });
      const data = buildCloudImport(objects, connected.source, sequence);
      for (const record of data.records) {
        const check = validateSchema('DataRecord', record);
        if (!check.valid) throw new Error(check.errorMessage);
      }
      if (abort.signal.aborted)
        throw new DOMException(t('Reading canceled'), 'AbortError');
      store.setRecords(data.records);
      setOpen(false);
      message.success(
        t('Imported {{v0}} cloud files and created {{v1}} data items{{v2}}', {
          v0: data.fileCount,
          v1: data.records.length,
          v2: data.skippedCount
            ? t(', ignored {{v0}} non-annotation files', {
                v0: data.skippedCount,
              })
            : '',
        }),
      );
    } catch (error) {
      if ((error as Error).name !== 'AbortError')
        setError(
          (error as Error).message?.startsWith(t('Directory')) ||
            (error as Error).message?.startsWith(t('Object storage')) ||
            (error as Error).message?.startsWith(t('Current task')) ||
            (error as Error).message?.startsWith(t('Task data')) ||
            (error as Error).message?.startsWith(t('Local annotation task'))
            ? (error as Error).message
            : storageError(error),
        );
    } finally {
      setImporting(false);
      controller.current = undefined;
    }
  }

  const rows = [
    ...page.directories.map((key) => ({
      key,
      directory: true,
      size: 0,
      name: key.slice(prefix.length).replace(/\/$/, ''),
    })),
    ...page.objects
      .filter((object) => !object.key.endsWith('/'))
      .map((object) => ({
        ...object,
        directory: false,
        name: object.key.slice(prefix.length),
      })),
  ];
  return (
    <>
      <div className="flex items-center py-2 font-bold">
        <span className="mr-4 min-w-16">{t('Object storage:')}</span>
        <Button icon={<CloudOutlined />} onClick={() => setOpen(true)}>
          {t('Import from object storage')}
        </Button>
        {connected && (
          <span className="cloud-connection-label ml-3 text-[var(--ant-color-text-secondary,_#92969e)] text-[12px] font-normal">
            {connected.source.provider.toUpperCase()} ·{' '}
            {connected.source.bucket}
          </span>
        )}
      </div>
      <Modal
        title={t('Import from object storage')}
        open={open}
        width={920}
        destroyOnClose
        maskClosable={!importing && !busy}
        closable={!importing}
        onCancel={() =>
          importing ? controller.current?.abort() : setOpen(false)
        }
        footer={
          connected ? (
            <>
              <Button
                onClick={() =>
                  importing ? controller.current?.abort() : setOpen(false)
                }
              >
                {importing ? t('Cancel reading') : t('Cancel')}
              </Button>
              <Button
                className="ml-2"
                type="primary"
                loading={importing}
                disabled={busy || draft !== prefix}
                onClick={() => importDirectory()}
              >
                {t('Import and configure annotation tools')}
              </Button>
            </>
          ) : null
        }
      >
        {!connected ? (
          <CloudSourcePicker
            onConnected={(value) => {
              setConnected(value);
              setPrefix(value.source.prefix);
              setDraft(value.source.prefix);
              setPage(value.page);
              setError('');
            }}
          />
        ) : (
          <>
            <div className="cloud-directory-heading flex items-center justify-between mb-4 text-[13px]">
              <span>
                {connected.source.provider.toUpperCase()} ·{' '}
                {connected.source.bucket}
              </span>
              <Button
                disabled={busy || importing}
                onClick={() => {
                  request.current++;
                  setConnected(undefined);
                  setError('');
                }}
              >
                {t('Change connection')}
              </Button>
            </div>
            <div className="cloud-directory-path flex items-center gap-2 mb-3">
              <Button
                icon={<ArrowUpOutlined />}
                disabled={
                  busy || importing || prefix === connected.source.prefix
                }
                onClick={() => browse(prefix.replace(/[^/]+\/$/, ''))}
              >
                {t('Parent directory')}
              </Button>
              <Input
                aria-label={t('Object storage directory')}
                value={draft}
                disabled={importing}
                placeholder={t(
                  'Directory prefix; leave blank for the bucket root',
                )}
                onChange={(event) => setDraft(event.target.value)}
                onPressEnter={() => browse(draft)}
              />
              <Button
                loading={busy}
                disabled={importing}
                onClick={() => browse(draft)}
              >
                {t('Open directory')}
              </Button>
            </div>
            <Table
              size="small"
              rowKey="key"
              loading={busy}
              pagination={false}
              scroll={{ y: 300 }}
              dataSource={rows}
              locale={{
                emptyText: t(
                  'This directory is empty or has no files that can be listed',
                ),
              }}
              columns={[
                {
                  title: t('Name'),
                  dataIndex: 'name',
                  render: (name, row) =>
                    row.directory ? (
                      <button
                        type="button"
                        className="cloud-directory-link"
                        disabled={importing}
                        onClick={() => browse(row.key)}
                      >
                        <FolderOutlined /> {name}
                      </button>
                    ) : (
                      <span>
                        <FileOutlined /> {name}
                      </span>
                    ),
                },
                {
                  title: t('Size'),
                  width: 110,
                  render: (_, row) =>
                    row.directory ? '—' : formatSize(row.size),
                },
              ]}
            />
            {page.nextCursor && (
              <Button
                className="cloud-load-more mt-3"
                disabled={busy || importing}
                onClick={() => browse(prefix, true)}
              >
                {t('Load more')}
              </Button>
            )}
            <div className="cloud-import-options flex flex-wrap gap-y-2 gap-x-5 mt-4">
              <Checkbox
                disabled={importing}
                checked={recursive}
                onChange={(event) => setRecursive(event.target.checked)}
              >
                {t('Include subdirectories')}
              </Checkbox>
              <Checkbox
                disabled={importing}
                checked={sequence}
                onChange={(event) => setSequence(event.target.checked)}
              >
                {t(
                  'Group point clouds / images in each directory into consecutive frames',
                )}
              </Checkbox>
            </div>
            <p className="cloud-storage-note text-[var(--ant-color-text-tertiary,_#8a8a8a)] text-[12px] leading-[1.8] mt-1 mx-0 mb-4 font-normal">
              {t(
                'Cloud files are read on demand after you select a directory. The entire directory is not downloaded in advance. Import different data types from their respective subdirectories.',
              )}
            </p>
            {importing && (
              <p>
                {t('Reading directory, found')} {count} {t('files…')}
              </p>
            )}
          </>
        )}
        {error && <Alert type="error" showIcon message={error} />}
      </Modal>
    </>
  );
}

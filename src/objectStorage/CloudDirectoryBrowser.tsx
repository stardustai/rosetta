import { useLanguage, t } from '../i18n';
import {
  ArrowUpOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Alert, Button, Input, Table } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { formatSize } from '../localData/files';
import { storageError } from './adapters';
import type { ConnectedStorage } from './CloudConnectionForm';
import CloudSourcePicker from './CloudSourcePicker';
import { directoryPrefix } from './paths';
import type { StoragePage } from './types';

export interface CloudDirectorySelection {
  connected: ConnectedStorage;
  prefix: string;
}

export default function CloudDirectoryBrowser({
  initialSourceId,
  disabled = false,
  onChange,
}: {
  initialSourceId?: string;
  disabled?: boolean;
  onChange: (value?: CloudDirectorySelection) => void;
}) {
  useLanguage();
  const [connected, setConnected] = useState<ConnectedStorage>();
  const [prefix, setPrefix] = useState('');
  const [draft, setDraft] = useState('');
  const [page, setPage] = useState<StoragePage>({
    objects: [],
    directories: [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const usedInitial = useRef(false);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  async function browse(value: string, append = false) {
    if (!connected || disabled) return;
    const next = directoryPrefix(value);
    if (!next.startsWith(connected.source.prefix)) {
      setError(
        t("Select a directory within the data source's starting directory"),
      );
      setDraft(prefix);
      onChange({ connected, prefix });
      return;
    }
    const current = ++request.current;
    setBusy(true);
    setError('');
    onChange(undefined);
    try {
      const result = await connected.client.list({
        prefix: next,
        delimiter: '/',
        cursor: append ? page.nextCursor : undefined,
      });
      if (current !== request.current) return;
      if (append && result.nextCursor && result.nextCursor === page.nextCursor)
        throw new Error(
          t('Repeated directory pagination token. Open the directory again'),
        );
      setPrefix(next);
      setDraft(next);
      setPage(
        append
          ? {
              objects: [
                ...new Map(
                  [...page.objects, ...result.objects].map((object) => [
                    object.key,
                    object,
                  ]),
                ).values(),
              ],
              directories: [
                ...new Set([...page.directories, ...result.directories]),
              ],
              nextCursor: result.nextCursor,
            }
          : result,
      );
      onChange({ connected, prefix: next });
    } catch (error) {
      if (current === request.current) {
        setError(storageError(error));
        setDraft(prefix);
        onChange({ connected, prefix });
      }
    } finally {
      if (current === request.current) setBusy(false);
    }
  }
  if (!connected)
    return (
      <CloudSourcePicker
        initialSourceId={usedInitial.current ? undefined : initialSourceId}
        onConnected={(value) => {
          usedInitial.current = true;
          setConnected(value);
          setPrefix(value.source.prefix);
          setDraft(value.source.prefix);
          setPage(value.page);
          setError('');
          onChange({ connected: value, prefix: value.source.prefix });
        }}
      />
    );
  const rows = [
    ...page.directories.map((key) => ({
      key,
      name: key.slice(prefix.length).replace(/\/$/, ''),
      directory: true,
      size: 0,
    })),
    ...page.objects
      .filter((object) => !object.key.endsWith('/'))
      .map((object) => ({
        ...object,
        name: object.key.slice(prefix.length),
        directory: false,
      })),
  ];
  return (
    <div className="cloud-directory-browser">
      <div className="cloud-directory-heading flex items-center justify-between mb-4 text-[13px]">
        <span>
          {connected.source.provider.toUpperCase()} · {connected.source.bucket}
        </span>
        <Button
          disabled={disabled || busy}
          onClick={() => {
            request.current++;
            setConnected(undefined);
            setError('');
            onChange(undefined);
          }}
        >
          {t('Change data source')}
        </Button>
      </div>
      <div className="cloud-directory-path flex items-center gap-2 mb-3">
        <Button
          icon={<ArrowUpOutlined />}
          disabled={disabled || busy || prefix === connected.source.prefix}
          onClick={() => browse(prefix.replace(/[^/]+\/$/, ''))}
        >
          {t('Parent directory')}
        </Button>
        <Input
          aria-label={t('Object storage directory')}
          disabled={disabled || busy}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(
              event.target.value === prefix ? { connected, prefix } : undefined,
            );
          }}
          onPressEnter={() => browse(draft)}
          placeholder={t('Directory prefix; leave blank for the bucket root')}
        />
        <Button
          loading={busy}
          disabled={disabled}
          onClick={() => browse(draft)}
        >
          {t('Open directory')}
        </Button>
      </div>
      <Table
        size="small"
        rowKey="key"
        dataSource={rows}
        loading={busy}
        pagination={false}
        scroll={{ y: 220 }}
        locale={{ emptyText: t('This directory is empty') }}
        columns={[
          {
            title: t('Name'),
            dataIndex: 'name',
            render: (name, row) =>
              row.directory ? (
                <button
                  className="cloud-directory-link"
                  disabled={disabled || busy}
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
            render: (_, row) => (row.directory ? '—' : formatSize(row.size)),
          },
        ]}
      />
      {page.nextCursor && (
        <Button
          className="cloud-load-more mt-3"
          disabled={disabled || busy}
          onClick={() => browse(prefix, true)}
        >
          {t('Load more')}
        </Button>
      )}
      {error && (
        <Alert className="mt-3" type="error" showIcon message={error} />
      )}
    </div>
  );
}

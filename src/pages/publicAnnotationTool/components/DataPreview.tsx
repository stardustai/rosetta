import { useLanguage, t } from '../../../i18n';
import {
  FileOutlined,
  PlayCircleOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';
import { fetchResourceURL } from '../../../annotation/configuration';
import type { DataRecord } from '../../../annotation/schema';
import { useRequest } from 'ahooks';
import ky from 'ky';
import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import { buildFileTree } from '../../../localData/fileTree';
import type { DataFileNode } from '../../../localData/fileTree';
import { kindFromRecord } from '../../../localData/recordKind';
import { recordName } from '../../../localData/sessionInfo';
import type { PublicAnnotationToolStore } from '../PublicAnnotationToolStore';
import DataOverview from './DataOverview';

function firstFile(nodes: DataFileNode[]): string | undefined {
  for (const node of nodes) {
    if (node.isLeaf) return node.key.slice('file:'.length);
    const file = firstFile(node.children || []);
    if (file) return file;
  }
}

export default observer(function DataPreview({
  store,
  onAnnotate,
}: {
  store: PublicAnnotationToolStore;
  onAnnotate: () => void;
}) {
  useLanguage();
  const record = store.records[store.activeRecordIndex];
  const kind = kindFromRecord(record);
  const [selected, setSelected] = useState<{
    record: DataRecord;
    url: string;
  }>();
  const pending = useRef<AbortController>();
  const original = firstFile(buildFileTree(record ? [record] : []).tree);
  const url = selected && selected.record === record ? selected.url : original;
  const inline =
    record?.attachmentType === 'TEXT' && url?.startsWith('inline:');
  const { data, error, loading, run, cancel } = useRequest(
    async (value: string) => {
      pending.current?.abort();
      const abort = new AbortController();
      pending.current = abort;
      const resolved = await fetchResourceURL(value);
      abort.signal.throwIfAborted();
      const text =
        kind === 'text' && /\.(?:txt|md)(?:[?#]|$)/i.test(value)
          ? await ky
              .get(resolved, {
                signal: abort.signal,
                retry: 0,
                timeout: 30_000,
              })
              .text()
          : undefined;
      return { key: value, url: resolved, text };
    },
    { manual: true, onError: () => {} },
  );
  useEffect(() => {
    if (url && !inline && kind !== 'pointcloud') run(url);
    return () => {
      cancel();
      pending.current?.abort();
    };
  }, [url, inline, kind, run, cancel]);
  const current = data?.key === url ? data : undefined;
  return (
    <aside
      className="annotation-preview-panel"
      aria-label={t('Data preview and file list')}
    >
      <div className="data-preview-heading">
        <strong>{t('Data preview')}</strong>
        <span>{record?.attachmentType}</span>
      </div>
      <div className="data-preview-body">
        {kind === 'pointcloud' ? (
          <div className="data-preview-placeholder">
            <RadarChartOutlined />
            <strong>{recordName(record)}</strong>
            <span>{t('Supports rotation, zoom, and 3D annotation')}</span>
            <Button onClick={onAnnotate} icon={<PlayCircleOutlined />}>
              {t('Open 3D annotation view')}
            </Button>
          </div>
        ) : loading ? (
          <Spin />
        ) : error ? (
          <Alert
            type="error"
            message={t('Cannot preview this file')}
            description={error.message}
          />
        ) : inline ? (
          <pre>{String(record.attachment)}</pre>
        ) : current && kind === 'image' ? (
          <img src={current.url} alt={recordName(record)} />
        ) : current && kind === 'video' ? (
          <video controls src={current.url} />
        ) : current && kind === 'audio' ? (
          <audio controls src={current.url} />
        ) : current?.text != null ? (
          <pre>{current.text}</pre>
        ) : (
          <div className="data-preview-placeholder">
            <FileOutlined />
            <span>{record ? recordName(record) : t('Select data first')}</span>
            <Button disabled={!record} onClick={onAnnotate}>
              {t('View in annotation workspace')}
            </Button>
          </div>
        )}
      </div>
      <DataOverview
        store={store}
        records={record ? [record] : []}
        onSelectFile={(value) => setSelected({ record, url: value })}
      />
    </aside>
  );
});

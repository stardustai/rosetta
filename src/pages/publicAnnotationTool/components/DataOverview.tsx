import { useLanguage, t } from '../../../i18n';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';
import type { DataFileNode } from '../../../localData/fileTree';
import type { DataRecord } from '../../../annotation/schema';
import { buildFileTree } from '../../../localData/fileTree';
import { dataKindLabels, kindFromRecord } from '../../../localData/presets';
import type { PublicAnnotationToolStore } from '../PublicAnnotationToolStore';

function fileNode(file: DataFileNode): DataNode {
  return {
    key: file.key,
    title: <span title={file.path}>{file.title}</span>,
    isLeaf: file.isLeaf,
    children: file.children?.map(fileNode),
  };
}

export default observer(function DataOverview({
  store,
  records = store.records,
  onSelectFile,
}: {
  store: PublicAnnotationToolStore;
  records?: DataRecord[];
  onSelectFile?: (url: string) => void;
}) {
  useLanguage();
  const listRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const { tree, count } = buildFileTree(records);
  const kinds = [...new Set(records.map(kindFromRecord).filter(Boolean))];
  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const resize = new ResizeObserver(() => setHeight(element.clientHeight));
    setHeight(element.clientHeight);
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  return (
    <aside
      className="annotation-data-overview rounded-lg bg-white dark:bg-gray-900"
      aria-label={t('Data file list')}
    >
      <div className="data-files-heading">
        <span>{t('File list')}</span>
        <span className="data-files-count">
          {t('{{count}} files', { count })}
        </span>
      </div>
      {count > 0 && (
        <div className="data-files-summary">
          {kinds.map((kind) => t(dataKindLabels[kind!])).join(' / ')} ·{' '}
          {t('{{count}} records', { count: records.length })}
        </div>
      )}
      <div
        className="data-file-list flex-1 min-h-0 mt-2 mr-1 mb-2 ml-2 overflow-hidden"
        ref={listRef}
      >
        {tree.length ? (
          <Tree.DirectoryTree
            key={tree[0].key + count}
            className="data-file-tree"
            height={height || 320}
            itemHeight={28}
            virtual
            blockNode
            selectable={!!onSelectFile}
            onSelect={(_keys, info) => {
              if (info.node.isLeaf)
                onSelectFile?.(String(info.node.key).slice('file:'.length));
            }}
            defaultExpandAll
            treeData={tree.map(fileNode)}
          />
        ) : (
          <div className="data-files-empty py-3 px-1 text-[var(--ant-color-text-tertiary,_#8a8a8a)]">
            {t('No files uploaded yet')}
          </div>
        )}
      </div>
    </aside>
  );
});

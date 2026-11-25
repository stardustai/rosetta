import { useLanguage, t } from '../../../i18n';
import {
  FolderOpenOutlined,
  InboxOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Typography, message } from 'antd';
import { useRef } from 'react';
import { fromFileList } from '../../../localData/files';
import type { LocalFile } from '../../../localData/files';
import { stageLocalFiles } from '../../../localData/stagedImports';
import { useLocalFileDrop } from '../../../localData/useLocalFileDrop';
import type { PublicAnnotationToolStore } from '../PublicAnnotationToolStore';

export default function LocalDataUpload({
  store,
}: {
  store: PublicAnnotationToolStore;
}) {
  useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  function pick(files: LocalFile[], folder: boolean) {
    try {
      const data = stageLocalFiles(store, files, folder);
      store.setRecords(data.records);
      if (data.skipped)
        message.info(
          t('Skipped {{v0}} empty or unsupported files', { v0: data.skipped }),
        );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('Cannot read files'),
      );
    }
  }
  const { collecting, dragging, getRootProps } = useLocalFileDrop({
    disabled: false,
    onFiles: (files) =>
      pick(
        files,
        files.some((entry) => entry.path.includes('/')),
      ),
    onError: (error) => message.error(error.message),
  });
  return (
    <section
      className="annotation-local-upload"
      aria-label={t('Upload your own data')}
    >
      <div className="annotation-upload-actions">
        <span className="annotation-scene-label">{t('Local data:')}</span>
        <Button
          icon={<UploadOutlined />}
          onClick={() => fileInput.current?.click()}
          disabled={collecting}
        >
          {t('Select files')}
        </Button>
        <Button
          icon={<FolderOpenOutlined />}
          onClick={() => folderInput.current?.click()}
          disabled={collecting}
        >
          {t('Select folder')}
        </Button>
        <Typography.Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://docs.morningstar.works/zh-CN/docs/data/data-format"
        >
          <QuestionCircleOutlined /> {t('Data preparation guide')}
        </Typography.Link>
      </div>
      <div
        {...getRootProps()}
        className={`annotation-file-drop${dragging ? ' is-dragging' : ''}`}
        role="button"
        tabIndex={collecting ? -1 : 0}
        aria-label={t('Drop files here to start annotating')}
        aria-busy={collecting}
        onClick={() => !collecting && fileInput.current?.click()}
        onKeyDown={(event) => {
          if (['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (!collecting) fileInput.current?.click();
          }
        }}
      >
        <InboxOutlined />
        <div>
          <strong>
            {collecting
              ? t('Reading files…')
              : t('Drop files here to start annotating')}
          </strong>
          <span>
            {t('Supports images, point clouds, audio, video, and text.')}
          </span>
        </div>
      </div>
      <input
        ref={fileInput}
        hidden
        type="file"
        multiple
        onChange={(event) => {
          if (event.target.files?.length)
            pick(fromFileList(event.target.files), false);
          event.target.value = '';
        }}
      />
      <input
        ref={folderInput}
        hidden
        type="file"
        multiple
        {...{ webkitdirectory: '', directory: '' }}
        onChange={(event) => {
          if (event.target.files?.length)
            pick(fromFileList(event.target.files), true);
          event.target.value = '';
        }}
      />
    </section>
  );
}

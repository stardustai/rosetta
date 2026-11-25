import { useLanguage, t } from '../../i18n';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, message } from 'antd';
import { validateSchema } from '../../annotation/schema';
import { observer } from 'mobx-react';
import {
  inputsFromJSON,
  recordsFromJSONLines,
} from '../../localData/dataTasks';
import CloudDataImport from '../../objectStorage/CloudDataImport';
import LocalDataUpload from './components/LocalDataUpload';
import type { PublicAnnotationToolStore } from './PublicAnnotationToolStore';

export const SceneCase = observer(
  ({ store }: { store: PublicAnnotationToolStore }) => {
    useLanguage();
    if (store.managedTask)
      return (
        <p className="task-editor-note">
          {t(
            'This task contains one data item. Configure annotation tools here; return to the task list to add or batch import data.',
          )}
        </p>
      );
    async function importFile(file: File) {
      try {
        const text = await file.text();
        if (/\.jsonl$/i.test(file.name)) {
          const records = recordsFromJSONLines(text);
          for (const record of records) {
            const check = validateSchema('DataRecord', record);
            if (!check.valid) throw new Error(check.errorMessage);
          }
          store.setRecords(records);
        } else {
          const input = inputsFromJSON(text, file.name)[0];
          const check = validateSchema('PublicAnnotationInput', input);
          if (!check.valid) throw new Error(check.errorMessage);
          store.setData(input);
        }
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : t('Failed to read data'),
        );
      }
      return false as const;
    }
    function clear() {
      store.resetCustom();
      message.info(t('Data cleared. Upload it again.'));
    }
    return (
      <>
        <LocalDataUpload store={store} />
        <CloudDataImport store={store} />
        <div className="flex items-center py-2 font-bold">
          <span className="mr-4 min-w-16">{t('Upload data:')}</span>
          <div className="flex flex-1">
            <Upload
              showUploadList
              accept=".json,application/json"
              beforeUpload={importFile}
              onRemove={clear}
            >
              <Button icon={<UploadOutlined />}>
                {t('Upload PublicAnnotationInput')}
              </Button>
            </Upload>
            <Upload
              showUploadList
              className={`ml-3${store.input == null ? ' opacity-50' : ''}`}
              disabled={store.input == null}
              accept=".jsonl"
              beforeUpload={importFile}
              onRemove={clear}
            >
              <Button icon={<UploadOutlined />}>{t('Upload JSONL')}</Button>
            </Upload>
          </div>
        </div>
      </>
    );
  },
);

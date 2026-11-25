import { setLanguage } from '../../src/i18n';
import { applicationRoot } from '../../src/main';
import { history } from '../../src/navigation';
import { buildLocalImport } from '../../src/localData/files';
import {
  createTask,
  getLocalFile,
  loadSession,
  storeImport,
} from '../../src/localData/storage';
import { createDefaultOperators } from '../../src/localData/presets';
import { Modal } from 'antd';

globalThis.hostTest = {
  setLanguage,
  confirm: () => Modal.confirm({ title: '确认操作', content: '深色弹窗检查' }),
  async createLocalTask(name = 'iframe task') {
    const local = buildLocalImport(
      [{ path: 'image.png', file: new File(['local image'], 'image.png') }],
      'image',
      false,
      'iframe-fixture',
    );
    await storeImport(local, new AbortController().signal, () => {});
    return createTask(name, {
      taskParams: {
        type: 'multiple',
        records: local.records,
        operators: createDefaultOperators('image'),
      },
    });
  },
  navigate: (url: string) => history.push(url),
  loadSession,
  getLocalFile,
  unmount: () => applicationRoot.unmount(),
};

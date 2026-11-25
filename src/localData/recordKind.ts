import { t } from '../i18n';
import type { DataRecord } from '../annotation/schema';
import type { DataKind } from './files';

export const dataKindLabels: Record<DataKind, string> = {
  get pointcloud() {
    return t('Point cloud');
  },
  get image() {
    return t('Image');
  },
  get audio() {
    return t('Audio');
  },
  get video() {
    return t('Video');
  },
  get text() {
    return t('Text / document');
  },
};

export function kindFromRecord(record?: DataRecord): DataKind | undefined {
  const type = record?.attachmentType?.toUpperCase() || '';
  if (type.includes('POINTCLOUD')) return 'pointcloud';
  if (type.startsWith('IMAGE')) return 'image';
  if (type.startsWith('VIDEO')) return 'video';
  if (type.startsWith('AUDIO')) return 'audio';
  if (type === 'TEXT') return 'text';
}

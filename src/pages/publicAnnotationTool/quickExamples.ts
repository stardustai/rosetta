import { t, getLanguage } from '../../i18n';
import type {
  DataRecord,
  DataRecordType,
  PublicAnnotationInput,
} from '../../annotation/schema';
import type { DataKind } from '../../localData/files';
import { createDefaultOperators } from '../../localData/presets';

export interface QuickExample {
  id: string;
  name: string;
  kind: DataKind;
  description: string;
  tools: string;
  record: () => DataRecord;
}
const asset = (name: string) => `${import.meta.env.BASE_URL}examples/${name}`;
export const quickExamples: QuickExample[] = [
  {
    id: 'image',
    get name() {
      return t('Image object annotation');
    },
    kind: 'image',
    get description() {
      return t('Label vehicles and pedestrians at an intersection');
    },
    get tools() {
      return t('Rectangle / polygon / keypoint');
    },
    record: () => ({
      attachmentType: 'IMAGE' as DataRecordType.Image,
      attachment: asset('street.svg'),
      metadata: { title: t('intersection.svg') },
    }),
  },
  {
    id: 'pointcloud',
    get name() {
      return t('3D point cloud annotation');
    },
    kind: 'pointcloud',
    get description() {
      return t('Rotate the point cloud and add 3D annotations to vehicles');
    },
    get tools() {
      return t('3D box / polyline / 3D point');
    },
    record: () =>
      ({
        attachmentType: 'POINTCLOUD' as DataRecordType.PointCloud,
        attachment: { url: asset('street.pcd'), name: 'street.pcd' },
        metadata: { title: t('road-pointcloud.pcd') },
      } as DataRecord),
  },
  {
    id: 'text',
    get name() {
      return t('Text entity annotation');
    },
    kind: 'text',
    get description() {
      return t('Select text to label people, places, and other entities');
    },
    get tools() {
      return t('Text selection / entity annotation');
    },
    record: () => ({
      attachmentType: 'TEXT' as DataRecordType.Text,
      attachment: asset(
        getLanguage() === 'en-US'
          ? 'entities.txt'
          : `entities.${getLanguage()}.txt`,
      ),
      metadata: { title: t('travel-record.txt') },
    }),
  },
];

export function exampleInput(example: QuickExample): PublicAnnotationInput {
  return {
    taskParams: {
      type: 'multiple',
      operators: createDefaultOperators(example.kind),
      records: [example.record()],
    },
  };
}

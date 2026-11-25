import { t } from '../i18n';
import type { Operator, SlotSpecification } from '../annotation/schema';
import {
  DEFAULT_LINE_STYLE,
  OperatorType,
  ProjectTypeEnum,
  SlotType,
} from '../annotation/schema';
import type { DataKind } from './files';

export { dataKindLabels, kindFromRecord } from './recordKind';
export const projectTypeForKind: Record<DataKind, ProjectTypeEnum> = {
  pointcloud: ProjectTypeEnum.ThreeDAnnotation,
  image: ProjectTypeEnum.ImageAnnotation,
  audio: ProjectTypeEnum.AudioAnnotation,
  video: ProjectTypeEnum.VideoAnnotation,
  text: ProjectTypeEnum.TextAnnotation,
};

export function createDefaultOperators(kind: DataKind): Operator[] {
  const definitions: Record<DataKind, [SlotType, string][]> = {
    pointcloud: [
      [SlotType.Box3D, t('3D box')],
      [SlotType.Line3D, t('3D polyline')],
      [SlotType.Point3D, t('3D point')],
    ],
    image: [
      [SlotType.Box2D, t('Rectangle')],
      [SlotType.Polygon, t('Polygon')],
      [SlotType.Point, t('Keypoint')],
    ],
    video: [
      [SlotType.Box2D, t('Rectangle')],
      [SlotType.Polygon, t('Polygon')],
      [SlotType.Point, t('Keypoint')],
    ],
    audio: [[SlotType.TimeSlice, t('Audio segment')]],
    text: [[SlotType.Text, t('Text selection')]],
  };
  return definitions[kind].map(([type, label]) => ({
    key: `default-${type}`,
    type: OperatorType.Slot,
    label: t(label) || label,
    slotSpecification: {
      type,
      ...(type === SlotType.Line3D ? { lineStyle: DEFAULT_LINE_STYLE } : {}),
      ...([SlotType.Box2D, SlotType.Polygon, SlotType.Point].includes(type)
        ? { restrictInsideCanvasBoundary: true }
        : {}),
      ...(type === SlotType.Box2D
        ? {
            topLeftMark: '1',
            topRightMark: '2',
            bottomRightMark: '3',
            bottomLeftMark: '4',
            sizeCheckSwitch: true,
          }
        : {}),
    } as SlotSpecification,
  }));
}

// Reimporting the same modality preserves the user's edited labels and tools.
export function operatorsForImport(
  kind: DataKind,
  previousKind: DataKind | undefined,
  operators?: Operator[] | null,
) {
  return kind === previousKind && operators?.length
    ? operators
    : createDefaultOperators(kind);
}

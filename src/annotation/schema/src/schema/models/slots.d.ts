import { AnnotationBaseMetadata, AnnotationSlotUserInfo, HintConfidence, HintStatus, InterpolatedCoordinate } from './annotation';
import { SlotType } from './slotSpecification';
export type Point = {
    x: number;
    y: number;
    group?: number;
};
export type Point3D = {
    x: number;
    y: number;
    z: number;
};
export type FilePath = {
    url: string;
};
export type Slots = string[];
export type BoundaryIndex = {
    topLeftIndex?: number;
    bottomRightIndex?: number;
};
export type Selected3DPoints = number | {
    [index: string]: Point3D;
} | number[];
export type CsgConvex = {
    type: 'Convex';
    value: Point3D[];
};
export type CsgBox3d = {
    type: 'box3D';
    value: Box3D;
};
export type CsgPolygon = {
    type: 'polygon';
    value: {
        points: Array<{
            x: number;
            y: number;
        }>;
        params: CameraParameters;
    };
};
export type CsgAtomShape = CsgConvex | CsgBox3d | CsgPolygon;
export type BaseCameraType = 'PerspectiveCamera' | 'OrthographicCamera';
export interface BaseCameraParameters {
    type: BaseCameraType;
    near: number;
    far: number;
    position: [number, number, number];
    rotation: [number, number, number];
}
export interface PerspectiveCameraParameters extends BaseCameraParameters {
    type: 'PerspectiveCamera';
    fov: number;
    aspect: number;
}
export interface OrthographicCameraParameters extends BaseCameraParameters {
    type: 'OrthographicCamera';
    left: number;
    right: number;
    top: number;
    bottom: number;
}
export type CameraParameters = PerspectiveCameraParameters | OrthographicCameraParameters;
export declare enum CSGOperation {
    ADDITION = 1,
    SUBTRACTION = 2,
    DELETED = 3,
    ADDITION_ON_TOP = 4,
    SUBTRACTION_ON_TOP = 5
}
export type CsgProperty = {
    operation: CSGOperation;
    shape: CsgAtomShape;
    time?: number;
};
export type CsgProperties = Array<CsgProperty>;
export type Box3DGeometry = {
    width: number;
    height: number;
    depth: number;
};
export type Box3D = number[];
export type Plane = {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
};
export type Plane3D = {
    topLeft: Point3D;
    topRight: Point3D;
    bottomRight: Point3D;
    bottomLeft: Point3D;
};
export type Mask = {
    format: 'rle';
    rle: number[];
};
export declare enum SlotDataSourceEnum {
    'STARDUST_ALGO' = 1,
    'THIRD_PART_ALGO' = 2,
    'MANUAL_OPERATION' = 3
}
export type SlotBase = AnnotationSlotUserInfo & {
    id: string;
    label: string;
    confidence?: number;
    confirmed?: boolean;
    hintConfidence?: HintConfidence;
    hintStatus?: HintStatus;
    source?: string;
    metadata?: AnnotationBaseMetadata;
};
export type TextSlot = SlotBase & {
    type: SlotType.Text;
    text: string;
    start?: number;
    length?: number;
    selection?: string;
};
export type CellSlot = SlotBase & {
    type: SlotType.Cell;
    cells: string[];
};
export type CuboidVertices = {
    front: Plane;
    back: Plane;
    combineTransform?: boolean;
};
export type CuboidSlot = SlotBase & {
    type: SlotType.Cuboid;
    binding?: boolean;
    unbindings?: string[];
    vertices: CuboidVertices;
    timeSeries?: TimeSeries<CuboidVertices>;
};
export type InteractiveSegmentationPoint = {
    top: number;
    left: number;
    type: 'positive' | 'negative';
};
export type PolygonSlot = SlotBase & {
    type: SlotType.Polygon;
    binding?: boolean;
    unbindings?: string[];
    vertices: Point[];
    timeSeries?: TimeSeries<Point[]>;
    boundaryIndexes?: BoundaryIndex;
    interactiveSegmentation?: InteractiveSegmentationPoint[];
};
export type Polygon3DSlot = SlotBase & {
    type: SlotType.Polygon3D;
    points: Point3D[];
    timeSeries?: TimeSeries<Point3D[]>;
    coordinate?: InterpolatedCoordinate;
    immovable?: boolean;
    unbindings?: string[];
};
export type AudioRecordingSlot = SlotBase & {
    type: SlotType.AudioRecording;
    url: string;
    duration: number;
    soundWave: number[];
    device?: string;
    deviceId?: string;
    platform?: string;
    appVersion?: string;
    localNoiseDetectionLevel?: number;
    secondsSinceLocalNoiseDetection?: number;
    ipAddress?: string;
    sampleRate?: number;
    bitRate?: number;
};
export type TimeSliceSlot = SlotBase & {
    type: SlotType.TimeSlice;
    start: number;
    length: number;
};
export type TimeFrameAppear<T> = AnnotationSlotUserInfo & {
    type: 'appear';
    confidence?: number;
    binding?: boolean;
    unbindings?: string[];
    consistent?: boolean;
    value: T;
    tag?: string;
    metadata?: {
        pointCount?: number;
    };
};
export type TimeFrameDisappear = AnnotationSlotUserInfo & {
    type: 'disappear';
    tag?: string;
};
export type TimeSeries<T> = {
    [time: number]: TimeFrame<T>;
};
export type TimeFrame<T> = TimeFrameAppear<T> | TimeFrameDisappear;
export type Box2dSlot = SlotBase & {
    type: SlotType.Box2D;
    plane: Plane;
    binding?: boolean;
    unbindings?: string[];
    timeSeries?: TimeSeries<Plane>;
};
export type PointSlot = SlotBase & {
    type: SlotType.Point;
    point: Point;
    binding?: boolean;
    unbindings?: string[];
    timeSeries?: TimeSeries<Point>;
};
export type Box3DSlot = SlotBase & {
    type: SlotType.Box3D;
    box: Box3D;
    consistent?: boolean;
    timeSeries?: TimeSeries<Box3D>;
    coordinate?: InterpolatedCoordinate;
    immovable?: boolean;
    unbindings?: string[];
    metadata?: {
        pointCount?: number;
    };
};
export type SemanticSegmentation2DSlot = SlotBase & {
    type: SlotType.SemanticSegmentation2D;
    mask: Mask;
    timeSeries?: TimeSeries<Mask>;
};
export type SemanticSegmentation3DSlot = SlotBase & {
    type: SlotType.SemanticSegmentation3D;
    points: Selected3DPoints;
    timeSeries?: TimeSeries<Selected3DPoints>;
};
export type CsgSegmentation3DSlot = SlotBase & {
    type: SlotType.CsgSegmentation3D;
    csg: CsgProperties;
    timeSeries?: TimeSeries<CsgProperties>;
};
export type LineSlot = SlotBase & {
    type: SlotType.Line;
    vertices: Point[];
    binding?: boolean;
    unbindings?: string[];
    timeSeries?: TimeSeries<Point[]>;
};
export type Line3DSlot = SlotBase & {
    type: SlotType.Line3D;
    points: Point3D[];
    timeSeries?: TimeSeries<Point3D[]>;
    coordinate?: InterpolatedCoordinate;
    immovable?: boolean;
    unbindings?: string[];
};
export type Point3DSlot = SlotBase & {
    type: SlotType.Point3D;
    point: Point3D;
    timeSeries?: TimeSeries<Point3D>;
    coordinate?: InterpolatedCoordinate;
    immovable?: boolean;
    unbindings?: string[];
};
export type SplinesSlot = SlotBase & {
    type: SlotType.Splines;
    vertices: Point[];
    binding?: boolean;
    unbindings?: string[];
    timeSeries?: TimeSeries<Point[]>;
};
export type FileSlot = SlotBase & {
    type: SlotType.File;
    path: FilePath;
    timeSeries?: TimeSeries<FilePath>;
};
export type GroupSlot = SlotBase & {
    type: SlotType.Group;
    slots: Slots;
    timeSeries?: TimeSeries<Slots>;
};
export type Rectangle3DSlot = SlotBase & {
    type: SlotType.Rectangle3D;
    plane3d: Plane3D;
    timeSeries?: TimeSeries<Plane3D>;
    coordinate?: InterpolatedCoordinate;
    immovable?: boolean;
    unbindings?: string[];
};
export type Slot = TextSlot | CellSlot | Box2dSlot | Box3DSlot | SemanticSegmentation2DSlot | SemanticSegmentation3DSlot | CsgSegmentation3DSlot | PointSlot | Point3DSlot | LineSlot | Line3DSlot | SplinesSlot | CuboidSlot | PolygonSlot | Polygon3DSlot | Rectangle3DSlot | AudioRecordingSlot | TimeSliceSlot | FileSlot | GroupSlot;
export type TimeSeriesSlot = Box2dSlot | Box3DSlot | SemanticSegmentation3DSlot | SemanticSegmentation2DSlot | CsgSegmentation3DSlot | PointSlot | LineSlot | Line3DSlot | Point3DSlot | SplinesSlot | PolygonSlot | Polygon3DSlot | Rectangle3DSlot | CuboidSlot | FileSlot | GroupSlot;

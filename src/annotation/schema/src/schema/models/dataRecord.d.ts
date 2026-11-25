import { Annotation } from './annotation';
import { FrameConfig } from './dataSet';
import { Operator } from './operator';
import { TaskResult } from './schema';
import { Box2dSlot, Box3DSlot, CuboidSlot, Line3DSlot, LineSlot, Point3D, Point3DSlot, PointSlot, Polygon3DSlot, PolygonSlot, SlotDataSourceEnum, SplinesSlot } from './slots';
type Multiple<Record extends {
    attachment: any;
    attachmentType: any;
}, Type extends DataRecordType> = Omit<Record, 'attachment' | 'attachmentType'> & {
    attachmentType: Type;
    attachment: Array<Record['attachment']>;
};
type PointCloudSetMultiple<Record extends {
    attachment: any;
    attachmentType: any;
}, Type extends DataRecordType> = Omit<Record, 'attachment' | 'attachmentType'> & {
    attachmentType: Type;
    attachment: Array<Omit<Record['attachment'], 'name'> & {
        name: string;
    }>;
};
export type DataRecord = PointCloud4DDataRecord | PointCloud4DSetDataRecord | TimeSequenceDataRecord | PointCloudDataRecord | PointCloudSequenceDataRecord | PointCloudSetDataRecord | PointCloudSetSequenceDataRecord | ImageDataRecord | ImageSetDataRecord | ImageSequenceDataRecord | ImageSetDataRecordSequenceRecord | VideoDataRecord | VideoSetDataRecord | TextDataRecord | AudioDataRecord | AudioSetDataRecord;
export declare enum DataRecordType {
    Image = "IMAGE",
    ImageSet = "IMAGE_SET",
    ImageSequence = "IMAGE_SEQUENCE",
    ImageSetSequence = "IMAGE_SET_SEQUENCE",
    Video = "VIDEO",
    VideoSet = "VIDEO_SET",
    Audio = "AUDIO",
    AudioSet = "AUDIO_SET",
    PointCloud = "POINTCLOUD",
    PointCloudSequence = "POINTCLOUD_SEQUENCE",
    PointCloudSet = "POINTCLOUD_SET",
    PointCloudSetSequence = "POINTCLOUD_SET_SEQUENCE",
    Text = "TEXT",
    TimeSequence = "TIME_SEQUENCE",
    PointCloud_4D = "PointCloud_4D",
    PointCloud_4D_SET = "PointCloud_4D_SET"
}
export declare enum PointCloudType {
    Ordinary = "ordinary",
    Arachne = "arachne"
}
export interface BaseDataRecordMetadata {
    externalId?: string;
    title?: string;
    position?: number;
    uniqueIdentifier?: string;
    allowNoNeedToAnnotate?: boolean;
    additionalInfo?: {
        [key: string]: any;
    };
    displayInfo?: {
        [key: string]: any;
    };
    preprocessedData?: {
        shouldMigrateOperators?: boolean;
        operators?: Operator[];
        annotations?: Annotation[];
        hints?: Annotation[];
        metadata?: TaskResult['metadata'];
        algorithms?: {
            id: string;
            name: string;
            type: SlotDataSourceEnum.THIRD_PART_ALGO;
        }[];
    };
    dispatchGroup?: {
        identifier: string;
    };
    watermark?: boolean;
    labelIds?: number[];
}
export interface TimeSequenceDataRecordMetadata extends BaseDataRecordMetadata {
    sourceType: DataRecordType.ImageSetSequence | DataRecordType.PointCloudSequence;
}
export interface PointCloud4DRecordMetadata extends BaseDataRecordMetadata {
    sourceType: DataRecordType.ImageSetSequence | DataRecordType.PointCloudSequence;
}
export type UnFrameConfig = {
    originId: string;
    topicIndex: number;
    frameConfig: FrameConfig;
};
export interface PointCloudDataRecordMetadata extends BaseDataRecordMetadata {
    dataSetUnFrameConfig?: UnFrameConfig;
}
export type PointCloudCoordinate = {
    x: number;
    y: number;
    z: number;
};
export declare enum ScopeType {
    Circle = "circle",
    Rectangle = "rectangle",
    Fan = "fan",
    Polygon = "polygon"
}
export type CircleScope = {
    type: ScopeType.Circle;
    radius: number;
};
export type RectangleScope = {
    type: ScopeType.Rectangle;
    width: number;
    height: number;
    rotation: PointCloudCoordinate;
};
export type FanScope = {
    type: ScopeType.Fan;
    radius: number;
    radian: number;
    angle: number;
};
export type PolygonScope = {
    type: ScopeType.Polygon;
    points: Point3D[];
};
export type Scope = CircleScope | RectangleScope | FanScope | PolygonScope;
export declare enum CameraType {
    PinHole = "PinHole",
    Fisheye = "Fisheye",
    OmniDirectional = "OmniDirectional",
    Bev = "Bev",
    FTheta = "FTheta"
}
export type CameraHeading = PointCloudCoordinate & {
    w: number;
};
export type CameraIntrinsicParameter = {
    fx: number;
    fy: number;
    cx: number;
    cy: number;
    c?: number;
    d?: number;
    e?: number;
};
export type CameraRadial = {
    k1: number;
    k2: number;
    k3: number;
    k4?: number;
    k5?: number;
    k6?: number;
};
export type CameraTangential = {
    p1: number;
    p2: number;
};
export interface CameraSource {
    type: CameraType;
    position: PointCloudCoordinate;
    heading: CameraHeading;
    intrinsic: CameraIntrinsicParameter;
    skew: number;
    radial: CameraRadial;
    tangential: CameraTangential;
    projection?: number[];
    unProjection?: number[];
    matrix?: number[];
    fov?: number;
    minz?: number;
    maxz?: number;
    extrinsic?: number[];
}
export interface TimeSequenceSource {
    url: string;
    type?: PointCloudType;
    pointCloudSources: (PointCloudSource & {
        dynamicUrl?: string;
    })[];
}
export interface TimeSequenceDataRecord {
    attachmentType: DataRecordType.TimeSequence;
    attachment: TimeSequenceSource;
    extraInfoUrls?: string[];
    metadata?: TimeSequenceDataRecordMetadata;
}
export interface PointCloud4DSource {
    url: string;
    type?: PointCloudType;
    name?: string;
    imageSources: Array<PointCloudSource['imageSources']>;
    coordinates: Array<PointCloudSource['coordinate']>;
    shapes: Array<PointCloudSource['shapes']>;
    scopeLimit: Array<PointCloudSource['scopeLimit']>;
    referenceImage: {
        extraUrls: Array<{
            name: string;
            url: string;
        }>;
        projection?: {
            width: number;
            height: number;
            scales: [number, number];
            imageToWorld: [number, number, number, number, number, number, number];
            imageToWorldQuaternionOrder: `${'x' | 'y' | 'z' | 'w'}${'x' | 'y' | 'z' | 'w'}${'x' | 'y' | 'z' | 'w'}${'x' | 'y' | 'z' | 'w'}`;
            heightMapUrl: string;
        };
    };
}
export interface PointCloud4DDataRecord {
    attachmentType: DataRecordType.PointCloud_4D;
    attachment: PointCloud4DSource;
    extraInfoUrls?: string[];
    metadata?: PointCloud4DRecordMetadata;
}
export interface PointCloud4DSetDataRecord {
    attachmentType: DataRecordType.PointCloud_4D_SET;
    attachment: Array<PointCloud4DSource>;
    extraInfoUrls?: string[];
    metadata?: PointCloud4DRecordMetadata;
}
export interface PointCloudSource {
    url: string;
    extraPCDs?: {
        name: string;
        url: string;
    }[];
    name?: string;
    scope?: Scope;
    scopeLimit?: Scope[];
    coordinate?: {
        camera_height?: number;
        ego?: PointCloudCoordinate;
        position?: PointCloudCoordinate;
        egoHeading?: PointCloudCoordinate & {
            w: number;
        };
        floorPointsUrl?: string;
    };
    imageSources?: {
        url: string;
        name: string;
        width: number;
        height: number;
        camera?: CameraSource;
        calibs?: number[];
        shapes?: Array<Shape2DSlot>;
    }[];
    shapes?: Array<Box3DSlot | Polygon3DSlot | Point3DSlot | Line3DSlot>;
    type?: PointCloudType;
}
export interface PointCloudDataRecord {
    attachmentType: DataRecordType.PointCloud;
    attachment: PointCloudSource;
    extraInfoUrls?: string[];
    metadata?: PointCloudDataRecordMetadata;
}
export type PointCloudSequenceDataRecord = Multiple<PointCloudDataRecord, DataRecordType.PointCloudSequence>;
export type PointCloudSetDataRecord = PointCloudSetMultiple<PointCloudDataRecord, DataRecordType.PointCloudSet>;
export type PointCloudSetSequenceDataRecord = Multiple<PointCloudSetMultiple<PointCloudDataRecord, DataRecordType.PointCloudSetSequence>, DataRecordType.PointCloudSetSequence>;
export interface VideoDataRecord {
    attachmentType: DataRecordType.Video;
    attachment: string;
    extraInfoUrls?: string[];
    metadata?: VideoDataRecordMetadata;
}
export interface VideoDataRecordMetadata extends BaseDataRecordMetadata {
    size?: {
        width: number;
        height: number;
    };
    duration?: number;
    fps?: number;
    sum_frame_num?: number;
}
export type Shape2DSlot = Box2dSlot | PointSlot | SplinesSlot | LineSlot | PolygonSlot | CuboidSlot;
export type ImageSourceEntity = {
    url: string;
    shapes?: Array<Shape2DSlot>;
};
export type ImageSource = string | ImageSourceEntity | ImageSourceEntity[];
export interface ImageDataRecord {
    attachmentType: DataRecordType.Image;
    attachment: ImageSource;
    extraInfoUrls?: string[];
    metadata?: ImageDataRecordMetadata;
}
export type ImageSetSource = {
    url: string;
    name?: string;
    id?: string;
    mapInfo?: ImageViewMapperInfo;
};
export type ImageSetDataBaseRecord = {
    attachmentType: DataRecordType.ImageSet;
    attachment: ImageSetSource;
    extraInfoUrls?: string[];
    metadata?: ImageDataRecordMetadata;
};
export type ImageSetDataRecord = Multiple<ImageSetDataBaseRecord, DataRecordType.ImageSet>;
export type ImageSetDataRecordSequenceRecord = Multiple<ImageSetDataRecord, DataRecordType.ImageSetSequence>;
export type ImageSequenceDataRecord = Multiple<ImageDataRecord, DataRecordType.ImageSequence>;
export interface ImageDataRecordMetadata extends BaseDataRecordMetadata {
    size?: {
        width: number;
        height: number;
    };
    camera?: CameraSource;
    dataSetUnFrameConfig?: UnFrameConfig;
}
export interface ImageViewMapperInfo {
    type: 'lut';
    tableUrl: string;
}
export interface TextDataRecord {
    attachmentType: DataRecordType.Text;
    attachment: string;
    extraInfoUrls?: string[];
    metadata?: TextDataRecordMetadata;
}
export interface TextDataRecordMetadata extends BaseDataRecordMetadata {
}
export type VideoSetSource = {
    url: string;
    name?: string;
    id?: string;
};
export type VideoSetDataBaseRecord = {
    attachmentType: DataRecordType.VideoSet;
    attachment: VideoSetSource;
    extraInfoUrls?: string[];
    metadata?: VideoDataRecordMetadata;
};
export type VideoSetDataRecord = Multiple<VideoSetDataBaseRecord, DataRecordType.VideoSet>;
export interface AudioDataRecord {
    attachmentType: DataRecordType.Audio;
    attachment: string;
    extraInfoUrls?: string[];
    metadata?: AudioDataRecordMetadata;
}
export type AudioSetDataRecord = Multiple<AudioDataRecord, DataRecordType.AudioSet>;
export interface AudioDataRecordMetadata extends BaseDataRecordMetadata {
}
export type DataRecordMetadata = AudioDataRecordMetadata | TextDataRecordMetadata | ImageDataRecordMetadata | PointCloudDataRecordMetadata;
export {};

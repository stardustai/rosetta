import { Box3DGeometry } from './slots';
export type BaseSlotSpecification = {
    customColor?: string;
};
export type TextSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Text;
    maxLength?: number;
    minLength?: number;
};
export type CellSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Cell;
};
export type Box2dSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Box2D;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    restrictInsideCanvasBoundary?: boolean;
    sizeCheckSwitch?: boolean;
    imageSourceMapping?: string[];
    topLeftMark: string;
    topRightMark: string;
    bottomRightMark: string;
    bottomLeftMark: string;
};
export type AudioRecordingSlotSpecification = BaseSlotSpecification & {
    type: SlotType.AudioRecording;
    area: string;
    minTime?: number;
    maxTime?: number;
    acceptableNoiseLevel?: number;
    startReserveTime?: number;
    endReserveTime?: number;
};
export declare enum MappingScope {
    inside = "inside",
    outside = "outside",
    both = "both"
}
export declare enum FileType {
    image = "image",
    video = "video",
    audio = "audio"
}
export type Box3dSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Box3D;
    presetSizes?: {
        name: string;
        geometry: Box3DGeometry;
    }[];
    minVertices?: number;
    maxVertices?: number;
    maxPadding?: number;
    imageSourceMapping?: string[];
    mappingScope?: MappingScope;
    consistentSize?: boolean;
    looseConsistentSize?: boolean;
};
export type SemanticSegmentation2DSlotSpecification = BaseSlotSpecification & {
    type: SlotType.SemanticSegmentation2D;
};
export type SemanticSegmentation3DSlotSpecification = BaseSlotSpecification & {
    type: SlotType.SemanticSegmentation3D;
};
export type CsgSegmentation3DSlotSpecification = BaseSlotSpecification & {
    type: SlotType.CsgSegmentation3D;
};
export declare enum LineStyle {
    Solid = "solid",
    Dashed = "dashed"
}
export declare const DEFAULT_LINE_STYLE = LineStyle.Solid;
export type LineSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Line;
    lineStyle?: LineStyle;
    minVertices?: number;
    imageSourceMapping?: string[];
    maxVertices?: number;
    restrictInsideCanvasBoundary?: boolean;
};
export type Line3dSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Line3D;
    lineStyle?: LineStyle;
    minVertices?: number;
    maxVertices?: number;
    mappingScope?: MappingScope;
    imageSourceMapping?: string[];
};
export type SplinesSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Splines;
    lineStyle?: LineStyle;
    minVertices?: number;
    imageSourceMapping?: string[];
    maxVertices?: number;
    restrictInsideCanvasBoundary?: boolean;
};
export type PointSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Point;
    imageSourceMapping?: string[];
    restrictInsideCanvasBoundary?: boolean;
};
export type Point3DSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Point3D;
    mappingScope?: MappingScope;
    imageSourceMapping?: string[];
};
export type CuboidSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Cuboid;
    cameraHeight?: number;
    minHeight?: number;
    minWidth?: number;
    sizeCheckSwitch?: boolean;
    restrictInsideCanvasBoundary?: boolean;
    frontTopLeftMark: string;
    frontTopRightMark: string;
    frontBottomRightMark: string;
    frontBottomLeftMark: string;
    backTopLeftMark: string;
    backTopRightMark: string;
    backBottomRightMark: string;
    backBottomLeftMark: string;
};
export type PolygonSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Polygon;
    minVertices?: number;
    minWidth?: number;
    minHeight?: number;
    imageSourceMapping?: string[];
    sizeCheckSwitch?: boolean;
    maxVertices?: number;
    restrictInsideCanvasBoundary?: boolean;
};
export type Polygon3dSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Polygon3D;
    imageSourceMapping?: string[];
    mappingScope?: MappingScope;
    minVertices?: number;
    maxVertices?: number;
};
export type Rectangle3dSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Rectangle3D;
    imageSourceMapping?: string[];
    mappingScope?: MappingScope;
};
export type FileSlotSpecification = BaseSlotSpecification & {
    type: SlotType.File;
    fileType: FileType;
};
export type GroupSlotSpecification = BaseSlotSpecification & {
    type: SlotType.Group;
};
export type TimeSliceSlotSpecification = BaseSlotSpecification & {
    type: SlotType.TimeSlice;
    maxLength?: number;
    minLength?: number;
};
export type SlotSpecification = TextSlotSpecification | CellSlotSpecification | LineSlotSpecification | Line3dSlotSpecification | SplinesSlotSpecification | PointSlotSpecification | Point3DSlotSpecification | Box2dSlotSpecification | Box3dSlotSpecification | SemanticSegmentation2DSlotSpecification | SemanticSegmentation3DSlotSpecification | CsgSegmentation3DSlotSpecification | CuboidSlotSpecification | PolygonSlotSpecification | Polygon3dSlotSpecification | Rectangle3dSlotSpecification | AudioRecordingSlotSpecification | TimeSliceSlotSpecification | FileSlotSpecification | GroupSlotSpecification;
export declare enum SlotType {
    AudioRecording = "audioRecording",
    TimeSlice = "timeSlice",
    Box2D = "box2d",
    Cuboid = "cuboid",
    Box3D = "box3d",
    Point = "point",
    Point3D = "point3d",
    Line3D = "line3d",
    Line = "line",
    Splines = "splines",
    Polygon = "polygon",
    Polygon3D = "polygon3d",
    Rectangle3D = "rectangle3d",
    Text = "text",
    Cell = "cell",
    SemanticSegmentation2D = "semantic-segmentation2d",
    SemanticSegmentation3D = "semantic-segmentation3d",
    File = "file",
    CsgSegmentation3D = "csg-segmentation3d",
    Group = "group"
}

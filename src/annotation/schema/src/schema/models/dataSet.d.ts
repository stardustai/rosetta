import { DataRecordType, ImageDataRecordMetadata, PointCloudDataRecordMetadata, PointCloudSource } from './dataRecord';
export declare enum TextReadFileType {
    Line = "line-by-line",
    File = "one-file-one"
}
export declare enum ConnectGroundWire {
    ConnectGroundWire = "ConnectGroundWire",
    NotConnectGroundWire = "NotConnectGroundWire"
}
export type DataSetMetadata = {
    textReadFileType: TextReadFileType;
    attachmentType: DataRecordType;
    attachments: Attachments[];
    connectGroundWire?: ConnectGroundWire;
};
export type DataSetGroundWireStatus = {
    done: boolean;
    success: boolean;
    successCount: number;
    errorCount: number;
    totalCount: number;
};
export type FrameConfig = {
    frame: number;
    repeatFrame: number;
};
export type DataSetInputMetadata = {
    attachmentType: DataRecordType;
    textReadFileType?: TextReadFileType;
    connectGroundWire?: ConnectGroundWire;
    frameConfig?: FrameConfig;
    videoFps?: number;
};
export type Attachments = {
    type: DataRecordType.Text;
    attachment: string;
} | {
    type: DataRecordType.Image;
    attachment: string;
} | {
    type: DataRecordType.ImageSequence;
    attachment: string[];
    metadata: ImageDataRecordMetadata;
} | {
    type: DataRecordType.Audio;
    attachment: string;
} | {
    type: DataRecordType.PointCloud;
    attachment: PointCloudSource;
} | {
    type: DataRecordType.PointCloudSequence;
    attachment: PointCloudSource[];
    metadata: PointCloudDataRecordMetadata;
} | {
    type: DataRecordType.Video;
    attachment: string;
};

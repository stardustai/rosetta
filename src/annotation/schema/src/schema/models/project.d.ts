import { InputValue } from './annotation';
import { AnnotationIssueType, AnnotationLocation } from './annotationIssue';
import { ChildrenOnlyType } from './childrenOnlySpecification';
import { DataRecord } from './dataRecord';
import { InputType } from './inputSpecification';
import { OperatorType } from './operator';
import { Box3DSlot, InteractiveSegmentationPoint, Point3D, Slot } from './slots';
import { SlotType } from './slotSpecification';
export declare enum ProjectTypeEnum {
    TextAnnotation = 1,
    ImageAnnotation = 2,
    ThreeDAnnotation = 3,
    AudioAnnotation = 4,
    DataCollection = 5,
    VideoAnnotation = 6,
    GeneralAnnotation = 7,
    RichtextAnnotation = 8
}
export type ProjectMetadata = {
    tutorial?: string;
};
export declare enum ProjectAlgorithmType {
    TEXT_SELECTION = 1,
    IMAGE_BOX_SELECTION = 2,
    IMAGE_POLYGON_SELECTION = 3,
    PROCESS_SLOT = 4,
    VIDEO_2D_MOT = 5,
    IMAGE_INTERACTIVE_SEGMENTATION = 6,
    AUDIO_ASR = 7,
    NON_INTERACTIVE = 8,
    INTERACTIVE_3D_OBJECT_DETECTION = 9,
    ALGO_3D_INTERACTIVE_SOT = 10,
    ALGO_3D_INTERACTIVE_LINE3D = 11,
    PROCESS_SLOTS = 12,
    INPUT_TEXT = 13,
    ALGO_POOL_ANNOTATION = "ALGO_POOL_ANNOTATION",
    ALGO_POOL_QUALITY_CHECK = "ALGO_POOL_QUALITY_CHECK"
}
export type ProjectAlgorithmSourceStructure = {
    [key: string]: {
        type: OperatorType.Slot;
        slotType: SlotType;
    } | {
        type: OperatorType.SlotChildren;
        slotType: SlotType;
        children: ProjectAlgorithmSourceStructure;
    } | {
        type: OperatorType.ChildrenOnly;
        childrenOnlyType: ChildrenOnlyType;
        children: ProjectAlgorithmSourceStructure;
    } | {
        type: OperatorType.Input;
        inputType: InputType;
    };
};
export type ProjectAlgorithmMapping = {
    [key: string]: {
        type: OperatorType.SlotChildren | OperatorType.ChildrenOnly;
        path: number[];
        children: ProjectAlgorithmMapping;
    } | {
        type: OperatorType.Slot | OperatorType.Input;
        path: number[];
        curValue?: {
            [k: string]: string[];
        };
    };
};
export type ProjectAlgorithmSource = {
    id: number;
    type: ProjectAlgorithmType;
    name: string;
    url: string;
    keyStructure: ProjectAlgorithmSourceStructure;
};
export type ProjectAlgorithm = ProjectAlgorithmSource & {
    id: number;
    keyMap: ProjectAlgorithmMapping;
    keyMaps: {
        condition?: {
            key: string;
            value: any;
        };
        keyMap: ProjectAlgorithmMapping;
    }[];
};
export type ProjectAlgorithmRequestPayload = ({
    sourceUrl: string;
} | {
    sourceRecord: DataRecord;
    currentFrame?: number;
}) & ({
    type: ProjectAlgorithmType.TEXT_SELECTION;
    fullText: true;
} | {
    type: ProjectAlgorithmType.TEXT_SELECTION;
    start: number;
    length: number;
} | {
    type: ProjectAlgorithmType.IMAGE_BOX_SELECTION;
    fullImage: true;
    rotate?: number;
} | {
    type: ProjectAlgorithmType.IMAGE_BOX_SELECTION;
    left: number;
    top: number;
    width: number;
    height: number;
    rotate?: number;
} | {
    type: ProjectAlgorithmType.IMAGE_POLYGON_SELECTION;
    rotate?: number;
    points: {
        top: number;
        left: number;
    }[];
} | {
    type: ProjectAlgorithmType.IMAGE_INTERACTIVE_SEGMENTATION;
    points: InteractiveSegmentationPoint[];
    prevPolygon?: {
        top: number;
        left: number;
    }[];
    slotId?: string;
} | {
    type: ProjectAlgorithmType.AUDIO_ASR;
    start: number;
    length: number;
} | {
    type: ProjectAlgorithmType.PROCESS_SLOT;
    slot: Slot;
} | {
    type: ProjectAlgorithmType.PROCESS_SLOTS;
    slots: Slot[];
} | {
    type: ProjectAlgorithmType.VIDEO_2D_MOT;
} | {
    type: ProjectAlgorithmType.NON_INTERACTIVE;
} | {
    type: ProjectAlgorithmType.INTERACTIVE_3D_OBJECT_DETECTION;
    currentFrame?: number;
    cursor: Point3D;
} | {
    type: ProjectAlgorithmType.ALGO_3D_INTERACTIVE_SOT;
    currentFrame?: number;
    selected_box: Box3DSlot;
    cursor: Point3D;
} | {
    type: ProjectAlgorithmType.ALGO_3D_INTERACTIVE_LINE3D;
    currentFrame?: number;
    cursor: Point3D[];
});
export type ProjectAlgorithmResponsePayload = {
    [key: string]: {
        type: OperatorType.SlotChildren;
        slotChildren: {
            slot: Slot;
            children: ProjectAlgorithmResponsePayload;
        }[];
    } | {
        type: OperatorType.ChildrenOnly;
        childrenOnly: {
            id: string;
            children: ProjectAlgorithmResponsePayload;
        }[];
    } | {
        type: OperatorType.Slot;
        slot: Slot[];
    } | {
        type: OperatorType.Input;
        value: InputValue;
    };
};
export declare enum AlgorithmQualityCheckConfidence {
    High = "High",
    Medium = "Medium",
    Low = "Low"
}
export type AnnotationIssueByAlgoPoolQuatilyCheck = {
    type: AnnotationIssueType;
    location?: AnnotationLocation;
    missedLocation?: AnnotationLocation;
    annotationPath: Array<string | number>;
    timeFrame?: number;
    comment?: string;
};
export type AlgorithmPoolQualityCheckResult = {
    confidence: AlgorithmQualityCheckConfidence;
    qualityScore: number;
    notes?: string[];
    issues?: AnnotationIssueByAlgoPoolQuatilyCheck[];
};

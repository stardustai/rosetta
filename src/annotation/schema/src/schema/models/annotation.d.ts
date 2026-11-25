import { ChildrenOnlySpecification } from './childrenOnlySpecification';
import { Posture3DAxis, InputType } from './inputSpecification';
import { OperatorType } from './operator';
import { Slot, SlotDataSourceEnum, TimeSeries } from './slots';
export declare enum HintConfidence {
    High = "High",
    Medium = "Medium",
    Low = "Low"
}
export declare enum HintStatus {
    Unconfirmed = "Unconfirmed",
    Accepted = "Accepted",
    Modified = "Modified",
    Rejected = "Rejected",
    Draft = "Draft",
    Frozen = "Frozen",
    Compared = "Compared"
}
export declare enum InterpolatedCoordinate {
    World = "world",
    Local = "local"
}
export interface AnnotationBaseMetadata {
    dataSource: SlotDataSourceEnum;
    algorithmId: number | string;
}
export interface AnnotationBase {
    key: string;
    label: string;
}
export interface AnnotationSlotUserInfo {
    userId?: number;
    teamId?: number;
    poolId?: number;
}
export interface AnnotationSlot extends AnnotationBase {
    type: OperatorType.Slot;
    slots: Slot[];
}
export type SlotChildren = {
    slot: Slot;
    children: Annotation[];
};
export interface AnnotationSlotChildren extends AnnotationBase {
    type: OperatorType.SlotChildren;
    slotsChildren: SlotChildren[];
}
export interface AnnotationInput extends AnnotationBase {
    type: OperatorType.Input;
    input: InputValue;
    consistentAttribute?: boolean;
}
export type InputValue = InputBoolean | InputNumber | InputText | InputSelect | InputNestedSelect | InputMultipleSelect | InputMultipleText | InputMultipleNestedSelect | InputPosture3D;
export type TimeSeriesInput = InputBoolean | InputNumber | InputText | InputSelect | InputNestedSelect | InputMultipleSelect | InputMultipleText | InputMultipleNestedSelect | InputPosture3D;
export type InputBase = AnnotationSlotUserInfo & {
    confidence?: number;
    confirmed?: boolean;
    hintConfidence?: HintConfidence;
    hintStatus?: HintStatus;
    metadata?: AnnotationBaseMetadata;
};
export type InputBoolean = InputBase & {
    type: InputType.Boolean;
    value?: boolean | null;
    timeSeries?: TimeSeries<boolean>;
};
export type InputNumber = InputBase & {
    type: InputType.Number;
    value?: number | null;
    timeSeries?: TimeSeries<number>;
};
export type InputText = InputBase & {
    type: InputType.Text;
    value?: string | null;
    timeSeries?: TimeSeries<string>;
};
export type InputSelect = InputBase & {
    type: InputType.Select;
    value?: string | null;
    timeSeries?: TimeSeries<string>;
};
export type InputNestedSelect = InputBase & {
    type: InputType.NestedSelect;
    value?: string[] | null;
    timeSeries?: TimeSeries<string[]>;
};
export type InputMultipleSelect = InputBase & {
    type: InputType.MultipleSelect;
    value?: string[] | null;
    timeSeries?: TimeSeries<string[]>;
};
export type InputMultipleNestedSelect = InputBase & {
    type: InputType.MultipleNestedSelect;
    value?: string[] | null;
    timeSeries?: TimeSeries<string[]>;
};
export type InputMultipleText = InputBase & {
    type: InputType.MultipleText;
    value?: string[] | null;
    timeSeries?: TimeSeries<string[]>;
};
export type InputPosture3D = InputBase & {
    type: InputType.Posture3D;
    value?: Posture3DAxis | null;
    timeSeries?: TimeSeries<string[]>;
};
export interface AnnotationAnchor extends AnnotationBase {
    type: OperatorType.Anchor;
}
export type ChildrenOnly = {
    id: string;
    label: string;
    hintStatus?: HintStatus;
    children: Annotation[];
};
export interface AnnotationChildrenOnly extends AnnotationBase {
    type: OperatorType.ChildrenOnly;
    childrenOnlyType?: ChildrenOnlySpecification;
    childrenOnly: ChildrenOnly[];
}
export type Annotation = AnnotationSlot | AnnotationSlotChildren | AnnotationInput | AnnotationAnchor | AnnotationChildrenOnly;

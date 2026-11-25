import { ChildrenOnlySpecification } from './childrenOnlySpecification';
import { InputSpecification } from './inputSpecification';
import { SlotSpecification } from './slotSpecification';
export type OperatorInputOption = {
    required?: boolean;
};
export type OperatorInstanceOption = {
    minQuantity?: number;
    maxQuantity?: number;
};
export declare enum OperatorType {
    Anchor = "anchor",
    Input = "input",
    Slot = "slot",
    SlotChildren = "slotChildren",
    ChildrenOnly = "childrenOnly"
}
export type OperatorMetadata = {
    hint?: string;
    tutorial?: string;
};
export type AnchorOperator = {
    key: string;
    type: OperatorType.Anchor;
    label: string;
    exportLabel?: string;
    metadata?: OperatorMetadata;
};
export type InputOperator = {
    key: string;
    type: OperatorType.Input;
    label: string;
    exportLabel?: string;
    metadata?: OperatorMetadata;
    inputSpecification: InputSpecification;
    inputOption?: OperatorInputOption;
};
export type SlotOperator = {
    key: string;
    type: OperatorType.Slot;
    label: string;
    exportLabel?: string;
    metadata?: OperatorMetadata;
    slotSpecification: SlotSpecification;
    instanceOption?: OperatorInstanceOption;
};
export type SlotChildrenOperator = {
    key: string;
    type: OperatorType.SlotChildren;
    label: string;
    exportLabel?: string;
    metadata?: OperatorMetadata;
    slotSpecification: SlotSpecification;
    instanceOption?: OperatorInstanceOption;
    children: Operator[];
};
export type ChildrenOnlyOperator = {
    key: string;
    type: OperatorType.ChildrenOnly;
    label: string;
    exportLabel?: string;
    childrenOnlySpecification?: ChildrenOnlySpecification;
    metadata?: OperatorMetadata;
    children: Operator[];
};
export type Operator = InputOperator | SlotOperator | AnchorOperator | SlotChildrenOperator | ChildrenOnlyOperator;
type ShortcutMappingChildValue = string | number | Array<string | number>;
type ShortcutMappingChild = {
    key: string;
    value?: ShortcutMappingChildValue;
    open: boolean;
};
type ShortcutMappingGroup = {
    children: ShortcutMappingChild[];
};
export type InstancePropertyShortcutMapping = {
    key: string;
    group: ShortcutMappingGroup[];
};
export {};

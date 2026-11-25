import { InputValue } from './annotation';
import { Slot } from './slots';
export type AnnotationPathComponent = string | number;
export type AnnotationPath = AnnotationPathComponent[];
export type AnnotationPathStringify = string;
export declare const TIME_FRAME_MARKER = "T";
export type AssigneeToPath = {
    [userId: number]: {
        [path: string]: null;
    };
};
export type PathToAssignee = {
    [path: string]: number;
};
export type AnnotationOwnerMap = {
    assigneeToPath: AssigneeToPath;
    pathToAssignee: PathToAssignee;
};
export declare enum AnnotationOpType {
    add = "add",
    remove = "remove",
    edit = "edit",
    transfer = "transfer"
}
export interface BaseAnnotationOp<T> {
    op: AnnotationOpType;
    path: AnnotationPath;
}
export interface AddAnnotationOp<T> extends BaseAnnotationOp<T> {
    op: AnnotationOpType.add;
    current: T;
    currentAssignee: number;
}
export interface RemoveAnnotationOp<T> extends BaseAnnotationOp<T> {
    op: AnnotationOpType.remove;
    previous: T;
    previousAssignee?: number;
    currentAssignee: number;
}
export interface EditAnnotationOp<T> extends BaseAnnotationOp<T> {
    op: AnnotationOpType.edit;
    current: T;
    currentAssignee: number;
    previous: T;
    previousAssignee: number;
}
export interface TransferAnnotationOp<T> extends BaseAnnotationOp<T> {
    op: AnnotationOpType.transfer;
    current: T;
    currentAssignee: number;
    previous: T;
    previousAssignee: number;
}
export type AnnotationOp<T> = AddAnnotationOp<T> | RemoveAnnotationOp<T> | EditAnnotationOp<T> | TransferAnnotationOp<T>;
export type AnnotationOpValue = Slot | InputValue;

import { PointCloudPosition, Position, RangeSelection } from './commonTypes';
import { PoolSimpleInfo, TeamSimpleInfo, UserSimpleInfo } from './info';
import { CsgProperties } from './slots';
import { SlotType } from './slotSpecification';
export declare enum AnnotationIssueActionType {
    Create = "Create",
    Resolve = "Resolve",
    Close = "Close",
    Unresolved = "Unresolved",
    Reopen = "Reopen",
    Appeal = "Appeal"
}
export interface AnnotationActorInfo {
    taskId: number;
    user: UserSimpleInfo;
    pool: PoolSimpleInfo;
    team?: TeamSimpleInfo;
}
export interface AnnotationIssueAction extends AnnotationActorInfo {
    comments?: string[];
    type: AnnotationIssueActionType;
    note?: string;
    createdAt: string;
}
export interface AnnotationNote extends AnnotationActorInfo {
    note: string;
    createdAt: string;
}
export type AnnotationLocation = {
    type: SlotType.Text | SlotType.TimeSlice;
    position: number | RangeSelection;
    source?: string;
} | {
    type: SlotType.Point;
    position: Position;
    source?: string;
} | {
    type: SlotType.Box3D;
    position: PointCloudPosition;
    source?: string;
};
export type AnnotationIssue = AnnotationMisplacedIssue | AnnotationExtraIssue | AnnotationMissingIssue;
export type IssuePointSingle = {
    errorPointsList: number[];
    errorCount: number;
    csgShapes: CsgProperties;
};
export type IssuePointMap = {
    errorPointsMap: Record<number, number[]>;
    errorCount: number;
};
export type AnnotationIssueBase = {
    id: string;
    actions: AnnotationIssueAction[];
    annotationPath: Array<string | number>;
    timeFrame?: number;
    issuePoint?: IssuePointSingle | IssuePointMap;
};
export type AnnotationMisplacedIssue = AnnotationIssueBase & {
    type: AnnotationIssueType.Misplaced;
    location?: AnnotationLocation;
};
export type AnnotationExtraIssue = AnnotationIssueBase & {
    type: AnnotationIssueType.Extra;
    location?: AnnotationLocation;
};
export type AnnotationMissingIssue = AnnotationIssueBase & {
    type: AnnotationIssueType.Missing;
    missedLocation?: AnnotationLocation;
    location: AnnotationLocation;
};
export declare enum AnnotationIssueStatus {
    Open = 0,
    Resolved = 1,
    Appealed = 2,
    Closed = 3
}
export declare enum AnnotationIssueType {
    Misplaced = 0,
    Missing = 1,
    Extra = 2
}

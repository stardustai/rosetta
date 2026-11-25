import { Annotation } from './annotation';
import { AnnotationIssue, AnnotationNote } from './annotationIssue';
import { DataRecord } from './dataRecord';
import { Operator } from './operator';
import { ProjectAlgorithm, ProjectAlgorithmRequestPayload, ProjectAlgorithmResponsePayload } from './project';
import { RemoteValidationTask } from './remoteValidationTask';
import { CsgProperties } from './slots';
import { AnnotationTaskRunResult, DispatchTaskRunResult, ExamineTaskRunResult, FinishTaskRunResult, SamplingTaskRunResult } from './taskRunResult';
import { TaskParamVersion } from './version';
export type TaskParams = {
    version: TaskParamVersion;
    operators: Operator[];
    record: DataRecord;
};
export declare const enum InterpolateMethod {
    Nearest = "nearest",
    MappingFirst = "mapping-first"
}
export type TaskResult = {
    hints?: Annotation[];
    annotations: Annotation[];
    issues: AnnotationIssue[];
    notes: AnnotationNote[];
    metadata?: {
        imageRotateAngle?: number;
        noNeedToAnnotate?: boolean;
        deletedCsgAtomShapes?: {
            [key: number]: CsgProperties;
        };
        invalidFrame?: number[];
        pintCloudMapScope?: number;
        interpolateMethod?: InterpolateMethod;
    };
};
export type TaskRunResult = AnnotationTaskRunResult | ExamineTaskRunResult | DispatchTaskRunResult | SamplingTaskRunResult | FinishTaskRunResult;
export type PublicAnnotationInput = {
    taskParams: {
        type: 'include';
        value: TaskParams;
    } | {
        type: 'multiple';
        operators: Operator[];
        records: DataRecord[];
        taskResults?: (TaskResult | undefined)[];
    };
    taskResult?: TaskResult;
    callbackURL?: string;
    algorithms?: ProjectAlgorithm[];
};
export type ListOfOperator = Operator[];
export type ExportedTypes = {
    ProjectAlgorithmRequestPayload: ProjectAlgorithmRequestPayload;
    ProjectAlgorithmResponsePayload: ProjectAlgorithmResponsePayload;
    RemoteValidationTask: RemoteValidationTask;
};

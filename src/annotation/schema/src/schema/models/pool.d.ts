import { Position } from './commonTypes';
import { ProjectAlgorithmType } from './project';
export declare enum PoolTypeEnum {
    Dispatch = 0,
    Annotation = 1,
    Examine = 2,
    Sampling = 3,
    Algorithm = 4,
    Finish = 5
}
export type PoolMetaData = CommonPoolMetaData | AnnotationPoolMetaData | DispatchPoolMetaData | FinishPoolMetaData | AlgorithmPoolMetaData;
type BasePoolMetaData = {
    title: string;
    disabled?: boolean;
    position: Position;
    preferredPrefetchSize?: number;
    callbackUrl?: string;
};
export interface CommonPoolMetaData extends BasePoolMetaData {
    type: PoolTypeEnum.Examine | PoolTypeEnum.Sampling;
    validateAnnotationUrl?: string | string[];
}
export interface FinishPoolMetaData extends BasePoolMetaData {
    type: PoolTypeEnum.Finish;
}
export interface AlgorithmPoolMetaData extends BasePoolMetaData {
    type: PoolTypeEnum.Algorithm;
    algoType: ProjectAlgorithmType.ALGO_POOL_ANNOTATION | ProjectAlgorithmType.ALGO_POOL_QUALITY_CHECK;
    running?: boolean;
    requestParams: {
        [key: string]: any;
    };
    qualityScoreThredHigh?: number;
    qualityScoreThredLow?: number;
    multiFrameToSnapShot?: boolean;
}
export interface AnnotationPoolMetaData extends BasePoolMetaData {
    type: PoolTypeEnum.Annotation;
    prefetchLimit?: number;
    validateAnnotationUrl?: string | string[];
    algorithmValidateUrl?: string;
    examUserTaskRunsLimit?: number;
}
export interface SamplingPoolMetaData extends BasePoolMetaData {
    type: PoolTypeEnum.Sampling;
    canRejectToPreviousAnnotator?: boolean;
    algorithmValidateUrl?: string;
}
export declare enum DispatchPoolDispatchType {
    Automatic = "Automatic",
    Manual = "Manual"
}
export interface DispatchPoolMetaData extends BasePoolMetaData {
    type: PoolTypeEnum.Dispatch;
    dispatchType: DispatchPoolDispatchType;
}
export {};

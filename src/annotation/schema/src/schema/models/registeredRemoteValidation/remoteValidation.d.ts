import { AnnotationPath } from '../annotationTypes';
export declare enum AnnotationValidation {
    ValidateTextRegex = "ValidateTextRegex",
    ValidateTextNoDuplications = "ValidateTextNoDuplications",
    ValidateTextMinLength = "ValidateTextMinLength",
    ValidateBalancedParenthesis = "ValidateBalancedParenthesis",
    ValidateTextMaxLength = "ValidateTextMaxLength",
    ValidateKeywordsChars = "ValidateKeywordsChars",
    ValidateSameInstanceContinuation = "ValidateSameInstanceContinuation",
    ValidateSlotInstanceScaleConsistency = "ValidateSlotInstanceScaleConsistency",
    ValidateSingleStaticBoxSlot = "ValidateSingleStaticBoxSlot",
    ValidateBox3dSlotContainsMinimumPoints = "ValidateBox3dSlotContainsMinimumPoints",
    ValidateSlotArea = "ValidateSlotArea",
    ValidateAudioQuality = "ValidateAudioQuality",
    ValidatePointInstancesQuantity = "ValidatePointInstancesQuantity",
    ValidateMeituanOtherCustomized = "ValidateMeituanOtherCustomized",
    ValidateShangqiFisheye = "ValidateShangqiFisheye",
    ValidateShangqiVD = "ValidateShangqiVD",
    ValidateShangqiPD = "ValidateShangqiPD",
    ValidateHeduoFishEye = "ValidateHeduoFishEye",
    ValidateHeduoWideAngle = "ValidateHeduoWideAngle",
    validateHeduoForwardLookingWideAngle = "validateHeduoForwardLookingWideAngle",
    ValidateShangqiPropertyConsistency = "ValidateShangqiPropertyConsistency",
    ValidatePropertyConsistency = "ValidatePropertyConsistency",
    ValidateSizeAccordingToInputOptions = "ValidateSizeAccordingToInputOptions",
    ValidateChildrenAccordingToInputOptions = "ValidateChildrenAccordingToInputOptions"
}
export type ValidateTextRegex = {
    name: AnnotationValidation.ValidateTextRegex;
    pattern: string;
    matchedIsInvalid?: boolean;
};
export type ValidateTextNoDuplications = {
    name: AnnotationValidation.ValidateTextNoDuplications;
};
export type ValidateTextMinLength = {
    name: AnnotationValidation.ValidateTextMinLength;
    min: number;
    charFilter?: string;
};
export type ValidateTextMaxLength = {
    name: AnnotationValidation.ValidateTextMaxLength;
    max: number;
    skipPattern?: string;
};
export type ValidateBalancedParenthesis = {
    name: AnnotationValidation.ValidateBalancedParenthesis;
};
export type ValidateKeywordsChars = {
    name: AnnotationValidation.ValidateKeywordsChars;
};
export type ValidateSameInstanceContinuation = {
    name: AnnotationValidation.ValidateSameInstanceContinuation;
    gap: number;
};
export type ValidateSlotInstanceScaleConsistency = {
    name: AnnotationValidation.ValidateSlotInstanceScaleConsistency;
    decimals: number;
};
export type ValidateSingleStaticBoxSlot = {
    name: AnnotationValidation.ValidateSingleStaticBoxSlot;
};
export type ValidateBox3dSlotContainsMinimumPoints = {
    name: AnnotationValidation.ValidateBox3dSlotContainsMinimumPoints;
    minNumOfPoints: number;
};
export type ValidateSlotArea = {
    name: AnnotationValidation.ValidateSlotArea;
    minArea?: number;
    maxArea?: number;
};
export type ValidateAudioQuality = {
    name: AnnotationValidation.ValidateAudioQuality;
    criterias: AudioQualityCriteria;
};
export type ValidatePointInstancesQuantity = {
    name: AnnotationValidation.ValidatePointInstancesQuantity;
    limitLength: number[];
};
export type ValidateMeituanOtherCustomized = {
    name: AnnotationValidation.ValidateMeituanOtherCustomized;
};
export type ValidateShangqiFisheye = {
    name: AnnotationValidation.ValidateShangqiFisheye;
    projectionVersion: 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';
};
export type ValidateShangqiVD = {
    name: AnnotationValidation.ValidateShangqiVD;
};
export type ValidateShangqiPD = {
    name: AnnotationValidation.ValidateShangqiPD;
};
export type ValidateHeduoWideAngle = {
    name: AnnotationValidation.ValidateHeduoWideAngle;
};
export type validateHeduoForwardLookingWideAngle = {
    name: AnnotationValidation.validateHeduoForwardLookingWideAngle;
};
export type ValidateHeduoFishEye = {
    name: AnnotationValidation.ValidateHeduoFishEye;
};
export type ValidateShangqiPropertyConsistency = {
    name: AnnotationValidation.ValidateShangqiPropertyConsistency;
};
export type ValidateSizeAccordingToInputOptions = {
    name: AnnotationValidation.ValidateSizeAccordingToInputOptions;
    input: {
        path: AnnotationPath[];
        options: string[];
    };
    size: {
        area?: {
            min?: number;
            max?: number;
        };
        height?: MinMax;
        width?: MinMax;
    };
};
export type ValidateChildrenAccordingToInputOptions = {
    name: AnnotationValidation.ValidateChildrenAccordingToInputOptions;
    input: {
        path: AnnotationPath[];
        options: string[];
    };
    childrenSlot: {
        path: AnnotationPath[];
        len?: MinMax;
        withinRange?: boolean;
    };
};
export type MinMax = {
    min?: number;
    max?: number;
};
export type AudioQualityCriteria = {
    clipped?: boolean;
    differenceValue?: number;
    loudness?: {
        lower_bound_dbfs?: number;
        upper_bound_dbfs?: number;
    };
    bg_noise?: {
        max_bg_noise_tolerance_dbfs?: number;
    };
};

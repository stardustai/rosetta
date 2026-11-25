export declare enum ExamineTaskRunStatus {
    Pass = "Pass",
    Rejected = "Rejected"
}
export declare enum ExamineTaskRunRejectionType {
    toPreviousWorker = "toPreviousWorker",
    toFirstAuthor = "toFirstAuthor",
    toPool = "toPool"
}
export declare enum ExamineTaskRunRejectionBackType {
    reject = 1,
    Back = 3
}
export type ExamineTaskRunRejection = {
    type: ExamineTaskRunRejectionType;
    backType: ExamineTaskRunRejectionBackType;
};
export type ExamineTaskRunOutput = {
    status: ExamineTaskRunStatus.Pass;
} | {
    status: ExamineTaskRunStatus.Rejected;
    rejection: ExamineTaskRunRejection;
};
export type ExamineTaskRunResult = {
    type: TaskRunResultType.Examine;
    output: ExamineTaskRunOutput;
};
export type AnnotationTaskRunResult = {
    type: TaskRunResultType.Annotation;
};
export type DispatchTaskRunResult = {
    type: TaskRunResultType.Dispatch;
    output: DispatchTaskRunOutput;
};
export declare enum FinishTaskRunOutputType {
    Rejected = "Rejected"
}
export type FinishTaskRunOutput = {
    type: FinishTaskRunOutputType.Rejected;
    toPoolId?: number;
};
export type FinishTaskRunResult = {
    type: TaskRunResultType.Finish;
    output: FinishTaskRunOutput;
};
export declare enum DispatchTaskRunOutputType {
    RandomNextPool = "RandomNextPool",
    AutomaticallyNextPool = "AutomaticallyNextPool",
    AssignedNextPool = "AssignedNextPool"
}
export type DispatchTaskRunOutput = {
    type: DispatchTaskRunOutputType.RandomNextPool;
} | {
    type: DispatchTaskRunOutputType.AutomaticallyNextPool;
} | {
    type: DispatchTaskRunOutputType.AssignedNextPool;
    poolId: number;
};
export type SamplingTaskRunOutput = {
    status: SamplingTaskRunStatus.Pass;
} | {
    status: SamplingTaskRunStatus.Rejected;
} | {
    status: SamplingTaskRunStatus.PassButNotCheck;
} | {
    status: SamplingTaskRunStatus.RejectedButNotCheck;
} | {
    status: SamplingTaskRunStatus.RejectedCheckButNoResult;
};
export declare enum SamplingTaskRunStatus {
    Pass = "Pass",
    Rejected = "Rejected",
    PassButNotCheck = "PassButNotCheck",
    RejectedButNotCheck = "RejectedButNotCheck",
    RejectedCheckButNoResult = "RejectedCheckButNoResult"
}
export type SamplingTaskRunResult = {
    type: TaskRunResultType.Sampling;
    output: SamplingTaskRunOutput;
};
export declare enum TaskRunResultType {
    Annotation = "Annotation",
    Examine = "Examine",
    Dispatch = "Dispatch",
    Sampling = "Sampling",
    Finish = "Finish"
}
export declare enum TaskResultStatus {
    Pending = 1,
    Dispatched = 2,
    Active = 3,
    WaitSubmit = 4,
    Pause = 5,
    Error = 6,
    Hold = 7,
    SubmitError = 8,
    Finished = 9,
    Invalid = 10
}

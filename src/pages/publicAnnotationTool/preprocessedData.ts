import {
  getRecordOperators,
  getRecordTaskResult,
} from '../../localData/recordPreprocessing';
import {
  PublicAnnotationInput,
  TaskParams,
  TaskParamVersion,
  TaskResult,
} from '../../annotation/schema';

export type PublicAnnotationTask = {
  taskParams: TaskParams;
  taskResult: TaskResult | undefined;
  extraData: unknown;
};

type PublicAnnotationInputWithExtraData = PublicAnnotationInput & {
  extraData?: unknown;
  extraDataList?: unknown[];
};

export {
  getRecordOperators,
  getRecordTaskResult,
} from '../../localData/recordPreprocessing';

export const createPublicAnnotationTasks = (
  input: PublicAnnotationInput,
): PublicAnnotationTask[] => {
  const inputWithExtraData = input as PublicAnnotationInputWithExtraData;
  if (input.taskParams.type === 'include') {
    return [
      {
        taskParams: input.taskParams.value,
        taskResult: input.taskResult,
        extraData: inputWithExtraData.extraData,
      },
    ];
  }

  const fallbackOperators = input.taskParams.operators;
  const taskResults = input.taskParams.taskResults;
  return input.taskParams.records.map((record, index) => ({
    taskParams: {
      version: TaskParamVersion.V100,
      record,
      operators: getRecordOperators(record, fallbackOperators),
    },
    taskResult: getRecordTaskResult(record, taskResults?.[index]),
    extraData: inputWithExtraData.extraDataList?.[index],
  }));
};

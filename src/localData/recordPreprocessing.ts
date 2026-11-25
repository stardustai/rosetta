import type { DataRecord, Operator, TaskResult } from '../annotation/schema';

export const getRecordOperators = (record: DataRecord, fallback: Operator[]) =>
  record.metadata?.preprocessedData?.operators ?? fallback;

export const getRecordTaskResult = (
  record: DataRecord,
  taskResult?: TaskResult,
): TaskResult | undefined => {
  if (taskResult != null) {
    return taskResult;
  }

  const preprocessedData = record.metadata?.preprocessedData;
  if (preprocessedData?.annotations == null) {
    return undefined;
  }

  return {
    annotations: preprocessedData.annotations,
    hints: preprocessedData.hints,
    issues: [],
    notes: [],
    metadata: preprocessedData.metadata,
  };
};

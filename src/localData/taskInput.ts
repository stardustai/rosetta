import type { DataRecord, PublicAnnotationInput } from '../annotation/schema';
import { sessionRecords } from './sessionInfo';
import { getRecordOperators, getRecordTaskResult } from './recordPreprocessing';

export function inputResults(input: PublicAnnotationInput) {
  return input.taskParams.type === 'include'
    ? [input.taskResult]
    : input.taskParams.taskResults || [];
}

export function inputOperators(input: PublicAnnotationInput) {
  return input.taskParams.type === 'include'
    ? input.taskParams.value.operators
    : input.taskParams.operators;
}

export function configurationKey(input: PublicAnnotationInput) {
  return JSON.stringify([sessionRecords(input), inputOperators(input)]);
}

export function appendTaskInput(
  current: PublicAnnotationInput,
  incoming: PublicAnnotationInput,
): PublicAnnotationInput {
  const { taskResult: _result, ...properties } = current;
  const operators = inputOperators(current);
  const incomingOperators = inputOperators(incoming);
  const records = sessionRecords(incoming).map((record) => {
    if (JSON.stringify(operators) === JSON.stringify(incomingOperators))
      return record;
    return {
      ...record,
      metadata: {
        ...record.metadata,
        preprocessedData: {
          ...record.metadata?.preprocessedData,
          operators:
            record.metadata?.preprocessedData?.operators || incomingOperators,
        },
      },
    } as DataRecord;
  });
  return {
    ...properties,
    taskParams: {
      type: 'multiple',
      operators,
      records: [...sessionRecords(current), ...records],
      taskResults: [
        ...sessionRecords(current).map((_, i) => inputResults(current)[i]),
        ...records.map((_, i) => inputResults(incoming)[i]),
      ],
    },
  };
}

export function filterTaskInput(
  input: PublicAnnotationInput,
  keep: number[],
): PublicAnnotationInput {
  if (input.taskParams.type === 'include' && keep.length) return input;
  const records = sessionRecords(input);
  const results = inputResults(input);
  const keptResults = keep.map((index) =>
    getRecordTaskResult(records[index], results[index]),
  );
  const extras = (
    input as PublicAnnotationInput & { extraDataList?: unknown[] }
  ).extraDataList;
  return {
    ...input,
    ...(Array.isArray(extras)
      ? { extraDataList: keep.map((index) => extras[index]) }
      : {}),
    taskParams: {
      type: 'multiple',
      operators:
        keep.length === 1
          ? getRecordOperators(records[keep[0]], inputOperators(input))
          : inputOperators(input),
      records: keep.map((index) => records[index]),
      ...(keptResults.some((result) => result != null)
        ? { taskResults: keptResults }
        : {}),
    },
  };
}

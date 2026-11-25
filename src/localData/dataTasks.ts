import { t } from '../i18n';
import type { DataRecord, PublicAnnotationInput } from '../annotation/schema';
import { kindFromRecord } from './recordKind';
import type { Operator } from '../annotation/schema';
import { recordName, sessionRecords } from './sessionInfo';
import type { NewTask } from './storage';
import { filterTaskInput, inputResults } from './taskInput';
import { getRecordOperators } from './recordPreprocessing';

export function tasksFromInput(
  input: PublicAnnotationInput,
  fallback = t('Import data'),
  description = '',
): NewTask[] {
  const records = sessionRecords(input);
  if (!records.length)
    throw new Error(t('The file contains no data that can be imported'));
  return records.map((record, index) => ({
    name: recordName(
      record,
      records.length === 1 ? fallback : `${fallback} · ${index + 1}`,
    ),
    description,
    submitted: inputResults(input)[index] != null,
    input: filterTaskInput(input, [index]),
  }));
}

export function inputsFromJSON(
  text: string,
  name: string,
  operatorsForRecord: (record: DataRecord) => Operator[] = () => [],
) {
  if (/\.jsonl$/i.test(name)) {
    return recordsFromJSONLines(text).map((record, index) => {
      if (!kindFromRecord(record))
        throw new Error(
          t('JSONL record {{v0}} is missing a valid data type', {
            v0: index + 1,
          }),
        );
      return {
        taskParams: {
          type: 'multiple',
          records: [record],
          operators: getRecordOperators(record, operatorsForRecord(record)),
        },
      } as PublicAnnotationInput;
    });
  }
  let input: PublicAnnotationInput;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error(t('Enter valid PublicAnnotationInput JSON'));
  }
  if (
    !input?.taskParams ||
    !['include', 'multiple'].includes(input.taskParams.type)
  )
    throw new Error(
      t('JSON must contain valid PublicAnnotationInput.taskParams'),
    );
  return [input];
}

export function recordsFromJSONLines(text: string): DataRecord[] {
  return text.split('\n').flatMap((line, index) => {
    if (!line.trim()) return [];
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      throw new Error(
        t('JSONL line {{v0}} is not valid JSON', { v0: index + 1 }),
      );
    }
    if (
      !value ||
      typeof value !== 'object' ||
      !('attachmentType' in value) ||
      typeof value.attachmentType !== 'string'
    )
      throw new Error(
        t('JSONL line {{v0}} is missing a valid data type', { v0: index + 1 }),
      );
    return [value as DataRecord];
  });
}

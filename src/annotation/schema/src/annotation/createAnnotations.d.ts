import { Operator } from '../schema/models/operator';
import { Annotation } from '../schema/models/annotation';
import { TaskParams } from '../schema/models/schema';
export declare const createEmptyAnnotationFromOperator: (operator: Operator, timeframe?: number) => Annotation;
export declare const createEmptyAnnotationsFromOperators: (operators: Operator[], timeframe?: number) => Annotation[];
export declare const createEmptyAnnotationFromTaskParams: (taskParams: TaskParams) => Annotation[];

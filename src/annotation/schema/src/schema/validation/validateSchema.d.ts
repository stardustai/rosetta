import { ErrorObject } from 'ajv';
import schema from '../SCHEMA_JSON.json';
export interface ValidationResult {
    valid: boolean;
    errors?: ErrorObject[];
    errorMessage?: string;
}
export type SchemaKeys = keyof typeof schema.definitions;
declare const localize: {
    zh: any;
    en: any;
};
export type LocalizeKeys = keyof typeof localize;
export declare const validateSchema: (key: SchemaKeys, object: any, options?: {
    language?: "zh" | "en" | undefined;
} | undefined) => ValidationResult;
export declare function assertValid<T>(object: any, key: SchemaKeys, options?: {
    language?: LocalizeKeys;
}): asserts object is T;
export {};

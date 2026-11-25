// Generated from apps/annotation/src/contracts/frame-v1.ts by sync:annotation-contract.
import type { PublicAnnotationInput, TaskParams, TaskResult } from '../schema';

export const FRAME_PROTOCOL = 'rosetta-frame-v1';
export type FrameLanguage = 'en-US' | 'zh-CN' | 'de-DE' | 'ja-JP';

type FrameMessageBase = { protocol: typeof FRAME_PROTOCOL; channel: string };
export type FrameMessage = FrameMessageBase &
  ({ type: 'hello' } | { type: 'ready' | 'connect'; instance: string });

export type FrameView = 'annotation' | 'operators' | 'algorithms';
export interface RosettaAnnotationDraft {
  result: TaskResult;
  params: TaskParams;
  index: number;
  segmentation?: Uint8Array;
}
export interface FrameInput {
  language?: FrameLanguage;
  input: PublicAnnotationInput;
  index: number;
  view: FrameView;
  taskId: string;
}
export interface FrameHost {
  blockingDialogChanged(open: boolean): Promise<void>;
  save(
    result: TaskResult,
    params: TaskParams,
    index: number,
    draft?: RosettaAnnotationDraft,
  ): Promise<void>;
  recover(draft: RosettaAnnotationDraft): Promise<void>;
  changeInput(input: PublicAnnotationInput): Promise<void>;
  saveConfiguration(input: PublicAnnotationInput): Promise<void>;
  changeIndex(index: number): Promise<void>;
  resolveResource(url: string): Promise<string | Blob>;
  saveFile(blob: Blob, filename: string): Promise<string>;
  exiting(): Promise<void>;
}
export interface FrameEditor {
  /** Update language without replacing the active input or draft. */
  setLanguage?(language: FrameLanguage): Promise<void>;
  initialize(value: FrameInput): Promise<void>;
  updateInput(value: FrameInput): Promise<void>;
  captureDraft(): Promise<RosettaAnnotationDraft>;
  authorizeSave(): Promise<string>;
  confirmSave(id: string): Promise<void>;
  authorizeExport(): Promise<void>;
}

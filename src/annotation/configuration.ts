import { setLanguage } from '../i18n';
import type { FrameLanguage } from './contracts/frame-v1';

export interface RosettaConfiguration {
  language?: FrameLanguage;
  frameURL?: string;
  resolveResource?: (
    url: string,
    fallback: (url: string) => Promise<string>,
  ) => Promise<string>;
  readResource?: (url: string) => Promise<string | Blob>;
  saveFile?: (blob: Blob, filename: string) => Promise<string>;
  releaseFiles?: (urls: string[]) => Promise<void>;
}
export let annotationConfiguration: RosettaConfiguration = {};
export function configureRosetta(next: RosettaConfiguration) {
  annotationConfiguration = { ...annotationConfiguration, ...next };
  if (next.language) void setLanguage(next.language);
}
export async function fetchResourceURL(url: string): Promise<string> {
  const fallback = async (value: string) =>
    value.replace(
      /^oss:\/\/stardust-public(?=\/|$)/,
      'https://assets.stardust-ai.com',
    );
  return annotationConfiguration.resolveResource
    ? annotationConfiguration.resolveResource(url, fallback)
    : fallback(url);
}

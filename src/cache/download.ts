import type { PublicAnnotationInput } from '../annotation/schema';
import ky from 'ky';
import type { Progress } from 'ky';

export function downloadAnnotationInput(
  url: string,
  signal: AbortSignal,
  onProgress?: (progress: Progress) => void,
) {
  return ky
    .get(url, {
      signal,
      timeout: 300_000,
      retry: 0,
      ...(onProgress
        ? { onDownloadProgress: (progress) => onProgress(progress) }
        : {}),
    })
    .json<PublicAnnotationInput>();
}

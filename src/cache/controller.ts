import { t } from '../i18n';
import type { PublicAnnotationInput } from '../annotation/schema';
import { downloadAnnotationInput } from './download';
import { saveCachedInput } from './storage';
import type { CacheItem } from './types';

export class CacheController {
  private jobs = new Map<string, AbortController>();
  constructor(
    private resolveURL: (url: string) => Promise<string>,
    private publish: (item: CacheItem) => void,
  ) {}

  cancel(id: string) {
    this.jobs.get(id)?.abort();
    this.jobs.delete(id);
  }
  cancelAll() {
    [...this.jobs.keys()].forEach((id) => this.cancel(id));
  }

  async cache(url: string, name: string, id = `cache-${crypto.randomUUID()}`) {
    this.cancel(id);
    const abort = new AbortController();
    this.jobs.set(id, abort);
    let item: CacheItem = {
      id,
      name,
      url,
      timestamp: Date.now(),
      size: 0,
      status: 'caching',
      progress: 0,
      stage: 'connecting',
      startTime: Date.now(),
    };
    const update = (next: Partial<CacheItem>) => {
      if (this.jobs.get(id) !== abort) return;
      item = { ...item, ...next };
      this.publish(item);
    };
    update({});
    try {
      const resolved = await this.resolveURL(url);
      abort.signal.throwIfAborted();
      const input: PublicAnnotationInput = await downloadAnnotationInput(
        resolved,
        abort.signal,
        (progress) => {
          update({
            stage: 'downloading',
            progress: progress.totalBytes
              ? Math.min(5 + progress.percent * 90, 95)
              : 5,
            downloadedSize: progress.transferredBytes,
            totalSize: progress.totalBytes || undefined,
          });
        },
      );
      abort.signal.throwIfAborted();
      update({ progress: 95, stage: 'processing' });
      abort.signal.throwIfAborted();
      update({ progress: 98, stage: 'storing' });
      const stored = await saveCachedInput(
        { id, name, url },
        input,
        abort.signal,
      );
      update({
        ...stored,
        status: 'success',
        stage: 'completed',
        downloadedSize: stored.size,
      });
      return id;
    } catch (error) {
      if (!abort.signal.aborted)
        update({
          status: 'error',
          error: error instanceof Error ? error.message : t('Cache failed'),
        });
      return null;
    } finally {
      if (this.jobs.get(id) === abort) this.jobs.delete(id);
    }
  }
}

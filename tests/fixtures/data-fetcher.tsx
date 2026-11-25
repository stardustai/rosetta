import type { PublicAnnotationInput } from '../../src/annotation/schema';
import { createRoot } from 'react-dom/client';
import { saveCachedInput } from '../../src/cache/storage';
import { useEnhancedDataFetcher } from '../../src/pages/publicAnnotationTool/hooks/useEnhancedDataFetcher';
import { message } from './data-fetcher-messages';

export interface DataFetcherHarness {
  state: () => ReturnType<typeof useEnhancedDataFetcher>;
  received: PublicAnnotationInput[];
  errors: string[];
  cache: (url: string, input: PublicAnnotationInput) => Promise<unknown>;
  unmount: () => void;
}
const received: PublicAnnotationInput[] = [];
let state: ReturnType<typeof useEnhancedDataFetcher>;
function Probe() {
  state = useEnhancedDataFetcher((input) => received.push(input));
  return <output>{state.loading ? 'Loading' : 'Ready'}</output>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Probe />);
const harness: DataFetcherHarness = {
  state: () => state,
  received,
  errors: message.errors,
  cache: (url, input) => saveCachedInput({ id: url, url, name: url }, input),
  unmount: () => root.unmount(),
};
Object.assign(window, { dataFetcherTest: harness });

import { createBrowserHistory } from 'history';

let navigation: ReturnType<typeof createBrowserHistory> | undefined;
export const history = {
  push(path: string) {
    (navigation ||= createBrowserHistory()).push(path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
  replace(path: string) {
    (navigation ||= createBrowserHistory()).replace(path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
};

// Keep new annotation tabs under the deployed application prefix.
export function getPathWithBase(path: string) {
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}

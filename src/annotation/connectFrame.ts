import { expose, wrap, type Remote } from 'comlink';
import { t } from '../i18n';
import { FRAME_PROTOCOL } from './contracts/frame-v1';
import type { FrameEditor, FrameHost, FrameMessage } from './contracts/frame-v1';
import type { PublicAnnotationInput } from './schema';

export interface FrameConnection {
  editor: Remote<FrameEditor>;
  closed: Promise<never>;
  close(): void;
}
export function frameURL(
  address: string,
  parentOrigin: string,
  channel: string,
) {
  const url = new URL(address, window.location.href);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error(t('The annotation service URL must use HTTP or HTTPS'));
  url.searchParams.set('parentOrigin', parentOrigin);
  url.searchParams.set('channel', channel);
  return url;
}
export function connectFrame(
  frame: HTMLIFrameElement,
  address: URL,
  channel: string,
  host: FrameHost,
  ready: (connection: FrameConnection) => void,
) {
  let connection: FrameConnection | undefined;
  let instance = '';
  const hello = () => {
    frame.contentWindow?.postMessage(
      {
        protocol: FRAME_PROTOCOL,
        type: 'hello',
        channel,
      } satisfies FrameMessage,
      address.origin,
    );
  };
  const receive = (event: MessageEvent) => {
    if (
      event.source !== frame.contentWindow ||
      event.origin !== address.origin ||
      event.data?.protocol !== FRAME_PROTOCOL ||
      event.data?.type !== 'ready' ||
      event.data?.channel !== channel ||
      typeof event.data?.instance !== 'string' ||
      !event.data.instance
    )
      return;
    if (connection && instance === event.data.instance) return;
    connection?.close();
    instance = event.data.instance;
    const editor = new MessageChannel();
    const parent = new MessageChannel();
    expose(host, parent.port1);
    let rejectClosed: (error: Error) => void = () => {};
    const closed = new Promise<never>((_resolve, reject) => {
      rejectClosed = reject;
    });
    void closed.catch(() => {});
    connection = {
      editor: wrap<FrameEditor>(editor.port1),
      closed,
      close() {
        editor.port1.close();
        parent.port1.close();
        rejectClosed(new Error(t('The annotation page connection has closed')));
      },
    };
    frame.contentWindow!.postMessage(
      {
        protocol: FRAME_PROTOCOL,
        type: 'connect',
        channel,
        instance,
      } satisfies FrameMessage,
      address.origin,
      [editor.port2, parent.port2],
    );
    ready(connection);
  };
  window.addEventListener('message', receive);
  frame.addEventListener('load', hello);
  hello();
  return () => {
    window.removeEventListener('message', receive);
    frame.removeEventListener('load', hello);
    connection?.close();
  };
}

export function resourceIsReferenced(
  input: PublicAnnotationInput,
  url: string,
): boolean {
  const paths: string[] = [];
  const visit = (value: unknown) => {
    if (
      typeof value === 'string' &&
      /^(?:https?:|local:|oss:|obs:|tos:|\/|data:)/.test(value)
    )
      paths.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object')
      Object.values(value).forEach(visit);
  };
  visit(input);
  return paths.some((path) => {
    if (path === url) return true;
    try {
      const base =
        typeof window === 'undefined'
          ? 'https://host.invalid/'
          : window.location.href;
      const reference = new URL(path, base);
      const requested = new URL(url, base);
      if (
        !['http:', 'https:', 'local:', 'oss:', 'obs:', 'tos:'].includes(
          reference.protocol,
        ) ||
        reference.protocol !== requested.protocol ||
        reference.host !== requested.host
      )
        return false;
      const directory =
        reference.protocol === 'local:'
          ? '/'
          : reference.pathname.slice(
              0,
              reference.pathname.lastIndexOf('/') + 1,
            );
      return (
        requested.pathname.startsWith(directory) &&
        !decodeURIComponent(requested.pathname).split('/').includes('..')
      );
    } catch {
      return false;
    }
  });
}

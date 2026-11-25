import { Alert, Button, Spin } from 'antd';
import { toJS } from 'mobx';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { normalizeLanguage, t, useLanguage } from '../i18n';
import {
  annotationConfiguration as configuration,
  fetchResourceURL,
} from './configuration';
import { connectFrame, frameURL, resourceIsReferenced } from './connectFrame';
import type { FrameConnection } from './connectFrame';
import type {
  FrameLanguage,
  FrameHost,
  FrameInput,
  FrameView,
  RosettaAnnotationDraft,
} from './contracts/frame-v1';
import type { PublicAnnotationInput, TaskParams, TaskResult } from './schema';

export interface RosettaAnnotationProps {
  language?: FrameLanguage;
  input: PublicAnnotationInput;
  taskId?: string;
  initialIndex?: number;
  onChangeIndex?: (index: number) => void;
  onSave?: (
    result: TaskResult,
    params: TaskParams,
    index: number,
    draft?: RosettaAnnotationDraft,
  ) => Promise<void>;
  onProtectionSave?: (draft: RosettaAnnotationDraft) => Promise<void>;
  onBlockingDialogChange?: (open: boolean) => void;
}
export interface RosettaAnnotationHandle {
  captureDraft(): Promise<RosettaAnnotationDraft>;
  authorizeSave(): Promise<string>;
  confirmSave(id: string): Promise<void>;
  authorizeExport(): Promise<void>;
}
interface FrameProps extends RosettaAnnotationProps {
  view: FrameView;
  onInputChange?: (input: PublicAnnotationInput) => void;
  onConfigurationSave?: () => Promise<void>;
}
const EditorFrame = forwardRef<RosettaAnnotationHandle, FrameProps>(
  function EditorFrame(props, ref) {
    const currentLanguage = useLanguage();
    const language = normalizeLanguage(props.language || currentLanguage);
    const initialLanguage = useRef(language);
    const frame = useRef<HTMLIFrameElement>(null);
    const latest = useRef(props);
    latest.current = props;
    const remote = useRef<FrameConnection>();
    const exited = useRef(false);
    const snapshot = useRef('');
    const generated = useRef(new Set<string>());
    const waiters = useRef(new Set<(value?: FrameConnection) => void>());
    const [attempt, retry] = useState(0);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [channel] = useState(() => crypto.randomUUID());
    const address = frameURL(
      (() => {
        const url = new URL(
          configuration.frameURL || 'http://127.0.0.1:4175/',
          window.location.href,
        );
        url.searchParams.set('lng', initialLanguage.current);
        return url.href;
      })(),
      window.location.origin,
      `${channel}-${attempt}`,
    );
    const value = (): FrameInput => ({
      input: toJS(latest.current.input),
      index: latest.current.initialIndex || 0,
      view: latest.current.view,
      taskId: latest.current.taskId || channel,
      language,
    });
    const key = JSON.stringify({ ...value(), language: undefined });
    async function ready() {
      if (status === 'exited')
        throw new Error(t('The annotation page has exited. Open it again'));
      if (remote.current) return remote.current;
      return new Promise<FrameConnection>((resolve, reject) => {
        const finish = (connection?: FrameConnection) => {
          clearTimeout(timer);
          waiters.current.delete(finish);
          if (connection) resolve(connection);
          else
            reject(
              new Error(t('The annotation service is not ready or has closed')),
            );
        };
        const timer = setTimeout(() => finish(), 15000);
        waiters.current.add(finish);
      });
    }
    async function call<T>(
      operation: (connection: FrameConnection) => Promise<T>,
    ) {
      const connection = await ready();
      return Promise.race([operation(connection), connection.closed]);
    }
    useEffect(() => {
      const connection = remote.current;
      if (!connection || status !== 'ready') return;
      // Language updates must not call updateInput: older editors reset their model there.
      const update = connection.editor.setLanguage as
        | ((language: FrameLanguage) => Promise<void>)
        | undefined;
      if (update) void Promise.resolve(update(language)).catch(() => {});
    }, [language, status]);
    useImperativeHandle(ref, () => ({
      captureDraft: () =>
        call((connection) => connection.editor.captureDraft()),
      authorizeSave: () =>
        call((connection) => connection.editor.authorizeSave()),
      confirmSave: (id) =>
        call((connection) => connection.editor.confirmSave(id)),
      authorizeExport: () =>
        call((connection) => connection.editor.authorizeExport()),
    }));
    useEffect(() => {
      let disposed = false;
      exited.current = false;
      setError('');
      setStatus('loading');
      const timeout = setTimeout(() => {
        if (!remote.current)
          setError(
            t(
              'Cannot connect to the annotation service. Check its URL or try again',
            ),
          );
      }, 15000);
      const host: FrameHost = {
        async blockingDialogChanged(open) {
          latest.current.onBlockingDialogChange?.(open);
        },
        save: async (...args) => {
          if (!latest.current.onSave)
            throw new Error(t('No save handler is configured'));
          await latest.current.onSave(...args);
        },
        recover: async (draft) => {
          if (!latest.current.onProtectionSave)
            throw new Error(t('No draft recovery handler is configured'));
          await latest.current.onProtectionSave(draft);
        },
        changeInput: async (input) => {
          snapshot.current = JSON.stringify({
            ...value(),
            input,
            language: undefined,
          });
          latest.current.onInputChange?.(input);
        },
        saveConfiguration: async (input) => {
          latest.current.onInputChange?.(input);
          await latest.current.onConfigurationSave?.();
        },
        changeIndex: async (index) => {
          latest.current.onChangeIndex?.(index);
        },
        resolveResource: async (url) => {
          if (
            !generated.current.has(url) &&
            !resourceIsReferenced(latest.current.input, url)
          )
            throw new Error(
              t('This resource does not belong to the current annotation data'),
            );
          if (configuration.readResource)
            return configuration.readResource(url);
          return fetchResourceURL(url);
        },
        saveFile: async (blob, filename) => {
          if (!configuration.saveFile)
            throw new Error(t('No file save handler is configured'));
          const url = await configuration.saveFile(blob, filename);
          generated.current.add(url);
          return url;
        },
        exiting: async () => {
          exited.current = true;
          latest.current.onBlockingDialogChange?.(false);
          setStatus('exited');
        },
      };
      const stop = connectFrame(
        frame.current!,
        address,
        `${channel}-${attempt}`,
        host,
        (connection) => {
          void connection.closed.catch(() => {
            if (!disposed && remote.current === connection) {
              remote.current = undefined;
              latest.current.onBlockingDialogChange?.(false);
              if (!exited.current) {
                setStatus('loading');
                setError(
                  t(
                    'The annotation service connection was interrupted. Open it again',
                  ),
                );
              }
            }
          });
          const initial = value();
          void Promise.race([
            connection.editor.initialize(initial),
            connection.closed,
          ])
            .then(() => {
              if (disposed) return;
              remote.current = connection;
              snapshot.current = JSON.stringify({
                ...initial,
                language: undefined,
              });
              clearTimeout(timeout);
              setError('');
              setStatus('ready');
              waiters.current.forEach((finish) => finish(connection));
            })
            .catch(
              (failure) =>
                !disposed && setError(String(failure.message || failure)),
            );
        },
      );
      return () => {
        disposed = true;
        latest.current.onBlockingDialogChange?.(false);
        clearTimeout(timeout);
        stop();
        remote.current = undefined;
        waiters.current.forEach((finish) => finish());
        void configuration
          .releaseFiles?.([...generated.current])
          .catch(() => {});
      };
    }, [address.href, attempt]);
    useEffect(() => {
      if (!remote.current || key === snapshot.current) return;
      snapshot.current = key;
      void remote.current.editor
        .updateInput(value())
        .catch((failure) => setError(failure.message));
    }, [key, status]);
    return (
      <div
        className="rosetta-frame"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: '100%',
          minHeight: 0,
          position: 'relative',
        }}
      >
        {(error || status === 'exited') && (
          <Alert
            type={error ? 'error' : 'info'}
            message={
              error ||
              t(
                'The annotation page has exited. The draft is saved on this device',
              )
            }
            action={
              <Button onClick={() => retry((value) => value + 1)}>
                {t('Reopen')}
              </Button>
            }
          />
        )}
        {status === 'loading' && !error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Spin />
          </div>
        )}
        <iframe
          ref={frame}
          src={address.href}
          title={
            props.view === 'annotation'
              ? t('Rosetta annotation workspace')
              : props.view === 'operators'
              ? t('Annotation tool configuration')
              : t('Algorithm assistance configuration')
          }
          allow="fullscreen; clipboard-write"
          style={{
            width: '100%',
            height: '100%',
            flex: 1,
            minHeight: 0,
            border: 0,
            display: status === 'exited' ? 'none' : 'block',
          }}
        />
      </div>
    );
  },
);
export const RosettaAnnotation = forwardRef<
  RosettaAnnotationHandle,
  RosettaAnnotationProps
>((props, ref) => <EditorFrame {...props} ref={ref} view="annotation" />);
export function OperatorsEditor({
  onProtectionSave,
  ...props
}: Pick<FrameProps, 'input' | 'onInputChange' | 'initialIndex'> & {
  onProtectionSave?: () => Promise<void>;
}) {
  return (
    <EditorFrame
      {...props}
      onConfigurationSave={onProtectionSave}
      view="operators"
    />
  );
}
export function AlgorithmEditor(
  props: Pick<FrameProps, 'input' | 'onInputChange' | 'initialIndex'>,
) {
  return <EditorFrame {...props} view="algorithms" />;
}

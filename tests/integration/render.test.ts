import { waitFor } from '@testing-library/dom';
import { createDOMFixture, fillInput, findButton } from '../support/dom';
import type {
  FrameEditor,
  FrameHost,
  FrameInput,
} from '@stardustai/annotation-client/protocol';
import { FRAME_PROTOCOL } from '@stardustai/annotation-client/protocol';
import { expose, wrap } from 'comlink';
import type { Remote } from 'comlink';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import * as fakeIndexedDB from 'fake-indexeddb';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { SourceTextModule } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const editorOrigin = 'https://editor.example.test';
const identityProtocol = 'rosetta:morningstar:1';

test(
  'the real public application exchanges files, configuration, results and recovery drafts with an isolated iframe',
  { timeout: 120000 },
  async () => {
    const built = await build({
      configFile: false,
      root,
      envDir: false,
      resolve: {
        alias: {
          'axios/lib/core/createError': resolve(
            root,
            'src/objectStorage/axiosLegacyError.ts',
          ),
        },
      },
      define: {
        'import.meta.env.VITE_ANNOTATION_URL': JSON.stringify(
          editorOrigin + '/',
        ),
        'import.meta.env.VITE_MORNINGSTAR_SIGN_IN_URL': JSON.stringify(
          editorOrigin + '/morningstar',
        ),
      },
      logLevel: 'silent',
      plugins: [
        react({
          babel: {
            plugins: [
              ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
              ['@babel/plugin-transform-class-properties', { loose: false }],
            ],
          },
        }),
        {
          name: 'test-styles',
          enforce: 'pre',
          resolveId(source) {
            if (source.endsWith('.css')) return '\0test-style';
          },
          load(id) {
            if (id === '\0test-style') return 'export {};';
          },
        },
      ],
      css: { postcss: { plugins: [] } },
      build: {
        write: false,
        target: 'es2022',
        minify: false,
        reportCompressedSize: false,
        rollupOptions: {
          input: resolve(root, 'tests/fixtures/render.tsx'),
          output: { format: 'es' },
          onwarn() {},
        },
      },
    });
    assert.ok(!Array.isArray(built) && 'output' in built);
    const { dom, window, document, errors, until } = createDOMFixture(
      'http://127.0.0.1:4174/annotationTool',
    );
    for (const [name, value] of Object.entries(fakeIndexedDB)) {
      if (name.startsWith('IDB'))
        Object.defineProperty(window, name, { value, configurable: true });
    }
    Object.defineProperty(window, 'indexedDB', {
      value: new fakeIndexedDB.IDBFactory(),
      configurable: true,
    });
    window.MessageChannel = MessageChannel;
    window.setImmediate = setImmediate;
    window.clearImmediate = clearImmediate;
    window.Blob = Blob;
    window.File = File;
    window.TextEncoder = TextEncoder;
    window.TextDecoder = TextDecoder;
    window.Headers = Headers;
    window.Request = Request;
    window.Response = Response;
    window.AbortController = AbortController;
    window.ReadableStream = ReadableStream;
    window.URL.createObjectURL = URL.createObjectURL;
    window.URL.revokeObjectURL = URL.revokeObjectURL;
    const requests: string[] = [];
    window.fetch = async (url) => {
      requests.push(String(url));
      throw new Error('offline');
    };
    const ports: MessagePort[] = [];
    async function connect() {
      await until(
        () => document.querySelector('iframe'),
        'The host should mount its iframe',
      );
      const frame = document.querySelector('iframe')!;
      const address = new URL(frame.src);
      assert.equal(address.origin, editorOrigin);
      let initial: FrameInput | undefined;
      let host: Remote<FrameHost> | undefined;
      let updates = 0;
      let latestLanguage: string | undefined;
      const editor: FrameEditor = {
        async initialize(value) {
          initial = value;
        },
        async updateInput() {
          updates++;
        },
        async setLanguage(language) {
          latestLanguage = language;
        },
        async captureDraft() {
          throw new Error('private fixture');
        },
        async authorizeSave() {
          throw new Error('private fixture');
        },
        async authorizeExport() {
          throw new Error('private fixture');
        },
        async confirmSave() {},
      };
      frame.contentWindow!.postMessage = ((
        message: any,
        origin: string,
        transfer: MessagePort[],
      ) => {
        if (message.type !== 'connect') return;
        assert.equal(origin, address.origin);
        ports.push(...transfer);
        expose(editor, transfer[0]);
        host = wrap<FrameHost>(transfer[1]);
      }) as typeof window.postMessage;
      window.dispatchEvent(
        new window.MessageEvent('message', {
          source: frame.contentWindow,
          origin: address.origin,
          data: {
            protocol: FRAME_PROTOCOL,
            type: 'ready',
            channel: address.searchParams.get('channel'),
            instance: crypto.randomUUID(),
          },
        }),
      );
      await until(
        () =>
          initial &&
          host &&
          !document.querySelector('.rosetta-frame .ant-spin'),
        'The iframe handshake should complete',
      );
      return {
        frame,
        initial: initial!,
        host: host!,
        updates: () => updates,
        latestLanguage: () => latestLanguage,
      };
    }
    async function switchFromDrawer(name: string) {
      const previousFrame = document.querySelector('iframe');
      const previousHash = window.location.hash;
      findButton(document, 'Task list')!.click();
      await until(
        () => document.querySelector('.annotation-task-drawer.ant-drawer-open'),
        'The task list should open as a drawer',
      );
      const row = [
        ...document.querySelectorAll<HTMLButtonElement>(
          '.annotation-task-item',
        ),
      ].find((button) => button.querySelector('strong')?.textContent === name);
      assert.ok(row);
      row.click();
      await until(
        () =>
          [...document.querySelectorAll('.ant-modal-confirm-title')].some(
            (title) => title.textContent === 'Switch annotation data',
          ),
        'Task selection should retain the existing save reminder',
      );
      assert.equal(window.location.hash, previousHash);
      findButton(document, 'Switch data')!.click();
      await until(
        () => document.querySelector('iframe') !== previousFrame,
        'Confirming should open the selected task in the current workspace',
      );
      return connect();
    }
    try {
      const chunks = new Map(
        built.output
          .filter((item) => item.type === 'chunk')
          .map((item) => [item.fileName, item]),
      );
      const modules = new Map<string, SourceTextModule>();
      const getModule = (name: string): SourceTextModule => {
        const existing = modules.get(name);
        if (existing) return existing;
        const chunk = chunks.get(name);
        if (!chunk) throw new Error(`Missing test chunk ${name}`);
        const module = new SourceTextModule(chunk.code, {
          context: dom.getInternalVMContext(),
          identifier: `http://127.0.0.1:4174/${name}`,
          initializeImportMeta(meta) {
            meta.url = `http://127.0.0.1:4174/${name}`;
          },
          async importModuleDynamically(specifier, referencing) {
            const dynamic = getModule(
              new URL(specifier, referencing.identifier).pathname.slice(1),
            );
            if (dynamic.status === 'unlinked') await dynamic.link(link);
            if (dynamic.status === 'linked') await dynamic.evaluate();
            return dynamic;
          },
        });
        modules.set(name, module);
        return module;
      };
      const link = (specifier: string, referencing: SourceTextModule) =>
        getModule(new URL(specifier, referencing.identifier).pathname.slice(1));
      const entry = built.output.find(
        (item) => item.type === 'chunk' && item.isEntry,
      )!;
      const module = getModule(entry.fileName);
      await module.link(link);
      await module.evaluate();
      await until(
        () => document.querySelector('.ant-app'),
        'The public provider should mount',
      );
      assert.equal(
        document.querySelector<HTMLElement>('.ant-app')!.style.height,
        '100%',
      );
      await until(
        () => document.body.classList.contains('dark'),
        'The original dark theme should be active',
      );
      assert.equal(document.body.getAttribute('theme'), 'dark');
      const confirmation = window.hostTest.confirm();
      await until(
        () => document.querySelector('.ant-modal-confirm'),
        'Static confirmation should render',
      );
      assert.match(
        document.head.textContent,
        /--ant-modal-content-bg:\s*#1f1f1f/,
      );
      confirmation.destroy();
      assert.equal(document.querySelector('.auth-guest-account'), null);
      assert.equal(document.querySelector('.annotation-preview-panel'), null);
      const previewToggle = findButton(document, 'View data and files')!;
      assert.equal(previewToggle.getAttribute('aria-expanded'), 'false');
      previewToggle.click();
      await until(
        () => document.querySelector('.annotation-preview-panel'),
        'Data preview and files should expand on demand',
      );
      findButton(document, 'Collapse data and files')!.click();
      await until(
        () => !document.querySelector('.annotation-preview-panel'),
        'Data preview and files should collapse again',
      );
      const task = await window.hostTest.createLocalTask();
      const secondTask = await window.hostTest.createLocalTask(
        'second iframe task',
      );
      window.hostTest.navigate(`/annotate#session/${task.id}`);
      let annotation = await connect();
      assert.equal(annotation.initial.view, 'annotation');
      assert.equal(annotation.initial.taskId, task.id);
      assert.equal(annotation.initial.language, 'en-US');
      assert.equal(
        new URL(annotation.frame.src).searchParams.get('lng'),
        'en-US',
      );
      for (const language of ['zh-CN', 'de-DE', 'ja-JP']) {
        await window.hostTest.setLanguage(language);
        await until(
          () => annotation.latestLanguage() === language,
          'Locale updates should reach the connected editor',
        );
        assert.equal(
          document.querySelector('iframe'),
          annotation.frame,
          'Changing language must preserve the iframe',
        );
        assert.equal(
          annotation.updates(),
          0,
          'A locale change must not reset the active input',
        );
      }
      await window.hostTest.setLanguage('en-US');
      await until(
        () => annotation.latestLanguage() === 'en-US',
        'The editor should receive English when switching back',
      );
      assert.equal(findButton(document, 'Task details'), undefined);
      findButton(document, 'Task list')!.click();
      await until(
        () =>
          document.querySelector(
            '.annotation-task-drawer.ant-drawer-left.ant-drawer-open',
          ),
        'The task drawer should open on the left',
      );
      await until(
        () => document.querySelectorAll('.annotation-task-item').length === 2,
        'The drawer should use the existing task list',
      );
      const currentTask = document.querySelector<HTMLButtonElement>(
        '.annotation-task-item[aria-current="page"]',
      )!;
      assert.ok(currentTask.textContent.includes(task.name));
      const taskSearch = document.querySelector<HTMLInputElement>(
        '.annotation-task-search input',
      )!;
      fillInput(taskSearch, 'second iframe');
      await until(
        () => document.querySelectorAll('.annotation-task-item').length === 1,
        'Searching should narrow the task list',
      );
      assert.ok(
        document
          .querySelector('.annotation-task-item')!
          .textContent.includes(secondTask.name),
      );
      fillInput(taskSearch, '');
      await until(
        () => document.querySelectorAll('.annotation-task-item').length === 2,
        'Clearing the search should restore the task list',
      );
      document
        .querySelector<HTMLButtonElement>(
          '.annotation-task-item[aria-current="page"]',
        )!
        .click();
      await until(
        () =>
          !document.querySelector('.annotation-task-drawer.ant-drawer-open'),
        'Selecting the active task should close the drawer',
      );
      assert.equal(document.querySelector('iframe'), annotation.frame);
      const popup = {
        closed: false,
        close() { this.closed = true; },
        postMessage(data: { requestId: string }, origin: string) {
          assert.equal(origin, editorOrigin);
          requestId = data.requestId;
        },
      };
      let requestId: string | undefined;
      const nativeOpen = window.open;
      window.open = ((url: string) => {
        assert.equal(url, editorOrigin + '/morningstar');
        return popup;
      }) as unknown as typeof window.open;
      function identityMessage(source: unknown, type: string, value = {}) {
        window.dispatchEvent(new window.MessageEvent('message', {
          origin: editorOrigin,
          source: source as Window,
          data: { protocol: identityProtocol, type, requestId, ...value },
        }));
      }
      findButton(document, 'Sign in with MorningStar')!.click();
      identityMessage(popup, 'popup-ready');
      assert.ok(requestId);
      identityMessage(popup, 'sign-in-complete');
      assert.equal(document.body.textContent.includes('MorningStar sign-in confirmed'), false);
      identityMessage(annotation.frame.contentWindow, 'session-status', { signedIn: true });
      await until(
        () => document.body.textContent.includes('MorningStar sign-in confirmed'),
        'The mounted editor should confirm the new session',
      );
      assert.equal(popup.closed, true);
      assert.equal(document.querySelector('iframe'), annotation.frame);
      window.open = nativeOpen;
      annotation = await switchFromDrawer(secondTask.name);
      assert.equal(annotation.initial.taskId, secondTask.id);
      annotation = await switchFromDrawer(task.name);
      assert.equal(annotation.initial.taskId, task.id);
      const exportButton = [...document.querySelectorAll('button')].find(
        (button) => button.textContent.trim() === 'Export',
      )!;
      exportButton.click();
      const exportDialog = () =>
        [...document.querySelectorAll<HTMLElement>('.ant-modal')].find(
          (modal) =>
            modal.querySelector('.ant-modal-title')?.textContent ===
            'Export task',
        );
      await until(() => exportDialog(), 'Export dialog should open');
      await annotation.host.blockingDialogChanged(true);
      await until(
        () =>
          exportDialog()!.closest<HTMLElement>('.ant-modal-wrap')!.style
            .display === 'none',
        'Export must yield to the private login or License dialog',
      );
      assert.equal(exportButton.disabled, true);
      await annotation.host.blockingDialogChanged(false);
      await until(
        () =>
          exportDialog()!.closest<HTMLElement>('.ant-modal-wrap')!.style
            .display !== 'none',
        'Export should return with its state after the private dialog closes',
      );
      exportDialog()!
        .querySelector<HTMLButtonElement>('.ant-modal-close')!
        .click();
      const resource = await annotation.host.resolveResource(
        'local://iframe-fixture/image.png',
      );
      assert.equal(await (resource as Blob).text(), 'local image');
      await assert.rejects(
        annotation.host.resolveResource('local://unrelated/secret.png'),
        /does not belong/i,
      );
      const result = {
        annotations: [],
        notes: ['from iframe'],
        issues: [],
      } as any;
      const params = {
        version: '1.0.0',
        record:
          annotation.initial.input.taskParams.type === 'multiple'
            ? annotation.initial.input.taskParams.records[0]
            : annotation.initial.input.taskParams.value.record,
        operators: [],
      } as any;
      const draft = {
        result,
        params,
        index: 0,
        segmentation: new Uint8Array([1, 3, 5]),
      };
      await annotation.host.save(result, params, 0, draft);
      const saved = await window.hostTest.loadSession(task.id);
      assert.equal(saved.status, 'completed');
      assert.deepEqual(
        Array.from(saved.input.taskParams.taskResults[0].notes),
        ['from iframe'],
      );
      const segmentation = saved.input.extraDataList[0].segmentationDataUrl;
      assert.deepEqual(
        [
          ...new Uint8Array(
            await (
              await window.hostTest.getLocalFile(segmentation)
            ).arrayBuffer(),
          ),
        ],
        [1, 3, 5],
      );
      await annotation.host.recover({
        ...draft,
        result: { ...result, notes: ['recovered'] },
      });
      await annotation.host.exiting();
      await until(
        () => annotation.frame.style.display === 'none',
        'Recovery should hide the exited editor',
      );
      assert.equal(
        (await window.hostTest.loadSession(task.id)).status,
        'in_progress',
      );

      window.hostTest.navigate(`/annotationTool?task=${task.id}`);
      await until(
        () => document.querySelector('iframe') !== annotation.frame,
        'Configuration should get its own frame',
      );
      const configuration = await connect();
      assert.equal(configuration.initial.view, 'operators');
      const changed = structuredClone(configuration.initial.input);
      if (changed.taskParams.type !== 'multiple') throw new Error('fixture');
      changed.taskParams.operators[0].label = 'updated through iframe';
      await configuration.host.changeInput(changed);
      await waitFor(
        async () =>
          assert.equal(
            (
              await window.hostTest.loadSession(task.id)
            ).input.taskParams.operators[0].label,
            'updated through iframe',
            document.querySelector('.workspace-footer-note')?.textContent,
          ),
        {
          container: document.documentElement,
          timeout: 5000,
          onTimeout: (error) => error,
        },
      );
      await delay(700);
      assert.equal(
        (await window.hostTest.loadSession(task.id)).input.taskParams
          .operators[0].label,
        'updated through iframe',
      );
      assert.equal(
        configuration.updates(),
        0,
        'Echoing configuration must preserve the editing frame',
      );
      assert.deepEqual(
        requests.filter((url) => /\/api\/(auth|annotation)\//.test(url)),
        [],
      );
      assert.deepEqual(errors, []);
    } catch (failure) {
      throw new Error((failure as Error).message + '\n' + errors.join('\n'), {
        cause: failure,
      });
    } finally {
      window.hostTest?.unmount();
      ports.forEach((port) => port.close());
      dom.window.close();
    }
  },
);

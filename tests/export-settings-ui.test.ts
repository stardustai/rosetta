import { createDOMFixture, fillInput } from './support/dom';
import assert from 'node:assert/strict';
import * as esbuild from 'esbuild';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
test(
  'export settings switch between one visible panel and preserve the other destinations when saving',
  { timeout: 20000 },
  async () => {
    const seed = {
      id: 'default',
      defaultMethod: 'download',
      updatedAt: 1,
      api: {
        url: 'https://api.example.test/old',
        method: 'PUT',
        headers: [{ name: 'Authorization', value: 'fixture-token' }],
      },
      storage: { sourceId: 'oss-fixture', prefix: 'results/' },
    };
    const mocks = {
      router: `export const useNavigate = () => () => {};`,
      layout: `export default function Layout({ children, footer }) { return <main>{children}<footer>{footer}</footer></main>; }`,
      settings: `export async function saveExportSettings(value) { globalThis.savedSettings = structuredClone(value); return value; }`,
      useSettings: `export const useExportSettings = () => ({ settings: ${JSON.stringify(
        seed,
      )}, loading: false, error: '' });`,
      sources: `export const useSavedConnections = () => ({ sources: [{id: 'oss-fixture', name: 'Fixture', connection: {provider: 'oss', bucket: 'fixture', prefix: ''}}], loading: false, error: '' });`,
    };
    const targets = new Map([
      ['react-router-dom', 'router'],
      ['../tasks/TaskLayout', 'layout'],
      ['../../exports/settings', 'settings'],
      ['../../exports/useExportSettings', 'useSettings'],
      ['../../objectStorage/useSavedConnections', 'sources'],
    ]);
    const bundle = await esbuild.build({
      absWorkingDir: root,
      entryPoints: [resolve(root, 'tests/fixtures/export-settings-ui.tsx')],
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'iife',
      target: 'es2020',
      jsx: 'automatic',
      define: { 'process.env.NODE_ENV': '"test"' },
      logLevel: 'warning',
      plugins: [
        {
          name: 'settings-boundaries',
          setup(build) {
            build.onResolve({ filter: /.*/ }, ({ path }) =>
              targets.has(path)
                ? { path: targets.get(path), namespace: 'settings-ui' }
                : undefined,
            );
            build.onLoad(
              { filter: /.*/, namespace: 'settings-ui' },
              ({ path }) => ({
                contents: mocks[path],
                loader: 'tsx',
                resolveDir: root,
              }),
            );
          },
        },
      ],
    });
    const { dom, window, document, errors, until } = createDOMFixture(
      'http://127.0.0.1:4174/exportSettings',
    );
    const switchTo = (method) => {
      const labels = {
        download: 'Local download',
        api: 'API',
        storage: 'Object storage',
      };
      const item = [...document.querySelectorAll('.ant-segmented-item')].find(
        (node) =>
          node.textContent.replace(/\s/g, '') ===
          labels[method].replace(/\s/g, ''),
      );
      assert.ok(item, `Missing switch option: ${method}`);
      item.querySelector('input').click();
    };
    try {
      window.eval(bundle.outputFiles[0].text);
      await until(
        () => document.querySelector('.export-settings-local'),
        'Local download panel should render first',
      );
      assert.equal(
        document.querySelector('[aria-label="API export configuration"]'),
        null,
      );
      assert.equal(
        document.querySelector(
          '[aria-label="Object storage export configuration"]',
        ),
        null,
      );
      switchTo('api');
      await until(
        () => document.querySelector('[aria-label="API export configuration"]'),
        'API switch should reveal its configuration',
      );
      const input = document.querySelector<HTMLInputElement>(
        'input[placeholder="https://example.com/api/annotations"]',
      );
      assert.equal(input.value, seed.api.url);
      fillInput(input, 'https://api.example.test/new');
      await delay(30);
      switchTo('storage');
      await until(
        () =>
          document.querySelector(
            '[aria-label="Object storage export configuration"]',
          ),
        'Storage switch should reveal its configuration',
      );
      assert.equal(
        document.querySelector('[aria-label="API export configuration"]'),
        null,
      );
      switchTo('api');
      await until(
        () =>
          document.querySelector(
            'input[placeholder="https://example.com/api/annotations"]',
          ),
        'Return to the API panel',
      );
      assert.equal(
        document.querySelector<HTMLInputElement>(
          'input[placeholder="https://example.com/api/annotations"]',
        ).value,
        'https://api.example.test/new',
      );
      switchTo('download');
      await until(
        () => document.querySelector('.export-settings-local'),
        'Return to local download',
      );
      [...document.querySelectorAll('button')]
        .find((node) => node.textContent.trim() === 'Save settings')
        .click();
      await until(
        () => window.savedSettings,
        'Saving must include all configured destinations',
      );
      assert.equal(window.savedSettings.defaultMethod, 'download');
      assert.equal(
        window.savedSettings.api.url,
        'https://api.example.test/new',
      );
      assert.equal(window.savedSettings.api.headers[0].value, 'fixture-token');
      assert.equal(window.savedSettings.storage.sourceId, 'oss-fixture');
      assert.equal(window.savedSettings.storage.prefix, 'results/');
      assert.deepEqual(errors, []);
    } finally {
      window.unmount?.();
      dom.window.close();
    }
  },
);

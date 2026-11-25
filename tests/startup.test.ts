import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { build } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('host route providers and consumers use the same direct Router dependency', async () => {
  const entry = await readFile(resolve(root, 'src/main.tsx'), 'utf8');
  assert.match(entry, /import \{[^}]*BrowserRouter[^}]*\} from 'react-router-dom';/);
  async function check(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await check(path);
      else if (/\.[jt]sx?$/.test(entry.name)) {
        const code = await readFile(path, 'utf8');
        assert.ok(
          !/(?:from\s*|import\s*\()(['"])(?:react-router|react-router-dom\/[^'"]*)\1/.test(
            code,
          ),
          `${path}: import routing components and hooks from react-router-dom`,
        );
      }
    }
  }
  await check(resolve(root, 'src'));
});

test('the production entry mounts without a development HMR context', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'annotation-startup-'));
  // Compile the actual entry with production replacements and isolated DOM boundaries.
  const modules = {
    router: `
      export const BrowserRouter = 'BrowserRouter',
        Routes = 'Routes', Route = 'Route', Navigate = 'Navigate';
      export function useLocation() { return { search: globalThis.state.search || '' }; }
    `,
    configuration: `export function configureRosetta(options) { globalThis.state.configuration = options; }`,
    reactDOM: `export function createRoot(node) { return { render(tree) { globalThis.state.mounts.push({ node, tree }); } }; }`,
    jsx: `export const Fragment = 'Fragment'; export function jsx(type, props) { return { type, props }; } export const jsxs = jsx;`,
    i18n: `export const t = (key) => key;`,
    resources: `export function resolveLocalResource() {}`,
    storage: `export async function getLocalFile() {} export async function storeGeneratedFile() {} export async function releaseUnusedImport() {}`,
    page: `export default function Page() { return null; }`,
    style: `export {};`,
  };
  const aliases = new Map([
    ['react-router-dom', 'router'],
    ['./annotation/configuration', 'configuration'],
    ['react-dom/client', 'reactDOM'],
    ['react/jsx-runtime', 'jsx'],
    ['./localData/resources', 'resources'],
    ['./localData/storage', 'storage'],
    ['./LanguageProvider', 'page'],
    ['./i18n', 'i18n'],
  ]);
  try {
    {
      const output = await build({
        configFile: false,
        root,
        envDir: directory,
        base: '/startup-check/',
        logLevel: 'silent',
        esbuild: { jsx: 'automatic' },
        plugins: [
          {
            name: 'startup-boundaries',
            enforce: 'pre',
            resolveId(source) {
              const key =
                aliases.get(source) ||
                (source.endsWith('.css')
                  ? 'style'
                  : source.startsWith('./pages/')
                  ? 'page'
                  : undefined);
              return key ? `\0startup:${key}` : null;
            },
            load(id) {
              if (id.startsWith('\0startup:'))
                return modules[id.slice('\0startup:'.length)];
            },
          },
        ],
        build: {
          write: false,
          target: 'es2020',
          minify: 'esbuild',
          reportCompressedSize: false,
          rollupOptions: {
            input: resolve(root, 'src/main.tsx'),
            output: { format: 'iife' },
          },
        },
      });
      assert.ok(!Array.isArray(output) && 'output' in output);
      const entry = output.output.find(
        (item) => item.type === 'chunk' && item.isEntry,
      );
      assert.ok(
        entry?.type === 'chunk',
        'Vite must emit the actual application entry',
      );
      const node = { id: 'root' };
      const state: {
        mounts: Array<{ node: unknown; tree: unknown }>;
        unsubscribed: boolean;
        timerCleared: boolean;
        configuration?: {
          frameURL: string;
        };
        search?: string;
      } = { mounts: [], unsubscribed: false, timerCleared: false };
      runInNewContext(
        entry.code,
        {
          state,
          document: { getElementById: (id) => (id === 'root' ? node : null) },
          window: {
            setInterval: () => 1,
            clearInterval: () => {
              state.timerCleared = true;
            },
          },
        },
        { timeout: 1000 },
      );
      assert.equal(state.mounts.length, 1);
      assert.equal(state.mounts[0].node, node);
      assert.ok(state.mounts[0].tree);
      assert.equal(state.configuration.frameURL, undefined);
      assert.ok(!('beforeExport' in state.configuration));
      assert.ok(!('devtoolsDetection' in state.configuration));
      const routes = [];
      function collectRoutes(element) {
        if (Array.isArray(element)) return element.forEach(collectRoutes);
        if (!element || typeof element !== 'object') return;
        if (element.type === 'Route') routes.push(element.props);
        collectRoutes(element.props?.children);
      }
      collectRoutes(state.mounts[0].tree);
      assert.ok(
        !routes.some((route) => route.element?.type === 'LicenseProtected'),
        'management pages must not sit behind a certificate gate',
      );
      assert.equal(
        routes.find((route) => route.path === '*').element.props.to,
        '/',
      );
      state.search = '?batchSource=saved-oss-source';
      for (const path of ['/projects', '/projects/:projectId']) {
        const redirect = routes
          .find((route) => route.path === path)
          .element.type();
        assert.equal(redirect.props.to, '/tasks?batchSource=saved-oss-source');
        assert.equal(redirect.props.replace, true);
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

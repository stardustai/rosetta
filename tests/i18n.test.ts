import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createDOMFixture, fillInput } from './support/dom';
import type { I18nHarness } from './fixtures/i18n';

test('English is the first-run default; switching languages preserves edits, updates static labels, persists, and follows other tabs', async () => {
  const bundle = await build({
    entryPoints: [
      fileURLToPath(new URL('./fixtures/i18n.tsx', import.meta.url)),
    ],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"test"' },
  });
  for (const initial of [null, 'zh-CN', 'de-DE', 'ja-JP']) {
    const { dom, window, document, until, errors } = createDOMFixture(
      'https://i18n.example',
    );
    const browser = window as typeof window & { i18nTest: I18nHarness };
    if (initial) window.localStorage.setItem('rosetta.language', initial);
    try {
      window.eval(bundle.outputFiles[0].text);
      await until(
        () => document.querySelector('input'),
        'The translated form should render',
      );
      assert.equal(document.documentElement.lang, initial || 'en-US');
      assert.equal(
        document.querySelector('h1')!.textContent,
        (
          {
            'zh-CN': '任务管理',
            'de-DE': 'Aufgabenverwaltung',
            'ja-JP': 'タスク管理',
          } as Record<string, string>
        )[initial || ''] || 'Task management',
      );
      if (initial) await browser.i18nTest.setLanguage('en-US');
      await until(
        () => document.querySelector('h1')?.textContent === 'Task management',
        'English should render',
      );
      const input = document.querySelector('input')!;
      fillInput(input, '用户自定义 task');
      document.querySelector('button')!.click();
      await until(
        () => document.querySelector('h1')?.textContent === '任务管理',
        'Chinese should render without remounting the form',
      );
      assert.equal(document.querySelector('input'), input);
      assert.equal(input.value, '用户自定义 task');
      assert.equal(document.querySelector('p')!.textContent, '图片 / 已完成');
      assert.equal(
        document.querySelector('output')!.textContent,
        '已创建 3 个任务',
      );
      assert.equal(document.title, '独立标注工具');
      assert.equal(
        window.localStorage.getItem(browser.i18nTest.LANGUAGE_KEY),
        'zh-CN',
      );
      window.dispatchEvent(
        new window.StorageEvent('storage', {
          key: 'rosetta.language',
          newValue: 'en-US',
        }),
      );
      await until(
        () => document.querySelector('h1')?.textContent === 'Task management',
        'Language changes in another tab should be applied',
      );
      assert.equal(
        document.querySelector('p')!.textContent,
        'Image / Completed',
      );
      assert.equal(
        document.querySelector('output')!.textContent,
        'Created 3 tasks',
      );
      assert.equal(input.value, '用户自定义 task');
      assert.equal(document.documentElement.lang, 'en-US');
      for (const [language, heading, title] of [
        ['de-DE', 'Aufgabenverwaltung', 'Eigenständiges Annotationswerkzeug'],
        ['ja-JP', 'タスク管理', '独立型アノテーションツール'],
        ['en-US', 'Task management', 'Standalone annotation tool'],
      ] as const) {
        await browser.i18nTest.setLanguage(language);
        await until(
          () => document.querySelector('h1')?.textContent === heading,
          'All supported languages should update without losing edits',
        );
        assert.equal(document.title, title);
        assert.equal(document.documentElement.lang, language);
        assert.equal(document.querySelector('input'), input);
        assert.equal(input.value, '用户自定义 task');
        assert.equal(
          window.localStorage.getItem(browser.i18nTest.LANGUAGE_KEY),
          language,
        );
      }
      await browser.i18nTest.setLanguage('de-DE');
      assert.equal(
        browser.i18nTest.t('{{count}} records', { count: 1 }),
        '1 Datensatz',
      );
      assert.equal(
        browser.i18nTest.t('{{count}} records', { count: 2 }),
        '2 Datensätze',
      );
      await browser.i18nTest.setLanguage('ja-JP');
      assert.equal(
        browser.i18nTest.t('{{count}} records', { count: 2 }),
        '2 件',
      );
      for (const [variant, language] of [
        ['de', 'de-DE'],
        ['de-AT', 'de-DE'],
        ['DE_de', 'de-DE'],
        ['ja', 'ja-JP'],
        ['ja_JP', 'ja-JP'],
        ['unknown', 'en-US'],
      ]) {
        assert.equal(browser.i18nTest.normalizeLanguage(variant), language);
      }
      assert.deepEqual(errors, []);
    } finally {
      browser.i18nTest?.unmount();
      dom.window.close();
    }
  }
});

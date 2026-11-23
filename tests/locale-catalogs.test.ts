import assert from 'node:assert/strict';
import { test } from 'node:test';
import { zhCN } from '../src/messages';
import deDE from '../src/locales/de-DE.json';
import jaJP from '../src/locales/ja-JP.json';

const placeholders = (value: string) =>
  [...value.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]).sort();

test('German and Japanese cover every host message and preserve interpolation', () => {
  for (const catalog of [deDE, jaJP] as Record<string, string>[]) {
    for (const key of Object.keys(zhCN)) {
      assert.ok(catalog[key]?.trim(), `Missing translation: ${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(key), key);
    }
  }
});

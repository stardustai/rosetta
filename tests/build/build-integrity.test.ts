import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
async function files(path: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) found.push(...(await files(full)));
    else found.push(full);
  }
  return found;
}

test('the public distribution includes the embedded editor host', async () => {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.dependencies.comlink);
  assert.equal(pkg.dependencies['@stardustai/annotation-client'], undefined);
  assert.equal(pkg.dependencies['@stardustai/rosetta-annotation'], undefined);
  const schema = await import('../../src/annotation/schema/index.js');
  assert.equal(typeof schema.validateSchema, 'function');
  assert.equal(typeof schema.migrateAnnotation, 'function');
  const output = join(root, 'dist');
  for (const file of await files(output)) {
    assert.ok(
      !/\.(map|tsx?|jsx)$/.test(file),
      `Unexpected source map or source file ${file}`,
    );
    assert.ok(
      !relative(output, file).includes('rosetta-annotation/'),
      'The private editor must be deployed independently',
    );
    if (!file.endsWith('.js')) continue;
    const code = await readFile(file, 'utf8');
    assert.doesNotMatch(code, /\/api\/(?:auth|annotation)\//);
    assert.doesNotMatch(code, /__ROSETTA_ASSET_BASE__/);
  }
  const html = await readFile(join(output, 'index.html'), 'utf8');
  assert.match(html, /<script[^>]+type="module"[^>]+src=/);
});

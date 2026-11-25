import assert from 'node:assert/strict';
import { test } from 'node:test';

const origin = process.env.ANNOTATION_TOOL_URL || 'http://127.0.0.1:4174';
async function get(path: string) {
  const response = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, `Cannot load ${path}`);
  return response;
}

test('the live public host loads its iframe configuration and has no login proxy', async () => {
  assert.match(await (await get('/annotationTool')).text(), /\/src\/main.tsx/);
  const source = await (await get('/src/main.tsx')).text();
  assert.match(source, /\/src\/annotation\/configuration\.ts/);
  assert.doesNotMatch(source, /AuthRoot|LicenseRoot|rosetta-annotation/);
  assert.match(
    (await get('/api/health')).headers.get('content-type') || '',
    /text\/html/,
  );
});

test('quick-start image, point-cloud and text examples remain locally available', async () => {
  assert.match(await (await get('/examples/street.svg')).text(), /<svg/);
  const pcd = await (await get('/examples/street.pcd')).text();
  const points = Number(pcd.match(/^POINTS (\d+)$/m)?.[1]);
  assert.ok(points > 1000);
  assert.equal(pcd.split('DATA ascii\n')[1].trim().split('\n').length, points);
  assert.match(
    await (await get('/examples/entities.txt')).text(),
    /Alex traveled from London/,
  );
});

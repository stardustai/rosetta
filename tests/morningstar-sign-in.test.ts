import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  morningStarProtocol,
  morningStarSignInURL,
  signInWithMorningStar,
} from '../src/auth/morningStar';

const origin = 'https://editor.example.test';
const editorURL = origin + '/editor';
const signInURL = origin + '/morningstar-sign-in';

test('only an explicit HTTPS sign-in page on the editor origin enables MorningStar', () => {
  assert.equal(morningStarSignInURL(editorURL, signInURL)?.href, signInURL);
  for (const url of [
    undefined,
    editorURL,
    'https://other.example.test/morningstar-sign-in',
    'https://user@editor.example.test/morningstar-sign-in',
    signInURL + '?next=https://elsewhere.example.test',
    signInURL + '#value',
    'http://editor.example.test/morningstar-sign-in',
  ]) assert.equal(morningStarSignInURL(editorURL, url), undefined);
});

test('only the active editor can confirm a sign-in after the expected pop-up responds', () => {
  const browser = new EventTarget();
  const reports: string[] = [];
  const requests: unknown[] = [];
  const popup = { closed: false, close() { this.closed = true; }, postMessage() {} };
  const editor = {
    postMessage(data: unknown, target: string) {
      assert.equal(target, origin);
      requests.push(data);
    },
  };
  const requestId = crypto.randomUUID();
  const runtime = Object.assign(browser, {
    open: () => popup,
    crypto: { randomUUID: () => requestId },
    setTimeout: () => 1, clearTimeout() {},
    setInterval: () => 2, clearInterval() {},
  }) as unknown as Window;
  function send(source: unknown, type: string, extras: Record<string, unknown> = {}, responseOrigin = origin) {
    browser.dispatchEvent(Object.assign(new Event('message'), {
      source,
      origin: responseOrigin,
      data: { protocol: morningStarProtocol, type, requestId, ...extras },
    }));
  }
  const cancel = signInWithMorningStar(
    runtime, new URL(signInURL), () => editor as unknown as Window,
    (status) => reports.push(status),
  );
  assert.ok(cancel);
  send(editor, 'session-status', { signedIn: true });
  send(popup, 'sign-in-complete', {}, 'https://other.example.test');
  send({ ...popup }, 'sign-in-complete');
  assert.equal(requests.length, 0);
  send(popup, 'sign-in-complete');
  assert.equal(requests.length, 0);
  send(popup, 'popup-ready');
  send(popup, 'sign-in-complete');
  assert.deepEqual(requests, [{ protocol: morningStarProtocol, type: 'check-session', requestId }]);
  send(editor, 'session-status', { requestId: crypto.randomUUID(), signedIn: true });
  send(popup, 'session-status', { signedIn: true });
  assert.deepEqual(reports, []);
  send(editor, 'session-status', { signedIn: true });
  assert.deepEqual(reports, ['signed-in']);
  assert.equal(popup.closed, true);
  send(editor, 'session-status', { signedIn: true });
  assert.deepEqual(reports, ['signed-in']);
});

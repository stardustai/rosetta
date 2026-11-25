export const morningStarProtocol = 'rosetta:morningstar:1';

export function morningStarSignInURL(editor?: string, signIn?: string) {
  if (!editor || !signIn) return;
  try {
    const editorURL = new URL(editor);
    const url = new URL(signIn);
    if (
      url.protocol === 'https:' &&
      url.origin === editorURL.origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname !== editorURL.pathname
    )
      return url;
  } catch {
    // An unconfigured or invalid endpoint leaves email sign-in available.
  }
}

type SignInResult = 'signed-in' | 'failed' | 'cancelled';

export function signInWithMorningStar(
  browser: Window,
  url: URL,
  editor: () => Window | null | undefined,
  report: (result: SignInResult) => void,
) {
  const requestId = browser.crypto.randomUUID();
  const popup = browser.open(url.href, '_blank', 'popup,width=560,height=720');
  if (!popup) return;
  let frame: Window | null | undefined;
  let started = false;
  let checking = false;
  let finished = false;

  function clean() {
    if (finished) return;
    finished = true;
    browser.removeEventListener('message', onMessage);
    browser.clearInterval(poll);
    browser.clearTimeout(timeout);
    if (!popup?.closed) popup?.close();
  }
  function finish(result: SignInResult) {
    clean();
    report(result);
  }
  function onMessage(event: MessageEvent) {
    if (
      event.origin !== url.origin ||
      event.data?.protocol !== morningStarProtocol
    )
      return;
    const { type, requestId: responseId } = event.data;
    if (event.source === popup && !started && type === 'popup-ready') {
      started = true;
      popup?.postMessage(
        { protocol: morningStarProtocol, type: 'sign-in', requestId },
        url.origin,
      );
      return;
    }
    if (!started || responseId !== requestId) return;
    if (event.source === popup && !checking) {
      if (type === 'sign-in-failed') finish('failed');
      if (type === 'sign-in-complete') {
        frame = editor();
        if (!frame) {
          finish('failed');
          return;
        }
        checking = true;
        frame.postMessage(
          { protocol: morningStarProtocol, type: 'check-session', requestId },
          url.origin,
        );
      }
    } else if (
      checking &&
      event.source === frame &&
      frame === editor() &&
      type === 'session-status'
    ) {
      finish(event.data.signedIn === true ? 'signed-in' : 'failed');
    }
  }

  browser.addEventListener('message', onMessage);
  const poll = browser.setInterval(() => {
    if (popup.closed && !checking) finish('cancelled');
  }, 300);
  const timeout = browser.setTimeout(() => finish('failed'), 5 * 60 * 1000);
  return clean;
}

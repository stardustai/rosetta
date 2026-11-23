# Iframe language control

The host and editor use `en-US` (English), `zh-CN` (Simplified Chinese), `de-DE` (German), and `ja-JP` (Japanese). English is the default. Language updates travel through the existing origin-checked MessageChannel connection.

## Set an initial language

```tsx
configureRosetta({
  frameURL: 'https://annotation.example.com/',
  language: 'en-US',
});

<RosettaAnnotation input={input} language="en-US" />;
```

The `language` prop takes precedence for that editor instance. If it is omitted, the client follows the shared i18next language. The host workspace's selector uses this shared instance.

The initial iframe URL includes `lng=en-US`, `lng=zh-CN`, `lng=de-DE`, or `lng=ja-JP`. The same value is supplied in the first `FrameInput`:

```ts
interface FrameInput {
  input: PublicAnnotationInput;
  index: number;
  view: 'annotation' | 'operators' | 'algorithms';
  taskId: string;
  language?: 'en-US' | 'zh-CN' | 'de-DE' | 'ja-JP';
}
```

## Apply a live update

The editor exposes a separate method:

```ts
interface FrameEditor {
  setLanguage?(language: 'en-US' | 'zh-CN' | 'de-DE' | 'ja-JP'): Promise<void>;
}
```

The client calls this method when its selected language changes. It keeps the same iframe and input. A language update must update translations and component locales without recreating the annotation store. Do not route locale-only updates through `updateInput`; older editors reset their active model in that method.

The annotation service in `packages/rosetta-annotation` implements the method, restores its UI translation resources, refreshes translated observer components, and updates its frame controls. Its authentication requests send the selected locale as `Accept-Language`.

Older editors can omit `setLanguage`. They keep their connection, but live language control is unavailable until their service is updated.

## Deployment

Set `VITE_ANNOTATION_URL` before building the frontend when the service is available. Until then, production builds show a connection notice in place of the editor.

Add the frontend's origin to the annotation service's `VITE_HOST_ORIGINS`. The connection validates the parent origin, channel, and iframe instance; language control uses that connection rather than an unrestricted window-message listener.

## MorningStar sign-in

Leave `VITE_MORNINGSTAR_SIGN_IN_URL` unset until the editor and the identity service support the exchange. Set it to a dedicated HTTPS page on the same origin as `VITE_ANNOTATION_URL`, without a query string or fragment. GitHub Pages deployments can supply it as an Actions variable. Deploy the workspace and editor with browser cookie settings that allow the editor's normal embedded session to work. Permit the known workspace origin in the editor and retain the opener relationship for the sign-in window.

The sign-in control runs in the annotation workspace. It keeps the mounted editor and current draft in place. The browser messages outlined below carry protocol `rosetta:morningstar:1` and use exact target origins. The workspace checks the origin, source window and request ID on replies. The editor must validate the workspace origin and exact opener or parent before processing the request.

| Sender | Type | Data and action |
| --- | --- | --- |
| Editor sign-in window | `popup-ready` | Tell the workspace that the sign-in window is ready. |
| Workspace | `sign-in` | Send a fresh `requestId` to the sign-in window. |
| Editor sign-in window | `sign-in-complete` or `sign-in-failed` | Echo `requestId`. The window reports completion after exchanging the platform confirmation for the editor session. |
| Workspace | `check-session` | Send `requestId` to the mounted editor iframe. |
| Editor iframe | `session-status` | Echo `requestId` and return a boolean `signedIn` after reloading the authenticated session through the editor API. |

The identity exchange uses the editor's existing browser identity. The workspace never receives platform credentials, the editor's cookie or its completion key. A sign-in window's reply alone does not change the workspace to the signed-in state. Email sign-in remains available in the editor.

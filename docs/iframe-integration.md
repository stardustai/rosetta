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

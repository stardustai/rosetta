# Iframe integration

[`EditorFrame.tsx`](../src/annotation/EditorFrame.tsx) renders the annotation, operator, and algorithm views. [`connectFrame.ts`](../src/annotation/connectFrame.ts) checks the iframe's origin, window, channel, and instance before opening the two MessagePorts. The same connection carries annotation data, files, draft recovery, and save callbacks.

[`frame-v1.ts`](../src/annotation/contracts/frame-v1.ts) is the checked-in copy of the `rosetta-frame-v1` protocol maintained in `annotation-api/apps/annotation/src/contracts`. The adjacent [schema directory](../src/annotation/schema/) contains the supported annotation types and validation code from Rosetta's pinned schema. Run `pnpm sync:annotation-contract /path/to/annotation-tool` from the private repository to regenerate both. A tool checkout can install and build using its own lockfile and these files.

## Language

The host supports English, Simplified Chinese, German, and Japanese. The iframe component follows the tool's language by default. An explicit `language` prop takes precedence for that instance.

The host adds `lng` to the initial iframe URL and sends the locale in `FrameInput.language`. Once connected, the host calls `FrameEditor.setLanguage` for language-only updates so the active input and draft stay open. The private annotation app currently displays English and Simplified Chinese. It falls back to English for German and Japanese.

## Deployment

Set `VITE_ANNOTATION_URL` when building the tool. A build without this setting displays a connection notice where the editor would appear.

Add the tool's origin to the private annotation app's `VITE_HOST_ORIGINS`. For authentication and save reporting, configure the annotation site to serve its API under the same origin.

# Public annotation client

The bundled client forwards the selected locale in `FrameInput.language` on initialization and input updates. Its initial iframe URL also includes `lng=en-US`, `lng=zh-CN`, `lng=de-DE`, or `lng=ja-JP`. Switching languages keeps the iframe connected and preserves the active workspace.

The separately deployed annotation service must consume `FrameInput.language` and implement `FrameEditor.setLanguage` to update its own translations and send the same `Accept-Language` header with authentication and annotation API requests. Older services can continue to use the protocol, but will not apply live language updates.

Host connection errors and iframe titles use the host i18next instance. Install the bundled archive with `pnpm install --frozen-lockfile`.

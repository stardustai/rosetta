# Development choices

The workspace uses pnpm 12.21.0 and Tailwind CSS 4.3.5. `package.json` pins the package manager; `pnpm-lock.yaml` records dependency versions. Run `pnpm install --frozen-lockfile` for a checkout or CI build.

## Existing libraries

| Work                                                          | Implementation                                 |
| ------------------------------------------------------------- | ---------------------------------------------- |
| Layout, spacing, typography, breakpoints, and theme utilities | Tailwind CSS through `@tailwindcss/vite`       |
| Forms, tables, dialogs, and menus                             | Ant Design                                     |
| Task routes and navigation                                    | React Router |
| Async request ordering and cancellation                       | `ahooks/useRequest`                            |
| Remote input requests                                         | ky                                             |
| Translation resources and interpolation                       | i18next                                        |
| IndexedDB access                                              | idb and idb-keyval                             |
| Local file selection and drag-and-drop                        | file-selector and react-dropzone               |
| JSON editing                                                  | CodeMirror                                     |
| OSS, OBS, and TOS access and signing                          | The providers' SDKs                            |
| Annotation rendering                                          | The separate Rosetta iframe service            |

Use these dependencies when adding a feature that fits their APIs. Browser APIs handle URLs, date and number formatting, cancellation signals, and cross-tab notifications.

## Styles

Put ordinary layout and typography utilities in `className`. `src/style.css` contains the Tailwind entry, workspace theme variables, and selectors that adapt Ant Design or the embedded editor. Those selectors use `@apply` for shared utilities. Light and dark workspace colors are defined once through the `workspace-*` theme tokens.

Keep responsive rules with the component they affect. Check the task list, import dialog, and sidebar at desktop and narrow widths after layout changes.

## Application rules

Task migrations, IndexedDB transactions, export destinations, iframe save receipts, and annotation formats encode this application's data contract. Change those rules with tests for existing saved data. The iframe component and host transport live in `src/annotation`. The [iframe guide](iframe-integration.md) describes the versioned contract and its generated files.

The OBS and TOS axios override lives in `pnpm-workspace.yaml`. Its catalog entry supplies both the direct dependency and the SDK overrides. Keep the legacy TOS error-factory alias until the SDK removes that import.

## Checks

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run test:render
pnpm run build
```

The GitHub workflow uses the same package manager and lockfile. Pages still needs its repository setting enabled before publishing.

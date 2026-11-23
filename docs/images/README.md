# Screenshot notes

**English** | [简体中文](README.zh-CN.md) | [Deutsch](README.de-DE.md) | [日本語](README.ja-JP.md)

The English (`*-en.jpg`) and Chinese (`*-zh.jpg`) screenshots were captured on 18 November 2026. The German (`*-de.jpg`) and Japanese (`*-ja.jpg`) sets were captured on 23 November 2026 from the running frontend and annotation iframe. Each language was selected through the app's language control. The images are unedited browser screenshots.

The German and Japanese capture used a separate documentation origin, `http://127.0.0.1:4194`, with the real annotation service on port 4195 and the account API using an empty temporary database on port 4197. Existing tasks and accounts were not used. The editor shows the guest state. No sign-in email was sent, no export was delivered, and no storage connection was created.

The image views use the bundled `public/examples/street.svg`. The German and Japanese import previews were created by pasting a `PublicAnnotationInput` JSON document into the import dialog. Its two records refer to the included `entities.de-DE.txt` or `entities.ja-JP.txt` and `street.pcd` over HTTP on the documentation origin. The resulting tasks were created through the same dialog. The Japanese task-list view searches for `サンプル` to show its two example tasks.

The older English and Chinese import views use local `entities.txt` and `street.pcd` files. No account credentials or storage keys are shown in any language. The export destination is `https://example.com/api/tasks/{taskId}/annotations`, an example value that was not used to send data. Storage credential fields are empty.

| File               | View                                                       |
| ------------------ | ---------------------------------------------------------- |
| `01-start-*.jpg`   | Start page and example selection                           |
| `02-import-*.jpg`  | Task creation preview; German and Japanese use JSON input  |
| `03-tasks-*.jpg`   | Task list with text and point-cloud examples               |
| `04-tools-*.jpg`   | Image tools with the data preview expanded                 |
| `05-editor-*.jpg`  | Image annotation workspace                                 |
| `06-export-*.jpg`  | API export settings                                        |
| `07-storage-*.jpg` | New object-storage connection with credential fields empty |

To refresh a view, run the frontend with an actual annotation service, follow the corresponding README section, select the language, and capture the loaded page. Keep the screenshots as captured and update these notes when the samples or workflow change.

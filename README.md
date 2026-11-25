# Rosetta Annotation Tool

**English** | [简体中文](README.zh-CN.md) | [Deutsch](README.de-DE.md) | [日本語](README.ja-JP.md)

A browser workspace for annotating images, point clouds, video, audio, and text. Import files, configure labels, keep track of tasks, and export the saved results as JSON.

![The image annotation workspace](docs/images/05-editor-en.jpg)

The workspace stores tasks and local files in your browser. The annotation editor runs in a separate iframe service. Your site administrator supplies that service's address. Without a connected service, you can still import files, manage tasks, and export saved data.

## Before you start

Use a current desktop browser. Keep your original files and download your results when you finish a batch. Clearing this site's browser storage removes its local tasks, files, and saved connections. Opening the site in another browser does not bring those tasks with you.

The interface opens in English. Use the selector in the top-right corner to switch to Chinese, German, or Japanese. The annotation page has the same selector at the top-left. The setting is remembered in this browser and applied to the embedded editor.

## Try the included image example

1. Open **Start annotating** in the sidebar.
2. Under **Example data**, choose **Image object annotation**. The street scene is included with the app; you do not need to upload a file.
3. Choose **View data and files** to check the image and its file reference.
4. The **Annotation tools** tab contains three starting labels: Rectangle, Polygon, and Keypoint. Keep them for this first task.
5. Choose **Save as task** on this setup page if you want to return to the example from the task list. Then choose **Start annotating**. Allow the new tab if your browser blocks it.

![Choose an example or import your own files](docs/images/01-start-en.jpg)

The **3D point cloud annotation** and **Text entity annotation** examples follow the same route. The point cloud example uses the included road scene. The text example contains a short travel note.

## Configure your labels

The setup page puts tool configuration and data preview together. Expand **View data and files** when you need to check which file you are configuring.

![Default image tools beside the data preview](docs/images/04-tools-en.jpg)

Select an existing annotation item to edit its label and available fields. Use the tool controls on the left to add the shapes or attributes your task needs. An image task might use boxes for vehicles and points for landmarks. Start with only the labels you plan to use.

For an existing task, open its name in **Task management**, then choose **Configure annotation tools**. Edits are saved to that task. The language selector supports English (default), Chinese, German, and Japanese. Changing the interface language keeps your own label names and task names as you entered them.

## Make and save an annotation

In the annotation tab, the tools are on the left, the data is in the center, and the object list is on the right.

For the image example, select **2D box** or press **2**, then draw a box around a vehicle. Use **Select** or **1** to select an object and adjust it. **Polygon** and **Point** are available as **3** and **4** in this example. The numbers displayed beside each tool are the shortcuts for the current configuration.

Choose **Save** at the bottom-right when you want to store the annotation result. The **Save as task** button on the setup page creates a task; it does not replace saving your edits in the editor.

Saving and exporting from the editor require email sign-in and a valid license. When prompted:

1. Enter your email address and choose **Get verification code**.
2. Enter the six-digit code from the email and sign in. The email also contains your license.
3. The license is activated after sign-in. If necessary, open **License** and paste the license from that email.
4. Return to the editor and choose **Save** again. In the task list, check **Last saved** before moving on.

Viewing data and configuring tasks are available without signing in. Your administrator runs the email and license service separately from this frontend.

## Import your own files

For a few files, use **Select files** or **Select folder** on the start page. For a batch you want to track as tasks, open **Task management → New task / batch create**.

![Review a batch before creating tasks](docs/images/02-import-en.jpg)

In the import window:

1. Choose **Local files**, then **Select multiple files** or **Select parent folder**. You can also drop files into the window.
2. Leave **One task per file** selected for independent files.
3. For point cloud or image sequences, put the frames in the same folder, choose the parent folder, and select **Consecutive frames in the same directory**. Subfolders are handled separately.
4. Review the task names. Clear the checkbox for any item you do not want to import. Add shared annotation instructions if the batch needs them.
5. Choose **Create tasks**. Open a task name to review its data, configure its tools, or enter the editor.

Supported local extensions:

| Data               | Extensions                               |
| ------------------ | ---------------------------------------- |
| Images             | `.png`, `.jpg`, `.jpeg`, `.bmp`, `.webp` |
| Point clouds       | `.pcd`, `.ply`                           |
| Audio              | `.mp3`, `.wav`, `.ogg`, `.m4a`           |
| Video              | `.mp4`, `.webm`, `.mov`                  |
| Text and documents | `.txt`, `.md`, `.html`, `.pdf`, `.docx`  |

An accepted extension does not guarantee that every browser can decode that file's codec or document contents. Unsupported, hidden, and empty files are listed as ignored during import. Local SVG uploads are not accepted; the built-in image example uses its own bundled SVG reference.

Use the **JSON / JSONL** tab when you already have a `PublicAnnotationInput` JSON document or `DataRecord` JSONL file. The importer splits multiple data records into separate tasks and keeps the supplied tools and saved results.

## Find your work in the task list

![Tasks after importing a text file and a point cloud](docs/images/03-tasks-en.jpg)

Each row represents one data item or one frame sequence. Use the search box to find a task by name, instructions, or source. The tabs filter tasks by progress.

- **To annotate** means the task has no confirmed submission yet.
- **In progress** means work has started and the task is not complete.
- **Completed** means its data has a confirmed saved result.

Open a task name to see its details. Use the row's **Actions** menu to edit the name and instructions, export its saved data, or delete it. Deleting a task also removes its annotation results from this browser, so export anything you need to keep first.

## Export saved results

Save your edits in the editor before exporting. The task export contains the result last saved to that task.

Open **Export settings**, choose a destination, and save the settings. Then return to a task and choose **Export** from its details or **Actions** menu.

![API export settings](docs/images/06-export-en.jpg)

| Method         | What to configure                                                   | What happens                                                                  |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Local download | No destination required                                             | A JSON file downloads to your device.                                         |
| API            | A complete HTTP(S) URL, POST or PUT, and any authentication headers | The app sends `PublicAnnotationInput` JSON. A 2xx response confirms delivery. |
| Object storage | A saved OSS, OBS, or TOS data source and a directory prefix         | The app uploads task JSON with a new filename.                                |

API URLs support `{taskId}`, for example `https://example.com/api/tasks/{taskId}/annotations`. Add `Authorization` or other headers if your receiver requires them. The receiver must allow requests from this site's origin through CORS.

Exports contain file references, tool configuration, and saved annotations. They do not bundle the original images, point clouds, audio, or video. Keep those original files. A `local://` reference points to data in the browser that imported it; sending the JSON to someone else does not transfer that file.

## Read data from object storage

Open **Data sources → New data source**.

![Add an object storage connection](docs/images/07-storage-en.jpg)

Choose OSS, OBS, or TOS, then enter the bucket, region, and access credentials. Use **Starting directory** to restrict the directory you will browse. Leave **Endpoint** empty when the provider's regional default is correct. Temporary credentials also need a security token.

Choose **Test connection**, then **Save data source**. In the task import window, select **Object storage**, choose the connection and directory, and choose **Read directory to build list**. Review the resulting task list before creating it.

The credentials need list and read access. Bucket CORS must allow GET and HEAD from the workspace and annotation origins. Exporting to a bucket also needs PutObject permission and PUT access from the workspace origin. Saved connection credentials stay in this browser; they are not included in task exports.

## Run the frontend locally

Install Node.js 22.13+ on the 22.x release line, or Node.js 24+, and [pnpm 12.21.0](https://pnpm.io/installation). The package manager version is pinned in `package.json`.

```sh
git clone https://github.com/stardustai/rosetta.git
cd rosetta
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

Open [http://127.0.0.1:4174](http://127.0.0.1:4174). If you have an annotation service, set its address in `.env.local`:

```dotenv
VITE_ANNOTATION_URL=https://annotation.example.com/
```

Restart the development server after changing the environment file. During local development, the default annotation address is `http://127.0.0.1:4175/`. The service on that port is installed and started separately.

## Deploy to GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) checks types, runs the unit and iframe integration tests, builds the app, and publishes successful pushes to `main`. Pull requests run the checks without publishing. You can also start the workflow manually.

1. In repository **Settings → Pages**, choose **GitHub Actions** as the build source. A repository owner or someone who can manage Pages settings must enable this once.
2. Push your changes to `main`.
3. When the annotation service is ready, add a repository **Actions variable** named `VITE_ANNOTATION_URL` with its public HTTPS address. Run the workflow again.
4. Add the Pages site's origin to the annotation service's `VITE_HOST_ORIGINS`. Use the origin without the repository path.

The frontend can be published before the annotation service is ready. It shows a connection notice in place of the editor until you configure the address. The API and annotation service are hosted separately. For iframe email authentication, use domains and cookie settings that support the API's SameSite requirements.

The workflow handles the `/repository/` base path and direct links to app routes. For another static host, set `VITE_BASE_PATH` as needed and serve `index.html` for app routes.

## When something does not open

| What you see                          | What to check                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| “Annotation service is not connected” | Set `VITE_ANNOTATION_URL` and rebuild the site after the service is deployed.             |
| A connection error inside the editor  | Check the service address, HTTPS, and the service's allowed host origins.                 |
| The annotation tab does not open      | Allow pop-ups for this site, then choose Start annotating again.                          |
| “Local file is missing”               | Reimport the file in the same browser and site. Check whether browser data was cleared.   |
| An empty batch import                 | Check the supported extensions above and whether the files contain data.                  |
| Object storage access is denied       | Check the bucket, region, credential expiry, directory permissions, and CORS.             |
| An export has no new annotations      | Save in the editor first, then export the saved task.                                     |
| Email sign-in fails in an iframe      | Ask the administrator to check the API, SMTP, allowed origins, and browser cookie policy. |

## Development

```sh
pnpm run typecheck
pnpm test
pnpm run test:render
pnpm run build
```

Build output is written to `dist/`. With a local development server running, `pnpm run test:server` checks the entry point and example files.

UI translations use English source messages in `src/messages.ts`. The iframe host and versioned data contract live in [`src/annotation`](src/annotation/). Local and production builds use the checked-in protocol and schema. See [iframe integration](docs/iframe-integration.md) for language control and how to sync changes from `annotation-api`.

The OBS and TOS SDKs use axios 0.35.0 through scoped pnpm overrides in `pnpm-workspace.yaml`. TOS still imports the removed `createError` factory; the Vite alias in `vite.config.ts` supplies that factory using the public `AxiosError` type. The storage transport test runs both real browser SDKs against a local HTTP server to check signed requests, pagination, JSON uploads, and access errors. Keep this alias when updating axios until TOS removes its legacy import.

The screenshots in this guide were captured from the running workspace and annotation service using the included example data. [Capture notes](docs/images/README.md) list the views and samples.

Development libraries and implementation boundaries are listed in [the architecture notes](docs/architecture.md).

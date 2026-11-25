// English source messages and their Simplified Chinese translations.
export const zhCN: Record<string, string> = {
  'Sign in with MorningStar': '使用 MorningStar 登录',
  'MorningStar sign-in confirmed': '已确认 MorningStar 登录',
  'MorningStar sign-in could not be confirmed. Try again.': '未能确认 MorningStar 登录，请重试',
  'The sign-in window closed before sign-in finished.': '登录完成前窗口已关闭',
  'Allow pop-ups to sign in with MorningStar.': '请允许弹出窗口后使用 MorningStar 登录',
  'Annotation service is not connected': '尚未连接标注服务',
  'You can import and manage tasks here. Ask the site administrator to connect the annotation service before editing annotations.':
    '你可以导入数据和管理任务。开始标注前，请联系站点管理员连接标注服务。',
  'The annotation page has exited. Open it again': '标注页面已退出，请重新打开',
  'The annotation service is not ready or has closed':
    '标注服务尚未就绪或已关闭',
  'Cannot connect to the annotation service. Check its URL or try again':
    '无法连接标注服务，请检查标注页面地址或重试',
  'No save handler is configured': '未配置保存入口',
  'No draft recovery handler is configured': '未配置草稿恢复入口',
  'This resource does not belong to the current annotation data':
    '该资源不属于当前标注数据',
  'No file save handler is configured': '未配置文件保存入口',
  'The annotation service connection was interrupted. Open it again':
    '标注服务连接已中断，请重新打开',
  'The annotation page has exited. The draft is saved on this device':
    '标注页面已退出，草稿已保存到本机',
  Reopen: '重新打开',
  'Rosetta annotation workspace': 'Rosetta 标注工作台',
  'Annotation tool configuration': '标注工具配置',
  'Algorithm assistance configuration': '算法辅助配置',
  Language: '语言',
  'Cache failed': '缓存失败',
  'The local cache index is invalid': '本地缓存索引格式不正确',
  'Export failed. Please try again': '导出失败，请重试',
  'Export task': '导出任务',
  'Export settings ↗': '导出设置 ↗',
  Cancel: '取消',
  Done: '完成',
  Export: '导出',
  Task: '任务',
  Files: '文件',
  Data: '数据',
  'records,': '条，',
  'Submission progress is unconfirmed': '提交进度未确认',
  '{{v0}} submitted': '已提交 {{v0}} 条',
  'Export data references, tool configuration, and saved results. Original files are stored separately.':
    '导出数据引用、工具配置和已保存结果。原始文件单独存储。',
  'Local download': '本地下载',
  '(not configured)': '（未配置）',
  'Object storage': '对象存储',
  'Download to this device': '下载到当前设备',
  'The export data source is unavailable. Select it again in export settings.':
    '对象存储目标的数据源不可用，请在导出设置中重新选择。',
  'API accepted the data, HTTP {{v0}}': 'API 已接收，HTTP {{v0}}',
  'Uploaded to object storage': '已上传到对象存储',
  'Download started': '已开始下载',
  'This export file already exists. Check object storage; reopen the export dialog to generate a new filename.':
    '该导出文件已存在，请到对象存储确认结果；重新打开导出窗口可生成新文件名。',
  'Object storage denied the upload. Check the credentials and PutObject permission for the destination directory.':
    '对象存储写入被拒绝，请检查凭证和目标目录的 PutObject 上传权限。',
  'Object storage export failed. Check the network, endpoint, upload permission, and CORS settings allowing PUT requests from this site.':
    '对象存储导出失败，请检查网络、Endpoint、上传权限，以及允许本站 PUT 请求的 CORS 配置。',
  'Configure the API export URL first': '请先配置 API 导出地址',
  'API export failed: HTTP {{v0}}. Check the endpoint and authentication settings':
    'API 导出失败：HTTP {{v0}}，请检查接口和鉴权配置',
  'The API request timed out. Check whether the receiver received the data before retrying':
    'API 请求超时，请确认接收端是否已收到数据后再重试',
  'The API request did not complete. Check the URL, network, and CORS settings':
    'API 请求未完成，请检查地址、网络和接口的跨域配置',
  'Configure the object storage export destination first':
    '请先配置对象存储导出目标',
  'The export data source was deleted. Configure it again':
    '导出数据源已被删除，请重新配置',
  'This data source does not support uploads': '该数据源不支持上传',
  'Unsupported export method': '不支持的导出方式',
  'The API URL only supports the {taskId} placeholder':
    'API 地址只支持 {taskId} 占位符',
  'Enter a complete API URL, such as https://example.com/api/annotations':
    '请输入完整的 API 地址，例如 https://example.com/api/annotations',
  'The API URL must use HTTP or HTTPS. Put authentication information in request headers':
    'API 地址需使用 HTTP / HTTPS，鉴权信息请放在请求头中',
  'Select POST or PUT as the API request method':
    'API 请求方法请选择 POST 或 PUT',
  'Enter a request header name': '请填写请求头名称',
  'Duplicate request header: {{v0}}': '请求头重复：{{v0}}',
  'This header is managed by the browser and cannot be set manually: {{v0}}':
    '该请求头由浏览器管理，不能手动设置：{{v0}}',
  'Invalid request header: {{v0}}': '请求头格式不正确：{{v0}}',
  'The export directory cannot contain ., .., backslashes, or control characters':
    '导出目录不能包含 .、..、反斜杠或控制字符',
  'Select a valid default export method': '请选择有效的默认导出方式',
  'Configure the API URL before making it the default export method':
    '请配置 API 地址后再设为默认导出方式',
  'Select an object storage data source before making it the default export method':
    '请选择对象存储数据源后再设为默认导出方式',
  'The destination data source was deleted. Select it again':
    '目标数据源已被删除，请重新选择',
  'Cannot read local export settings. Check browser storage':
    '无法读取本地导出设置，请检查浏览器存储',
  'Select data to annotate first': '请先选择需要标注的数据',
  'The temporary annotation data has expired. Return to tool configuration and open it again.':
    '临时标注数据已过期，请返回工具配置页重新打开。',
  'Local files': '本地文件',
  'The file is outside the selected parent folder or directory. Select it again':
    '文件不在所选父文件夹或目录内，请重新选择',
  'Duplicate file path: {{v0}}': '文件路径重复：{{v0}}',
  'Selected files': '所选文件',
  'Import data': '导入数据',
  'The file contains no data that can be imported': '文件中没有可创建的数据',
  'JSONL record {{v0}} is missing a valid data type':
    'JSONL 第 {{v0}} 条缺少有效的数据类型',
  'Enter valid PublicAnnotationInput JSON':
    '请输入有效的 PublicAnnotationInput JSON',
  'JSON must contain valid PublicAnnotationInput.taskParams':
    'JSON 需要包含有效的 PublicAnnotationInput.taskParams',
  'JSONL line {{v0}} is not valid JSON': 'JSONL 第 {{v0}} 行不是有效 JSON',
  'JSONL line {{v0}} is missing a valid data type':
    'JSONL 第 {{v0}} 行缺少有效的数据类型',
  'Data {{v0}}': '数据 {{v0}}',
  'The task data migration did not complete. The original data has been preserved':
    '任务数据升级未完成，原数据已保留',
  'Embedded files': '内嵌文件',
  'Text data': '文本数据',
  'Invalid file path': '文件路径不合法',
  'No files to import': '没有可导入的文件',
  'The file is empty: {{v0}}': '文件为空：{{v0}}',
  'The file format does not match the selected data type: {{v0}}':
    '文件格式与所选数据类型不符：{{v0}}',
  'The browser blocked the new page. Allow pop-ups for this site and try again.':
    '浏览器阻止了新页面，请允许本站打开弹出窗口后重试。',
  'The annotation page has closed. Open it again.':
    '标注页面已关闭，请重新打开。',
  'The task data has changed. Refresh the task details and try again.':
    '任务数据已更新，请刷新任务详情后重试。',
  '3D box': '3D框',
  '3D polyline': '3D折线',
  '3D point': '3D点',
  Rectangle: '矩形框',
  Polygon: '多边形',
  Keypoint: '关键点',
  'Audio segment': '音频片段',
  'Text selection': '文本选择',
  'Select data to preview first': '请先选择需要预览的数据',
  'This temporary preview has ended. Select the files again.':
    '这份临时预览已结束，请重新选择文件。',
  'The task data has changed. Reopen the annotation workspace from the configuration page.':
    '任务数据已更新，请从配置页重新打开标注工作台。',
  'No data to save': '没有找到待保存的数据',
  'Point cloud': '点云',
  Image: '图片',
  Audio: '音频',
  Video: '视频',
  'Text / document': '文本/文档',
  Draft: '草稿',
  'To annotate': '待标注',
  'In progress': '标注中',
  Completed: '已完成',
  'Untitled data': '未命名数据',
  'Untitled task': '未命名任务',
  'JSON / example data': 'JSON / 示例数据',
  'No data imported': '未导入数据',
  'No supported images, point clouds, audio, video, or text files were found':
    '没有找到支持的图片、点云、音视频或文本文件',
  'Invalid annotation data location': '标注数据位置无效',
  'The browser has insufficient storage. Import less data at a time':
    '浏览器可用空间不足，请减少本次导入数据量',
  'Import canceled': '已取消导入',
  'The local file is missing. Import it again: {{v0}}':
    '本地文件不存在，请重新导入：{{v0}}',
  'Each task must contain exactly one data item. Use batch creation to split the data':
    '每个任务必须且只能包含一条数据，请使用批量创建拆分数据',
  'This local annotation task was deleted. Return to the task list':
    '本地标注任务已被删除，请返回任务列表',
  'This local annotation task does not exist. Reopen it from the annotation tool':
    '本地标注任务不存在，请返回独立标注工具重新打开',
  'Task data or tool configuration has changed. Refresh this page to continue. Existing results have been preserved.':
    '任务数据或工具配置已更新，请刷新当前页面后继续。已有结果已保留。',
  'Add at least one task': '请至少添加一个任务',
  'Enter a task name': '请输入任务名称',
  'Task names cannot exceed 100 characters': '任务名称不能超过 100 个字符',
  'Task instructions cannot exceed 2,000 characters':
    '任务说明不能超过 2000 个字符',
  'Each data task must contain exactly one item. Split the data before importing':
    '每条数据任务必须且只能包含一条数据，请按单条数据拆分后导入',
  'Import data into the task first': '请先为任务导入数据',
  'Invalid annotation data location. Existing results were preserved':
    '标注数据位置无效，未覆盖已有结果',
  'Annotation draft segmentation data': '标注草稿分割数据',
  'Each task contains one data item. Select a valid data task':
    '每条任务只包含一条数据，请选择有效的数据任务',
  'Failed to read resource: HTTP {{v0}}': '资源读取失败：HTTP {{v0}}',
  'Failed to save the data source. Try again': '保存数据源失败，请重试',
  'Connected, but saving locally failed. Check browser storage or clear “Save connection on this device” and try again.':
    '连接成功，但保存到本机失败。请检查浏览器可用空间，或取消“保存连接到本机”后重试。',
  'Saved connections': '已保存连接',
  'Select a saved connection': '选择已保存的连接',
  'Delete this locally saved connection?': '删除本机保存的连接？',
  'Failed to delete the connection. Try again.': '删除连接失败，请重试。',
  'Delete connection': '删除连接',
  'Data source name': '数据源名称',
  'Connection name (optional)': '连接名称（可选）',
  'Enter a data source name': '请输入数据源名称',
  'For example, training set / test data': '例如 训练集 / 测试数据',
  'Enter the bucket name': '请输入 Bucket 名称',
  'For example, my-annotation-data': '例如 my-annotation-data',
  'Enter the bucket region': '请输入 Bucket 所在地域',
  'Endpoint (optional; generated from the region by default)':
    'Endpoint（可选，默认按地域生成）',
  'Enter the access key ID': '请输入 AK',
  'Enter the secret access key': '请输入 SK',
  'Security token (for temporary credentials)':
    'Security Token（临时凭证时填写）',
  'Leave blank for permanent access keys': '使用长期 AK/SK 时留空',
  'Starting directory (optional)': '起始目录（可选）',
  'For example, dataset/scene-01/': '例如 dataset/scene-01/',
  'Save connection on this device (including access keys and token)':
    '保存连接到本机（包含 AK / SK 和 Token）',
  'Connection details are stored in this browser. Testing checks read permission for the starting directory.':
    '连接信息保存在此浏览器。测试连接会检查起始目录的读取权限。',
  'Saved connections can be reused in this browser. The connection needs list and read permissions, plus GET and HEAD CORS configuration.':
    '保存后可在此浏览器复用。连接需要目录列举、文件读取权限，以及 GET、HEAD 跨域配置。',
  'Connected. The directory is readable': '连接成功，目录可以读取',
  'Test connection': '测试连接',
  'Save data source': '保存数据源',
  'Connect and read directory': '连接并读取目录',
  'Select data within the starting directory specified for this connection.':
    '请在连接时指定的起始目录内选择数据。',
  'Reading canceled': '已取消读取',
  'Imported {{v0}} cloud files and created {{v1}} data items{{v2}}':
    '已导入 {{v0}} 个云端文件，生成 {{v1}} 条数据{{v2}}',
  ', ignored {{v0}} non-annotation files': '，忽略 {{v0}} 个非标注文件',
  Directory: '目录',
  'Current task': '当前任务',
  'Task data': '任务数据',
  'Local annotation task': '本地标注任务',
  'Object storage:': '对象存储:',
  'Import from object storage': '从对象存储导入',
  'Cancel reading': '取消读取',
  'Import and configure annotation tools': '导入并配置标注工具',
  'Change connection': '更换连接',
  'Parent directory': '上一级',
  'Object storage directory': '对象存储目录',
  'Directory prefix; leave blank for the bucket root':
    '目录前缀，留空为 Bucket 根目录',
  'Open directory': '打开目录',
  'This directory is empty or has no files that can be listed':
    '此目录为空，或没有可列出的文件',
  Name: '名称',
  Size: '大小',
  'Load more': '加载更多',
  'Include subdirectories': '包含子目录',
  'Group point clouds / images in each directory into consecutive frames':
    '点云 / 图片按目录组成连续帧',
  'Cloud files are read on demand after you select a directory. The entire directory is not downloaded in advance. Import different data types from their respective subdirectories.':
    '选择目录后按需读取云端原始文件，不会预先下载整个目录。多种数据类型请分别进入对应子目录。',
  'Reading directory, found': '正在读取目录，已发现',
  'files…': '个文件…',
  "Select a directory within the data source's starting directory":
    '请在数据源的起始目录内选择',
  'Repeated directory pagination token. Open the directory again':
    '目录分页标记重复，请重新打开目录',
  'Change data source': '更换数据源',
  'This directory is empty': '当前目录为空',
  'This data source was deleted. Select another data source':
    '这个数据源已被删除，请选择其他数据源',
  'Select a saved data source': '选择已保存的数据源',
  'Select data source': '选择数据源',
  'Open data source': '打开数据源',
  'Use a new connection': '使用新连接',
  'Manage data sources': '管理数据源',
  'Back to saved data sources': '返回已保存的数据源',
  'Object storage returned an incomplete file list without a next-page token':
    '对象存储返回了未完成的文件列表，但没有下一页标记',
  'OBS upload failed': 'OBS 上传失败',
  'OBS request failed': 'OBS 请求失败',
  'Temporary credentials are expired or invalid. Reconnect to object storage.':
    '临时凭证已过期或无效，请重新连接对象存储。',
  'Signature verification failed. Refresh and try again. If the problem persists, verify the access key pair, region, endpoint, and temporary security token.':
    '签名校验失败，请刷新页面后重试；若仍失败，请核对 AK/SK 是否配对、Region 和 Endpoint 是否对应，以及临时凭证的 Token。',
  'Access denied. Check the access keys, region, and list and read permissions for this directory.':
    '访问被拒绝，请检查 AK/SK、Region，以及此目录的列举和读取权限。',
  'The bucket or file does not exist. Check the bucket and endpoint.':
    'Bucket 或文件不存在，请检查 Bucket 和 Endpoint。',
  'Cannot read object storage. Check the network, endpoint, credentials, and bucket CORS settings allowing GET and HEAD from this site.':
    '无法读取对象存储，请检查网络、Endpoint、凭证，以及 Bucket 的 CORS 设置（允许当前站点的 GET、HEAD）。',
  'Object storage returned files outside the selected directory. Reconnect':
    '对象存储返回了所选目录之外的文件，请重新连接',
  'Object storage repeated a pagination token. Reading stopped. Reconnect':
    '对象存储的分页标记重复，已停止读取，请重新连接',
  'The directory contains no supported files. Use PCD/PLY, images, audio, video, or text/documents.':
    '目录内没有可标注的文件，支持 PCD/PLY、图片、音视频和文本/文档。',
  'The directory contains multiple data types. Import them from separate subdirectories; use JSON/JSONL for multisensor associations.':
    '目录包含多种数据类型，请进入对应子目录分别导入；多传感器关联请使用 JSON/JSONL 描述。',
  'Invalid object storage path encoding': '对象存储路径编码不正确',
  'Select OSS, OBS, or TOS': '请选择 OSS、OBS 或 TOS',
  'Enter a valid bucket name': '请填写正确的 Bucket 名称',
  'Enter a valid region': '请填写正确的 Region',
  'Invalid endpoint. Enter a complete http:// or https:// service domain':
    'Endpoint 格式不正确，请填写完整的 http:// 或 https:// 服务域名',
  'The endpoint must contain only the service domain, such as https://oss-cn-hangzhou.aliyuncs.com':
    'Endpoint 只填写服务域名，例如 https://oss-cn-hangzhou.aliyuncs.com',
  'Enter the access key ID and secret access key':
    '请填写 AccessKey ID 和 Secret AccessKey',
  'Invalid object storage path': '对象存储路径不正确',
  'Connect to {{v1}} on {{v0}} first to read cloud files.':
    '请先连接 {{v0}} 的 {{v1}}，以读取云端文件。',
  'The data source was deleted. Refresh the list and try again':
    '数据源已被删除，请刷新列表后重试',
  'This bucket already has a saved data source. Edit the existing data source':
    '该 Bucket 已有保存的数据源，请编辑已有数据源',
  'Alibaba Cloud OSS': '阿里云 OSS',
  'Huawei Cloud OBS': '华为云 OBS',
  'Volcengine TOS': '火山引擎 TOS',
  'Cannot read local data sources. Check browser storage':
    '无法读取本地数据源，请检查浏览器本地存储',
  'Annotation data was not found. Reopen it from the task list':
    '没有找到标注数据，请从任务列表重新打开',
  'Switch annotation data': '切换标注数据',
  'Submit the current annotation before switching tasks.':
    '请先提交当前标注，再切换任务。',
  'Switch data': '切换数据',
  'The task has not finished loading. Try again later':
    '任务尚未加载完成，请稍后重试',
  'Back to tool configuration': '返回工具配置',
  'Back to task list': '返回任务列表',
  'Data annotation': '数据标注',
  'Task annotation': '任务标注',
  'Opening annotation data': '正在打开标注数据',
  'Opening task': '正在打开任务',
  'Saving results…': '正在保存结果…',
  'Last submitted {{v0}}': '上次提交 {{v0}}',
  'Annotation results are saved after submission': '标注结果在提交后保存',
  'Task list': '任务清单',
  Previous: '上一条',
  Next: '下一条',
  'Update connection · {{v0}}': '更新连接 · {{v0}}',
  'Annotation workspace actions': '标注工作台操作',
  'Update object storage connection': '更新对象存储连接',
  'Connect to the object storage containing your annotation data':
    '连接标注数据所在的对象存储',
  'Select a data source or enter access credentials for this bucket.':
    '选择数据源，或填写该 Bucket 的访问凭证。',
  'Saving. Try again shortly': '正在保存，请稍后重试',
  'Saved {{v0}} tasks': '已保存 {{v0}} 条任务',
  'Save failed. Try again': '保存失败，请重试',
  'Save the annotation before returning to configuration.':
    '返回配置前，请先保存标注。',
  'Back to configuration': '返回配置',
  'Continue annotating': '继续标注',
  'Saving…': '正在保存…',
  'Last saved {{v0}}': '上次保存 {{v0}}',
  'Results are stored in this browser': '结果保存在此浏览器',
  'Save as task': '保存到任务',
  'Export current data': '导出当前数据',
  'Connected to “{{v0}}”. The directory is readable':
    '「{{v0}}」连接成功，目录可以读取',
  'Data sources': '数据源',
  'Save object storage connections to select them when creating tasks.':
    '保存对象存储连接，后续创建任务时直接选择。',
  'New data source': '新建数据源',
  'All data sources': '全部数据源',
  'Search data sources': '搜索数据源',
  'Search by name, bucket, or directory': '搜索名称、Bucket 或目录',
  '{{v0}} data sources': '共 {{v0}} 个数据源',
  '/page': '条/页',
  'No matching data sources': '没有匹配的数据源',
  'No saved data sources yet': '还没有保存的数据源',
  'Add an OSS, OBS, or TOS connection to reuse it later.':
    '添加 OSS、OBS 或 TOS 连接，后续直接选择使用。',
  Type: '类型',
  'Bucket / starting directory': 'Bucket / 起始目录',
  'Bucket root': 'Bucket 根目录',
  Region: '地域',
  Actions: '操作',
  'Batch create tasks': '批量创建任务',
  Edit: '编辑',
  'Testing…': '正在测试…',
  'Delete data source': '删除数据源',
  More: '更多',
  'Edit data source': '编辑数据源',
  'Data source saved': '数据源已保存',
  Keep: '保留',
  'Local data source configuration deleted': '已删除本机数据源配置',
  'Delete failed. Try again': '删除失败，请重试',
  'Delete the local connection for “': '删除数据源「',
  '”?': '」的本地连接配置？',
  'Settings are stored in this browser': '设置保存在此浏览器',
  'Save settings': '保存设置',
  'Export settings': '导出设置',
  'Choose an export method and enter the destination.':
    '选择导出方式，填写接收地址。',
  'Export settings saved': '导出设置已保存',
  'Export method': '导出方式',
  'Use this as the default export method after saving.':
    '保存后设为默认导出方式。',
  'Download annotation results to this device': '下载标注结果到本机',
  'Download JSON containing data references, tool configuration, and saved results.':
    '下载 JSON，包含数据引用、工具配置和已保存结果。',
  'API export configuration': 'API 导出配置',
  'API export': 'API 导出',
  'Send JSON. Export completes when the endpoint returns HTTP 2xx.':
    '发送 JSON，接口返回 HTTP 2xx 时完成导出。',
  'Request method': '请求方法',
  'Destination URL': '接收地址',
  'Supports the {taskId} placeholder, such as https://example.com/api/tasks/{taskId}/annotations':
    '支持 {taskId} 占位符，例如 https://example.com/api/tasks/{taskId}/annotations',
  'Request headers (optional; for Authorization, X-API-Key, and other authentication)':
    '请求头（可选，用于 Authorization、X-API-Key 等鉴权）',
  'Header name': '请求头名称',
  'For example, Authorization': '例如 Authorization',
  'Header value': '请求头内容',
  'For example, Bearer token': '例如 Bearer token',
  'Delete header': '删除请求头',
  'Add header': '添加请求头',
  'The request body is PublicAnnotationInput JSON. The endpoint must allow cross-origin requests from this site. Authentication headers are stored locally.':
    '请求体为 PublicAnnotationInput JSON。接口需允许本站的跨域请求，鉴权请求头保存在本机。',
  'Object storage export configuration': '对象存储导出配置',
  'Object storage export': '对象存储导出',
  'Select an OSS, OBS, or TOS data source to upload task JSON.':
    '选择 OSS、OBS 或 TOS 数据源，上传任务 JSON。',
  'Destination data source': '目标数据源',
  'Manage connections in Data sources.': '在“数据源”中管理连接。',
  'Export directory': '导出目录',
  'Enter a directory prefix within the bucket. Each export creates a new file.':
    '填写 Bucket 内的目录前缀，每次导出生成新文件。',
  'For example, annotation-results/': '例如 annotation-results/',
  'The credentials must allow PutObject uploads to this directory. Bucket CORS must allow PUT requests from this site.':
    '目标凭证需允许该目录的 PutObject 上传，Bucket 的 CORS 需允许本站的 PUT 请求。',
  'Each task contains one data item. Import batches from the task list':
    '每条任务仅包含一条数据，批量数据请在任务列表中导入',
  'This data has a different type. Return to the task list and import it separately.':
    '当前数据类型不同，请返回任务列表另行导入这条数据。',
  'Import annotation data first': '请先导入标注数据',
  'Data has not finished loading. The current page was kept open':
    '数据尚未加载完成，已保留当前页面',
  'The task changed. Automatic exit was canceled': '任务已切换，已停止自动退出',
  'This task contains one data item. Configure annotation tools here; return to the task list to add or batch import data.':
    '当前任务包含一条数据。在此配置标注工具；添加或批量导入数据请返回任务列表。',
  'Failed to read data': '读取数据失败',
  'Data cleared. Upload it again.': '已清空数据, 请重新上传。',
  'Upload data:': '上传数据:',
  'Upload PublicAnnotationInput': '上传 PublicAnnotationInput',
  'Upload JSONL': '上传 JSONL',
  'Example data': '示例数据',
  'Scene examples': '场景案例',
  'Scene type:': '场景类型:',
  'Scene type': '场景类型',
  Custom: '自定义',
  'Default examples': '默认示例',
  'Example data:': '示例数据:',
  'Default example data': '默认示例数据',
  'Typical scenes:': '典型场景:',
  'Typical scenes': '典型场景',
  'Upload data to automatically match annotation tools':
    '上传数据后自动匹配标注工具',
  'Upload data to configure algorithm assistance': '上传数据后配置算法辅助',
  'Annotation tools': '标注工具',
  'Algorithm assistance': '算法辅助',
  'Failed to save task configuration: {{v0}}': '任务配置保存失败：{{v0}}',
  'Cannot open the annotation page. Try again': '无法打开标注页面，请重试',
  'Saved as a local task': '已保存到本机任务',
  'Change data': '更换数据',
  'Save the current data and annotations before changing data.':
    '更换前请保存当前数据和标注。',
  'Leave the current annotation data?': '离开当前标注数据？',
  'Save as a task first to keep your changes.':
    '请先保存到任务，避免丢失当前修改。',
  'Leave workspace': '离开工作区',
  'Continue editing': '继续编辑',
  'Data cache management': '数据缓存管理',
  records: '条数据',
  ' · {{v0}} tasks saved': ' · 已保存 {{v0}} 条任务',
  'Saving configuration…': '正在保存配置…',
  'Saved · {{v0}}': '已保存 · {{v0}}',
  'Configuration is saved automatically on this device': '配置自动保存到本机',
  'Data has not been saved as a task': '数据尚未保存到任务',
  'Save configuration': '保存配置',
  'Start annotating': '开始标注',
  'Select current data': '选择当前数据',
  'Tool configuration and data preview': '工具配置与数据预览',
  'Collapse data and files': '收起数据与文件',
  'View data and files': '查看数据与文件',
  'Cached at': '缓存时间',
  'Refresh cache': '刷新缓存',
  Refresh: '刷新',
  'Delete cache': '删除缓存',
  Delete: '删除',
  items: '个',
  'Batch cache': '批量缓存',
  Failed: '失败',
  'Clear all': '清空所有',
  Close: '关闭',
  'No cached data': '暂无缓存数据',
  'Data file list': '数据文件列表',
  'File list': '文件列表',
  '{{count}} files': '{{count}} 个文件',
  '{{count}} records': '{{count}} 条数据',
  'No files uploaded yet': '尚未上传文件',
  'Data preview and file list': '数据预览与文件列表',
  'Data preview': '数据预览',
  'Supports rotation, zoom, and 3D annotation': '支持旋转、缩放与三维标注',
  'Open 3D annotation view': '打开 3D 标注视图',
  'Cannot preview this file': '无法预览当前文件',
  'Select data first': '请先选择数据',
  'View in annotation workspace': '在标注视图中查看',
  'Skipped {{v0}} empty or unsupported files':
    '已跳过 {{v0}} 个空文件或不支持的文件',
  'Cannot read files': '无法读取文件',
  'Upload your own data': '上传自己的数据',
  'Local data:': '本地数据:',
  'Select files': '选择文件',
  'Select folder': '选择文件夹',
  'Data preparation guide': '数据准备说明',
  'Drop files here to start annotating': '拖动文件到此处开始标注',
  'Reading files…': '正在读取文件…',
  'Supports images, point clouds, audio, video, and text.':
    '支持图片、点云、音视频和文本。',
  'Auto labeling': '自动标注',
  'OCR / PDF to Markdown': 'OCR,PDF转Markdown',
  'QA pair extraction': 'QA对抽取',
  'Multilingual ASR': '多语种ASR',
  'Interactive object detection and segmentation': '交互式目标检测及分割',
  'Image captioning': '图片描述',
  'Interactive 3D detection': '3D交互式检测',
  '4D lane annotation': '4D车道线标注',
  'SAM segmentation': 'SAM分割算法',
  'Portrait segmentation': '人像分割算法',
  'Small object detection': '小目标检测算法',
  'Autonomous driving': '自动驾驶',
  '4D lanes, curbs, road markings, traffic lights, and topology':
    '4D车道线路沿&路面标识&红绿灯&拓扑关系标注',
  'BEV lane and curb annotation': 'BEV车道线路沿标注',
  'OCC-4D semantic segmentation': 'OCC-4D语义分割标注',
  'OCC-3D consecutive and merged frame semantic segmentation':
    'OCC-3D连续帧合并帧语义分割',
  '2D lane and curb segmentation': '2D车道线路沿分割',
  'Joint 3D and 2D object tracking (driving)': '3D&2D联合目标追踪（行车）',
  '2D obstacle, traffic light, road sign, and road marking tracking':
    '2D障碍物&交通灯&路牌&路面标识追踪',
  '3D panoramic semantic segmentation': '3D全景语义分割',
  '4D BEV parking road marking annotation': '4D BEV泊车路面标识标注',
  '4D drivable area annotation': '4D 可行使区域标注',
  'BEV drivable area segmentation': 'BEV图可行驶区域分割',
  '4D BEV parking space and obstacle tracking': '4D BEV停车位与障碍物追踪',
  'Joint 3D and 2D object tracking (parking)': '3D&2D联合目标追踪（泊车）',
  'BEV object semantic segmentation': 'BEV图目标语义分割',
  'Joint BEV and surround-view fisheye object tracking':
    'BEV图与环视鱼眼图像联合目标追踪',
  'Surround-view fisheye object detection': '环视鱼眼图目标检测',
  'Multimodal large model annotation for data mining':
    '数据挖掘多模态大模型标注',
  'End-to-end decision and control: behavior description and prediction':
    '决策控制端到端-行为描述与预测',
  'DMS behavior detection': 'DMS行为检测',
  'LiDAR and millimeter-wave radar fusion annotation':
    '激光雷达和毫米波雷达融合标注',
  '5R1V fusion annotation': '5R1V融合标注',
  'Ultrasonic radar annotation': '超声波雷达标注',
  'Joint 3D and 2D object tracking (human feedback)':
    '3D&2D联合目标追踪（人类反馈）',
  '3D object detection (vehicles, traffic lights, and road signs)':
    '3D目标检测（车、交通灯和交通牌）',
  'New 4D annotation mode': '新4D模式标注',
  'Smart retail': '智慧零售',
  'Beverage SKU annotation': '饮品SKU标注',
  'Clothing image segmentation': '衣服图像分割',
  'Instant noodle SKU annotation': '方便面SKU标注',
  'Intelligent security': '智能安防',
  'Facial keypoint detection': '人脸关键点检测',
  'Person re-identification (ReID)': '人物区分 - ReID',
  'Human pose estimation and keypoint detection': '人体姿态估计 - 关键点检测',
  'Smart cities': '智慧城市',
  'Remote sensing image semantic segmentation': '遥感图像语义分割标注',
  'Tower-mounted smart camera object detection': '高塔智慧摄像头目标检测',
  'Port object segmentation': '港口目标分割',
  'Transmission tower detection and keypoint annotation':
    '输电塔检测&关键点标注',
  'Smart healthcare': '智慧医疗',
  'Medical point cloud semantic segmentation': '医疗点云语义分割',
  'Medical image semantic segmentation': '医疗图像语义分割',
  'Ultrasound or angiography image annotation': 'B超或造影图像标注',
  'Medical gigapixel image semantic segmentation': '医疗超大像素图像语义分割',
  'Medical receipt OCR': '医疗票据OCR',
  'Outpatient medical record OCR': '医疗门诊病历OCR',
  'Medical multi-turn dialogue annotation': '医疗多轮对话标注',
  'Embodied intelligence': '具身智能',
  '4D campus point cloud semantic segmentation': '4D园区点云语义分割',
  'Indoor semantic segmentation': '室内语义分割',
  'Power switch detection': '电源开关检测',
  'Gesture recognition and palm segmentation': '手势控制识别-手掌分割',
  'Robot arm segmentation': '机械臂分割',
  'Robot dog semantic segmentation and object detection':
    '机器狗语义分割&目标检测',
  'Smart logistics': '智慧物流',
  'Logistics sorting shipping label detection': '物流分拣快递单检测',
  'Smart transportation': '智慧交通',
  'Airport point cloud object detection': '点云机场目标检测',
  '2D airport detection, segmentation, and aircraft keypoints':
    '2D机场目标检测&分割&飞机关键点标注',
  'Smart industry': '智慧工业',
  'Large language models': '大模型',
  'PDF to Markdown': 'PDF文档转换Markdown',
  'RLHF ranking and scoring': 'RLHF排序打分',
  'Image description': '图像描述',
  'Math problem decomposition into LaTeX': '数学题拆分LaTeX',
  'Physics problem decomposition': '物理题拆分',
  'Arabic menu annotation': '阿拉伯语菜单标注',
  'Handwritten chemistry exam OCR': '化学试卷ocr（手写）',
  'Excel spreadsheet annotation': 'Excel表格标注',
  'GUI instruction execution': 'GUI指令执行',
  'Low-altitude economy': '低空经济',
  'Drone obstacle avoidance and braking annotation': '无人机避障刹停标注',
  'Infrared object recognition': '红外目标识别',
  'Large base-map point cloud': '底图大点云',
  'Smart converged media': '智慧融媒体',
  'Stylized text segmentation': '艺术字分割',
  'Video quality analysis': '视频质量分析',
  'Image aesthetic scoring': '图片美学评分',
  'Cannot read local cache': '无法读取本地缓存',
  'A cache operation is in progress. Please wait': '缓存操作进行中，请稍候',
  'Batch caching complete. Succeeded: {{completed}}, failed: {{failed}}':
    '批量缓存已完成，成功: {{completed}}, 失败: {{failed}}',
  'Cache refreshed': '刷新缓存成功',
  'Cache deleted': '缓存已删除',
  'Failed to delete cache': '删除缓存失败',
  'All caches cleared': '所有缓存已清空',
  'Failed to clear cache': '清空缓存失败',
  'Failed to load data': '数据加载失败',
  'Image object annotation': '图片目标标注',
  'Label vehicles and pedestrians at an intersection':
    '在路口场景中标记车辆与行人',
  'Rectangle / polygon / keypoint': '矩形框 / 多边形 / 关键点',
  'intersection.svg': '路口场景.svg',
  '3D point cloud annotation': '3D 点云标注',
  'Rotate the point cloud and add 3D annotations to vehicles':
    '旋转点云，为车辆添加 3D 标注',
  '3D box / polyline / 3D point': '3D 框 / 折线 / 3D 点',
  'road-pointcloud.pcd': '道路点云.pcd',
  'Text entity annotation': '文本实体标注',
  'Select text to label people, places, and other entities':
    '选择文本，为人物、地点等实体添加标记',
  'Text selection / entity annotation': '文本选择 / 实体标注',
  'travel-record.txt': '出行记录.txt',
  'Search tasks': '搜索任务',
  'Search by task name or source': '搜索任务名称或来源',
  'Task list content': '任务列表内容',
  'Waiting for data import': '等待导入数据',
  'No matching tasks': '没有匹配的任务',
  'No tasks yet': '暂无任务',
  'No files found. Select them again': '没有找到文件，请重新选择',
  'Directory reading canceled. No tasks were created':
    '已取消读取目录，未创建任务',
  'Select a cloud directory and read its file list first':
    '请先选择云端目录并读取数据清单',
  'Cannot preview data': '无法预览数据',
  'No tasks were created, but some temporary files could not be cleaned up. Check browser storage.':
    '本次任务未创建，部分临时文件未能清理。请检查浏览器本地存储。',
  'Import canceled. No tasks were created. Adjust the list and try again.':
    '已取消导入，未创建任务。可调整清单后重试。',
  'Batch creation failed. Try again': '批量创建失败，请重试',
  'New task / batch create': '新建任务 / 批量创建',
  Selected: '已选择',
  'tasks ·': '个任务 ·',
  'Cancel import': '取消导入',
  'Preview and configure tools': '预览并配置工具',
  'Creating tasks': '正在创建任务',
  'Create {{v0}} tasks': '创建 {{v0}} 个任务',
  'Create one task per data item. Select multiple files for batch creation; consecutive frames in the same directory can be grouped into one data item.':
    '每条数据创建一个任务。多选文件即可批量创建；同目录的连续帧可合并为一条数据。',
  'Drop files or a parent folder': '拖入文件或父文件夹',
  'PCD / PLY, images, audio, video, text, and documents':
    'PCD / PLY、图片、音视频、文本与文档',
  'Select multiple files': '选择多个文件',
  'Select parent folder': '选择父文件夹',
  'Only file references are saved; original files are read on demand during annotation. The list includes all subdirectories of the selected directory.':
    '只保存文件引用，标注时按需读取原文件。清单包含所选目录的所有子目录。',
  'Read directory to build list': '读取目录生成清单',
  'Upload PublicAnnotationInput JSON or DataRecord JSONL':
    '上传 PublicAnnotationInput JSON 或 DataRecord JSONL',
  'JSON data': 'JSON 数据',
  'You can also paste PublicAnnotationInput JSON. Multiple records are split automatically.':
    '也可粘贴 PublicAnnotationInput JSON，包含多条数据时自动拆分。',
  'Data grouping': '数据拆分',
  'One task per file': '每个文件一个任务',
  'Consecutive frames in the same directory': '同目录连续帧',
  'Group point clouds or images in the same directory into consecutive frames. Other files become individual tasks; subdirectories are processed separately.':
    '同一个实际目录内的点云或图片组成一条连续帧数据；其他文件逐个创建，子目录分别处理。',
  'Create a separate task for each file. For consecutive point cloud or image frames, put them in the same directory and select “Consecutive frames in the same directory”.':
    '每个文件创建一个独立任务。点云或图片连续帧请放在同一目录，选择“同目录连续帧”。',
  'Edit task names and clear the tasks you do not need':
    '可修改任务名称，取消勾选不需要的任务',
  'This directory has no supported files': '当前目录没有可标注的文件',
  'Select a data source and directory, then click “Read directory to build list”':
    '选择数据源和目录，点击“读取目录生成清单”',
  'No supported files. Select them again': '没有可标注的文件，请重新选择',
  'Select files or a parent folder to preview data here':
    '选择文件或父文件夹后，在这里预览数据',
  'Task name': '任务名称',
  'Task name for {{v0}}': '{{v0}}的任务名称',
  Source: '来源',
  'Consecutive frames': '连续帧',
  'Files / data': '文件 / 数据',
  Ignored: '已忽略',
  'unsupported, hidden, or empty files.': '个不支持、隐藏或空文件。',
  'Annotation instructions (apply to all tasks in this batch)':
    '标注说明（应用到本次所有任务）',
  'Optional instructions for annotating this batch':
    '可选，填写这批数据的标注要求',
  'Reading directory, found {{v0}} files…':
    '正在读取目录，已发现 {{v0}} 个文件…',
  'Saving local files…': '正在保存本地文件…',
  'Creating tasks…': '正在创建任务…',
  'Enter names for all selected data items': '请补全已勾选数据的名称',
  'Import shared data': '导入共享数据',
  'This annotation data contains': '这份标注数据包含',
  'records and will create': '条数据，将分别创建',
  'tasks. Tool configuration and annotation results are imported together.':
    '个任务。 一同导入工具配置和标注结果。',
  'Shared data': '共享数据',
  'Created {{v0}} tasks': '已创建 {{v0}} 个任务',
  'Import as tasks and annotate': '导入为任务并标注',
  'Task not found': '任务不存在',
  'This task contains one data item. Its annotation results are saved independently.':
    '当前任务对应一条数据，标注结果独立保存。',
  'Configure annotation tools': '配置标注工具',
  'Open annotation workspace': '进入标注',
  Status: '状态',
  'Data type': '数据类型',
  'Attachment type': 'Attachment 类型',
  'File count': '文件数量',
  'Last submitted': '上次提交',
  'Not submitted yet': '尚未提交',
  'Annotation results': '标注结果',
  'No annotation results have been saved for this data. Submit them from the annotation workspace.':
    '此数据尚未保存标注结果，进入标注工作台后提交。',
  'Edit task': '编辑任务',
  'Save changes': '保存修改',
  'For example, intersection point cloud annotation': '例如 路口点云目标标注',
  'Annotation instructions': '标注说明',
  'Record annotation requirements, data batches, or notes':
    '记录标注要求、数据批次或注意事项',
  'Task details': '任务详情',
  'Task management': '任务管理',
  'Close menu': '关闭菜单',
  'Workspace menu': '工作区菜单',
  'Standalone annotation tool': '独立标注工具',
  Workspace: '工作区',
  Modules: '功能模块',
  'Current task menu': '当前任务菜单',
  'Local storage': '本机存储',
  'Data is stored in this browser': '数据保存在此浏览器',
  'Open menu': '打开菜单',
  'Import data, then select a task to start annotating.':
    '导入数据后，选择任务开始标注。',
  'Total tasks': '任务总数',
  'Each task contains one data item or a sequence of frames.':
    '单条数据或一组连续帧对应一个任务。',
  'All tasks {{v0}}': '全部任务 {{v0}}',
  'Search by task name, instructions, or source': '搜索任务名称、说明或来源',
  '{{v0}} tasks': '共 {{v0}} 个任务',
  'No tasks yet. Click “New task / batch create” to import data':
    '还没有任务，点击“新建任务 / 批量创建”导入数据',
  'Single data item task': '单条数据任务',
  'Data source': '数据来源',
  'Last saved': '上次保存',
  'View annotations': '查看标注',
  'View data and results': '查看数据与结果',
  'Export data and results': '导出数据与结果',
  'Edit name and instructions': '编辑名称和说明',
  'Delete task': '删除任务',
  'Actions for {{v0}}': '{{v0}}的操作',
  'Delete task “': '将删除任务“',
  '” and its annotation results.': '”及其标注结果。',
  'Submission progress for this task is unconfirmed. Submit again to update it.':
    '该任务的提交进度尚未确认，重新提交后更新。',
  '{{v0}} / {{v1}} records confirmed': '{{v0}} / {{v1}} 条已确认',
  'Previous results available': '已有历史结果',
  'Cannot read local tasks. Check whether browser storage is available.':
    '无法读取本地任务，请检查浏览器存储是否可用。',
  'Delete the local connection for “{{name}}”?':
    '删除数据源「{{name}}」的本地连接配置？',
  'Delete task “{{name}}” and its annotation results.':
    '将删除任务“{{name}}”及其标注结果。',
  'This shared data contains {{count}} records and will create {{count}} tasks, including tool configuration and annotation results.':
    '这份标注数据包含 {{count}} 条数据，将分别创建 {{count}} 个任务，一同导入工具配置和标注结果。',
  '{{count}} tasks selected · {{size}}': '已选择 {{count}} 个任务 · {{size}}',
  '{{count}} records, ': '{{count}} 条，',
};

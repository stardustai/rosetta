# 开发约定

工作区使用 pnpm 12.21.0 和 Tailwind CSS 4.3.5。`package.json` 固定包管理器版本，`pnpm-lock.yaml` 记录依赖版本；本机和 CI 都用 `pnpm install --frozen-lockfile` 安装。

## 现有开源依赖

| 用途                                 | 实现                                   |
| ------------------------------------ | -------------------------------------- |
| 布局、间距、字体、响应式和主题工具类 | Tailwind CSS，接入 `@tailwindcss/vite` |
| 表单、表格、弹窗和菜单               | Ant Design                             |
| 任务路由                             | React Router        |
| 异步请求的顺序和取消                 | `ahooks/useRequest`                    |
| 远程数据请求                         | ky                                     |
| 翻译资源和插值                       | i18next                                |
| IndexedDB 访问                       | idb、idb-keyval                        |
| 文件选择和拖放                       | file-selector、react-dropzone          |
| JSON 编辑                            | CodeMirror                             |
| OSS、OBS、TOS 访问和签名             | 云厂商 SDK                             |
| 标注渲染                             | 独立的 Rosetta iframe 服务             |

新增功能先检查这些依赖能否直接支持。URL、日期和数字格式、取消信号、跨标签通知使用浏览器原生 API。

## 样式

普通布局和字体样式写在 `className` 中。`src/style.css` 保留 Tailwind 入口、工作区主题变量，以及适配 Ant Design 和编辑器的选择器；这些选择器通过 `@apply` 复用工具类。浅色和深色工作区共用 `workspace-*` 主题标记。

修改布局后，需要检查桌面和窄屏下的任务列表、导入弹窗和侧栏。

## 业务规则

任务迁移、IndexedDB 事务、导出目标、iframe 保存回执和标注格式属于本项目的数据约定。修改时需要验证已有数据。iframe 组件和宿主通信位于 `src/annotation`。[iframe 接入说明](iframe-integration.md)介绍了协议版本和生成文件。

OBS、TOS 的 axios 覆盖位于 `pnpm-workspace.yaml`，catalog 统一提供直接依赖和 SDK 覆盖版本。TOS 移除旧导入前，需要保留错误工厂的兼容别名。

## 检查命令

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run test:render
pnpm run build
```

GitHub 工作流使用同一包管理器和锁文件。发布前仍需在仓库设置中启用 Pages。

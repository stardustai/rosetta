import LanguageProvider from './LanguageProvider';
import { t } from './i18n';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { configureRosetta } from './annotation/configuration';
import { createRoot } from 'react-dom/client';
import { resolveLocalResource } from './localData/resources';
import {
  getLocalFile,
  storeGeneratedFile,
  releaseUnusedImport,
} from './localData/storage';
import AnnotationPage from './pages/AnnotationPage';
import DataSourcesPage from './pages/dataSources/DataSourcesPage';
import ExportSettingsPage from './pages/exportSettings/ExportSettingsPage';
import PublicAnnotationTool from './pages/publicAnnotationTool/Tool';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import TaskManagerPage from './pages/tasks/TaskManagerPage';
import './style.css';

configureRosetta({
  frameURL:
    import.meta.env.VITE_ANNOTATION_URL ||
    (import.meta.env.PROD ? undefined : 'http://127.0.0.1:4175/'),
  resolveResource: resolveLocalResource,
  readResource: async (url) => {
    if (url.startsWith('local://')) return getLocalFile(url);
    const resolved = await resolveLocalResource(url, async (value) =>
      value.replace(
        /^oss:\/\/stardust-public(?=\/|$)/,
        'https://assets.stardust-ai.com',
      ),
    );
    const address = new URL(resolved, window.location.href);
    if (address.origin === window.location.origin) {
      const response = await fetch(address);
      if (!response.ok)
        throw new Error(
          t('Failed to read resource: HTTP {{v0}}', { v0: response.status }),
        );
      return response.blob();
    }
    return address.href;
  },
  saveFile: storeGeneratedFile,
  releaseFiles: async (urls) => {
    for (const url of urls)
      await releaseUnusedImport(url.slice('local://'.length).split('/')[0]);
  },
});
// Vite replaces import.meta.hot with false in production; optional chaining
// only skips null/undefined, so the entire HMR block needs a truthy guard.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    applicationRoot.unmount();
  });
}

function LegacyTaskRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/tasks${search}`} replace />;
}

export const applicationRoot = createRoot(document.getElementById('root')!);
applicationRoot.render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<PublicAnnotationTool />} />
        <Route path="/annotationTool" element={<PublicAnnotationTool />} />
        <Route path="/annotate" element={<AnnotationPage />} />
        <Route path="/projects" element={<LegacyTaskRedirect />} />
        <Route path="/projects/:projectId" element={<LegacyTaskRedirect />} />
        <Route path="/tasks" element={<TaskManagerPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/dataSources" element={<DataSourcesPage />} />
        <Route path="/exportSettings" element={<ExportSettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LanguageProvider>
  </BrowserRouter>,
);

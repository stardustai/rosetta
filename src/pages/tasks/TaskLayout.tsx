import { LanguageSelect } from '../../LanguageProvider';
import { useLanguage, t } from '../../i18n';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CheckSquareOutlined,
  CloudServerOutlined,
  ExportOutlined,
  MenuOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import logo from '../../assets/logo2.png';

export type TaskSection = 'overview' | 'configuration' | 'results';
export default function TaskLayout({
  children,
  task,
  section = 'overview',
  onBeforeNavigate,
  footer,
  actions,
  contentClassName = '',
  onStartNew,
}: {
  children: ReactNode;
  task?: { id: string; name: string };
  section?: TaskSection;
  onBeforeNavigate?: () => Promise<void | boolean>;
  footer?: ReactNode;
  actions?: ReactNode;
  contentClassName?: string;
  onStartNew?: () => void;
}) {
  useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const inSources = location.pathname.startsWith('/dataSources');
  const inExports = location.pathname.startsWith('/exportSettings');
  const inQuickStart =
    !task &&
    (location.pathname === '/' || location.pathname === '/annotationTool');
  const labels = {
    overview: t('Task details'),
    configuration: t('Annotation tools'),
    results: t('Annotation results'),
  };
  async function leave(to: string) {
    if (leaving) return;
    setLeaving(true);
    try {
      if ((await onBeforeNavigate?.()) === false) return;
      setMenuOpen(false);
      navigate(to);
    } catch (error) {
      message.error((error as Error).message || t('Save failed. Try again'));
    } finally {
      setLeaving(false);
    }
  }
  function follow(event: MouseEvent<HTMLAnchorElement>, to: string) {
    if (
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    setMenuOpen(false);
    if (to === '/' && inQuickStart && onStartNew) {
      event.preventDefault();
      onStartNew();
      return;
    }
    if (onBeforeNavigate) {
      event.preventDefault();
      void leave(to);
    }
  }
  function item(to: string, label: string, icon: ReactNode, active: boolean) {
    return (
      <Link
        to={to}
        onClick={(event) => follow(event, to)}
        className={`workspace-nav-item${active ? ' is-active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  const crumbs = [
    {
      title: (
        <Link to="/" onClick={(event) => follow(event, '/')}>
          {t('Start annotating')}
        </Link>
      ),
    },
    ...(task
      ? [
          {
            title: (
              <Link
                to={`/tasks/${task.id}`}
                className="workspace-breadcrumb-task"
                onClick={(event) => follow(event, `/tasks/${task.id}`)}
              >
                {task.name}
              </Link>
            ),
          },
          { title: labels[section] },
        ]
      : inSources
      ? [{ title: t('Data sources') }]
      : inExports
      ? [{ title: t('Export settings') }]
      : inQuickStart
      ? []
      : [{ title: t('Task management') }]),
  ];
  return (
    <div className="workspace-shell">
      {menuOpen && (
        <button
          className="workspace-menu-overlay"
          aria-label={t('Close menu')}
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`workspace-sidebar${menuOpen ? ' is-open' : ''}`}
        aria-label={t('Workspace menu')}
      >
        <Link
          className="workspace-brand"
          to="/"
          onClick={(event) => follow(event, '/')}
        >
          <img src={logo} alt="STARDUST" />
          <span>{t('Standalone annotation tool')}</span>
        </Link>
        <div className="workspace-nav-label mt-0 mx-5.5 mb-2.5 text-workspace-muted text-[11px]">
          {t('Workspace')}
        </div>
        <nav aria-label={t('Modules')}>
          {item(
            '/',
            t('Start annotating'),
            <ThunderboltOutlined />,
            inQuickStart,
          )}
          {item(
            '/tasks',
            t('Task management'),
            <AppstoreOutlined />,
            !inQuickStart && !inSources && !inExports,
          )}
          {item(
            '/dataSources',
            t('Data sources'),
            <CloudServerOutlined />,
            inSources,
          )}
          {item(
            '/exportSettings',
            t('Export settings'),
            <ExportOutlined />,
            inExports,
          )}
        </nav>
        {task && (
          <div className="workspace-task-menu mt-6 pt-5.5 border-t border-solid border-t-workspace-border">
            <div className="workspace-nav-label mt-0 mx-5.5 mb-2.5 text-workspace-muted text-[11px]">
              {t('Current task')}
            </div>
            <div className="workspace-current-task" title={task.name}>
              <span>{task.name}</span>
            </div>
            <nav aria-label={t('Current task menu')}>
              {item(
                `/tasks/${task.id}`,
                t('Task details'),
                <AppstoreOutlined />,
                section === 'overview',
              )}
              {item(
                `/annotationTool?task=${task.id}`,
                t('Annotation tools'),
                <SettingOutlined />,
                section === 'configuration',
              )}
              {item(
                `/tasks/${task.id}?view=results`,
                t('Annotation results'),
                <CheckSquareOutlined />,
                section === 'results',
              )}
            </nav>
            <Link
              className="workspace-task-exit flex items-center gap-[9px] mt-4 mx-6 mb-0 text-[12px] text-workspace-muted"
              to="/tasks"
              onClick={(event) => follow(event, '/tasks')}
            >
              <ArrowLeftOutlined />
              {t('Back to task list')}
            </Link>
          </div>
        )}
        <div className="workspace-local-status">
          <span className="workspace-status-dot inline-block w-1.5 h-1.5 mr-[7px] rounded-full bg-[#7894b7] align-middle" />
          {t('Local storage')}
          <small>{t('Data is stored in this browser')}</small>
        </div>
      </aside>
      <div className="workspace-main flex flex-col flex-1 min-w-0 min-h-0">
        <header className="workspace-topbar">
          <Button
            className="workspace-menu-toggle"
            aria-label={t('Open menu')}
            aria-expanded={menuOpen}
            icon={<MenuOutlined />}
            onClick={() => setMenuOpen(!menuOpen)}
          />
          <Breadcrumb items={crumbs} />
          <div className="workspace-topbar-actions">
            <LanguageSelect />
            {actions}
            {task && (
              <Button
                icon={<ArrowLeftOutlined />}
                loading={leaving}
                onClick={() => leave('/tasks')}
              >
                {t('Back to task list')}
              </Button>
            )}
          </div>
        </header>
        <main className={`workspace-content ${contentClassName}`}>
          {children}
        </main>
        {footer && <footer className="workspace-footer">{footer}</footer>}
      </div>
    </div>
  );
}

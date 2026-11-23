import { App, Select, ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import deDE from 'antd/locale/de_DE';
import jaJP from 'antd/locale/ja_JP';
import { useEffect, type PropsWithChildren } from 'react';
import {
  getLanguage,
  setLanguage,
  t,
  useLanguage,
  type Language,
} from './i18n';

const componentLocales = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'de-DE': deDE,
  'ja-JP': jaJP,
};

export function LanguageSelect() {
  const language = useLanguage();
  return (
    <Select
      aria-label={t('Language')}
      value={language}
      onChange={(value: Language) => void setLanguage(value)}
      options={[
        { value: 'en-US', label: 'English' },
        { value: 'zh-CN', label: '中文' },
        { value: 'de-DE', label: 'Deutsch' },
        { value: 'ja-JP', label: '日本語' },
      ]}
      style={{ minWidth: 112 }}
    />
  );
}
const applicationTheme = {
  algorithm: theme.darkAlgorithm,
  cssVar: true,
  hashed: false as const,
  token: { fontSizeLG: 14, controlHeightLG: 44 },
  components: {
    Table: { cellPaddingBlock: 8, cellFontSize: 14 },
    Select: { fontSize: 14 },
    Breadcrumb: { fontSize: 12 },
    Pagination: { lineWidth: 1 },
    Collapse: { lineWidth: 0 },
    Tabs: {
      lineWidth: 0,
      cardPadding: '8px 32px',
      colorBgContainer: '#212B3B',
    },
    Input: { borderRadius: 4 },
    DatePicker: { borderRadius: 4 },
    Drawer: { fontSizeLG: 16 },
    Tree: { colorBgContainer: '#141414' },
  },
};
export default function LanguageProvider({ children }: PropsWithChildren) {
  const language = useLanguage();
  useEffect(() => {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    document.body.setAttribute('theme', 'dark');
    ConfigProvider.config({
      holderRender: (node) => (
        <ConfigProvider
          locale={componentLocales[getLanguage()]}
          theme={applicationTheme}
        >
          {node}
        </ConfigProvider>
      ),
    });
  }, [language]);
  return (
    <ConfigProvider
      locale={componentLocales[language]}
      theme={applicationTheme}
    >
      <App style={{ width: '100%', height: '100%' }}>{children}</App>
    </ConfigProvider>
  );
}

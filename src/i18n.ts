import i18next from 'i18next';
import { useSyncExternalStore } from 'react';
import { zhCN } from './messages';
import deDE from './locales/de-DE.json';
import jaJP from './locales/ja-JP.json';

import type { FrameLanguage } from './annotation/contracts/frame-v1';

export type Language = FrameLanguage;
export const languages: Language[] = ['en-US', 'zh-CN', 'de-DE', 'ja-JP'];
const translations: Partial<Record<Language, Record<string, string>>> = {
  'zh-CN': zhCN,
  'de-DE': deDE,
  'ja-JP': jaJP,
};
export const LANGUAGE_KEY = 'rosetta.language';
export const normalizeLanguage = (value?: string | null): Language => {
  const code = (value || '').split(/[-_]/)[0].toLowerCase();
  return (
    ({ zh: 'zh-CN', de: 'de-DE', ja: 'ja-JP' } as Record<string, Language>)[
      code
    ] || 'en-US'
  );
};
const english = Object.fromEntries(Object.keys(zhCN).map((key) => [key, key]));
Object.assign(english, {
  '{{count}} records_one': '{{count}} record',
  '{{count}} files_one': '{{count}} file',
});
const legacyEnglish = Object.fromEntries(
  Object.entries(zhCN).map(([en, zh]) => [zh, en]),
);
const legacyChinese = Object.fromEntries(
  Object.values(zhCN).map((zh) => [zh, zh]),
);
function savedLanguage(): Language {
  try {
    return normalizeLanguage(
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(LANGUAGE_KEY),
    );
  } catch {
    return 'en-US';
  }
}
if (!i18next.isInitialized) {
  void i18next.init({
    lng: savedLanguage(),
    fallbackLng: 'en-US',
    supportedLngs: languages,
    keySeparator: false,
    nsSeparator: false,
    initImmediate: false,
    interpolation: { escapeValue: false },
    resources: {},
  });
}
i18next.addResourceBundle(
  'en-US',
  'translation',
  { ...legacyEnglish, ...english },
  true,
  true,
);
i18next.addResourceBundle(
  'zh-CN',
  'translation',
  { ...legacyChinese, ...zhCN },
  true,
  true,
);
for (const [language, messages] of Object.entries({
  'de-DE': deDE,
  'ja-JP': jaJP,
})) {
  const aliases = Object.fromEntries(
    Object.entries(zhCN).map(([en, zh]) => [zh, messages[en] || en]),
  );
  i18next.addResourceBundle(
    language,
    'translation',
    { ...aliases, ...messages },
    true,
    true,
  );
}
export const getLanguage = (): Language => normalizeLanguage(i18next.language);
export function t(
  key: string | string[],
  options?: Record<string, any> | string,
): string {
  const source = Array.isArray(key) ? key[0] : key;
  const englishSource = legacyEnglish[source] || source;
  const fallback =
    translations[getLanguage()]?.[englishSource] || englishSource;
  const settings = typeof options === 'object' ? options : {};
  const value = i18next.t(source, { defaultValue: fallback, ...settings });
  return typeof value === 'string' && value.trim() ? value : fallback;
}
function updateDocument() {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = getLanguage();
    document.title = t('Standalone annotation tool');
  }
}
i18next.on('languageChanged', updateDocument);
updateDocument();
export async function setLanguage(language: Language) {
  await i18next.changeLanguage(normalizeLanguage(language));
  try {
    window.localStorage.setItem(LANGUAGE_KEY, getLanguage());
  } catch {
    /* Storage may be disabled. */
  }
}
const subscribe = (refresh: () => void) => {
  i18next.on('languageChanged', refresh);
  return () => {
    i18next.off('languageChanged', refresh);
  };
};
export const useLanguage = () =>
  useSyncExternalStore(subscribe, getLanguage, () => 'en-US' as Language);
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === LANGUAGE_KEY)
      void i18next.changeLanguage(normalizeLanguage(event.newValue));
  });
}

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  getLanguage,
  normalizeLanguage,
  LANGUAGE_KEY,
  setLanguage,
  t,
  useLanguage,
} from '../../src/i18n';
import { dataKindLabels } from '../../src/localData/recordKind';
import { taskStatusLabels } from '../../src/localData/sessionInfo';

function Probe() {
  const language = useLanguage();
  const [name, setName] = useState('My custom task');
  return (
    <>
      <h1>{t('Task management')}</h1>
      <label>
        {t('Task name')}
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <p>
        {dataKindLabels.image} / {taskStatusLabels.completed}
      </p>
      <output>{t('Created {{v0}} tasks', { v0: 3 })}</output>
      <button
        onClick={() =>
          void setLanguage(language === 'en-US' ? 'zh-CN' : 'en-US')
        }
      >
        Switch language
      </button>
    </>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Probe />);
Object.assign(window, {
  i18nTest: {
    getLanguage,
    normalizeLanguage,
    setLanguage,
    t,
    LANGUAGE_KEY,
    unmount: () => root.unmount(),
  },
});
export interface I18nHarness {
  getLanguage: () => string;
  normalizeLanguage: (language: string) => string;
  setLanguage: typeof setLanguage;
  t: typeof t;
  LANGUAGE_KEY: string;
  unmount: () => void;
}

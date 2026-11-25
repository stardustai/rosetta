import { useLanguage, t } from '../../i18n';
import type { PublicAnnotationInput } from '../../annotation/schema';
import { Spin } from 'antd';
import i18next from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useDemoData } from './hooks/useDemoData';
import { useEnhancedDataFetcher } from './hooks/useEnhancedDataFetcher';
import type { PublicAnnotationToolStore } from './PublicAnnotationToolStore';
import { exampleInput, quickExamples } from './quickExamples';
import { SceneCase } from './SceneCase';

export default observer(function SceneSelect({
  store,
  onSelect,
}: {
  store: PublicAnnotationToolStore;
  onSelect: (input: PublicAnnotationInput, name: string) => void;
}) {
  useLanguage();
  const demoData = useDemoData();
  const [category, setCategory] = useState('custom');
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!store.records.length) {
      setCategory('custom');
      setActive('');
    }
  }, [store.records.length]);
  const title = useRef(t('Example data'));
  const { loading, fetchPublicAnnotationInput, cancelDataLoad } =
    useEnhancedDataFetcher((input) =>
      onSelect(structuredClone(input), title.current),
    );
  function load(
    input: PublicAnnotationInput | string,
    name: string,
    id: string,
  ) {
    title.current = name;
    setActive(id);
    fetchPublicAnnotationInput(
      typeof input === 'string' && !i18next.language?.startsWith('zh')
        ? input.replace('/json/', '/json_en/')
        : input,
    );
  }
  const group = demoData.find((item) => item.id === category);
  return (
    <section
      className="annotation-scene-panel"
      aria-label={t('Scene examples')}
    >
      <h2>{t('Scene examples')}</h2>
      <Spin spinning={loading}>
        <div className="annotation-scene-row">
          <span className="annotation-scene-label">{t('Scene type:')}</span>
          <div
            className="annotation-scene-options flex flex-wrap gap-y-1.5 gap-x-2 min-w-0"
            role="group"
            aria-label={t('Scene type')}
          >
            <button
              type="button"
              className="scene-option"
              aria-pressed={category === 'custom'}
              onClick={() => {
                cancelDataLoad();
                setCategory('custom');
              }}
            >
              {t('Custom')}
            </button>
            <button
              type="button"
              className="scene-option"
              aria-pressed={category === 'examples'}
              onClick={() => {
                setCategory('examples');
                const example = quickExamples[0];
                load(exampleInput(example), example.name, example.id);
              }}
            >
              {t('Default examples')}
            </button>
            {demoData
              .filter((item) => item.sub.some((scene) => scene.input))
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="scene-option"
                  aria-pressed={category === item.id}
                  onClick={() => {
                    setCategory(item.id);
                    const scene = item.sub.find((value) => value.input);
                    if (scene) load(scene.input!, scene.name, scene.id);
                  }}
                >
                  {item.name}
                </button>
              ))}
          </div>
        </div>
        {category === 'custom' || category === 'examples' ? (
          <div className="annotation-scene-row">
            <span className="annotation-scene-label">{t('Example data:')}</span>
            <div
              className="annotation-scene-options flex flex-wrap gap-y-1.5 gap-x-2 min-w-0"
              role="group"
              aria-label={t('Default example data')}
            >
              {quickExamples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  className={`scene-option annotation-example-${example.id}`}
                  aria-pressed={
                    active === example.id && category === 'examples'
                  }
                  onClick={() => {
                    setCategory('examples');
                    load(exampleInput(example), example.name, example.id);
                  }}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="annotation-scene-row">
            <span className="annotation-scene-label">
              {t('Typical scenes:')}
            </span>
            <div
              className="annotation-scene-options flex flex-wrap gap-y-1.5 gap-x-2 min-w-0"
              role="group"
              aria-label={t('Typical scenes')}
            >
              {group?.sub
                .filter((item) => item.input)
                .map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="scene-option"
                    aria-pressed={active === item.id}
                    onClick={() => load(item.input!, item.name, item.id)}
                  >
                    {item.name}
                  </button>
                ))}
            </div>
          </div>
        )}
        {category === 'custom' && <SceneCase store={store} />}
      </Spin>
    </section>
  );
});

import { useLanguage, t } from '../i18n';
import type {
  RosettaAnnotationHandle,
  RosettaAnnotationProps,
} from '../annotation/EditorFrame';
import { RosettaAnnotation } from '../annotationService';
import type { Ref } from 'react';
import { useEffect, useState } from 'react';
import CloudConnectionForm from '../objectStorage/CloudConnectionForm';
import {
  missingConnections,
  subscribeConnections,
} from '../objectStorage/registry';
import type { StorageSource } from '../objectStorage/types';
import { defaultRegions } from '../objectStorage/types';

export default function AnnotationWorkspace({
  sources,
  editorRef,
  ...props
}: RosettaAnnotationProps & {
  sources: StorageSource[];
  editorRef?: Ref<RosettaAnnotationHandle>;
}) {
  useLanguage();
  const [, setRevision] = useState(0);
  useEffect(
    () => subscribeConnections(() => setRevision((value) => value + 1)),
    [],
  );
  const missing = missingConnections(sources);
  if (missing.length)
    return (
      <div className="cloud-access-page">
        <div className="cloud-access-form">
          <h2>
            {t('Connect to the object storage containing your annotation data')}
          </h2>
          <p>
            {t(
              'Select a data source or enter access credentials for this bucket.',
            )}
          </p>
          <CloudConnectionForm
            key={`${missing[0].provider}:${missing[0].bucket}`}
            initial={{
              ...missing[0],
              region: missing[0].region || defaultRegions[missing[0].provider],
            }}
            fixedSource
            onConnected={() => {}}
          />
        </div>
      </div>
    );
  return (
    <div className="cloud-annotation-editor flex-1 min-h-0 relative">
      <RosettaAnnotation ref={editorRef} {...props} />
    </div>
  );
}

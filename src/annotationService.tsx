import * as frame from './annotation/EditorFrame';
import { Alert } from 'antd';
import { forwardRef, type ComponentProps } from 'react';
import { t, useLanguage } from './i18n';

const configured =
  !import.meta.env.PROD || !!import.meta.env.VITE_ANNOTATION_URL;
function ServiceNotice() {
  useLanguage();
  return (
    <Alert
      showIcon
      type="info"
      message={t('Annotation service is not connected')}
      description={t(
        'You can import and manage tasks here. Ask the site administrator to connect the annotation service before editing annotations.',
      )}
    />
  );
}
export const RosettaAnnotation = forwardRef<
  frame.RosettaAnnotationHandle,
  frame.RosettaAnnotationProps
>((props, ref) =>
  configured ? (
    <frame.RosettaAnnotation {...props} ref={ref} />
  ) : (
    <ServiceNotice />
  ),
);
export function OperatorsEditor(
  props: ComponentProps<typeof frame.OperatorsEditor>,
) {
  return configured ? <frame.OperatorsEditor {...props} /> : <ServiceNotice />;
}
export function AlgorithmEditor(
  props: ComponentProps<typeof frame.AlgorithmEditor>,
) {
  return configured ? <frame.AlgorithmEditor {...props} /> : <ServiceNotice />;
}

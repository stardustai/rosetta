import { useLanguage, t } from '../../i18n';
import type { PublicAnnotationInput } from '../../annotation/schema';
import { Alert, Button, message } from 'antd';
import { validateSchema } from '../../annotation/schema';
import { useState } from 'react';
import { tasksFromInput } from '../../localData/dataTasks';
import { openSavedAnnotation } from '../../localData/openAnnotation';
import { sessionRecords } from '../../localData/sessionInfo';
import { createTasks } from '../../localData/storage';

export default function ImportSharedData({
  input,
}: {
  input: PublicAnnotationInput;
}) {
  useLanguage();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const count = sessionRecords(input).length;
  return (
    <div className="cloud-access-page">
      <div className="cloud-access-form">
        <h2>{t('Import shared data')}</h2>
        <p>
          {t(
            'This shared data contains {{count}} records and will create {{count}} tasks, including tool configuration and annotation results.',
            { count },
          )}
        </p>
        <Button
          type="primary"
          disabled={!count}
          loading={busy}
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            setFailure('');
            try {
              const check = validateSchema('PublicAnnotationInput', input);
              if (!check.valid) throw new Error(check.errorMessage);
              const tasks = await createTasks(
                tasksFromInput(input, t('Shared data')),
              );
              await openSavedAnnotation(tasks[0].id, null);
              message.success(t('Created {{v0}} tasks', { v0: tasks.length }));
            } catch (error) {
              setFailure((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('Import as tasks and annotate')}
        </Button>
        {failure && (
          <Alert className="mt-3" type="error" showIcon message={failure} />
        )}
      </div>
    </div>
  );
}

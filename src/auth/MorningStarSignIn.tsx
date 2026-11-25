import { Alert, Button } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { t, useLanguage } from '../i18n';
import { morningStarSignInURL, signInWithMorningStar } from './morningStar';

const signInURL = morningStarSignInURL(
  import.meta.env.VITE_ANNOTATION_URL,
  import.meta.env.VITE_MORNINGSTAR_SIGN_IN_URL,
);

type Status =
  | 'idle'
  | 'pending'
  | 'signed-in'
  | 'failed'
  | 'cancelled'
  | 'blocked';

const messages = {
  'signed-in': 'MorningStar sign-in confirmed',
  failed: 'MorningStar sign-in could not be confirmed. Try again.',
  cancelled: 'The sign-in window closed before sign-in finished.',
  blocked: 'Allow pop-ups to sign in with MorningStar.',
} as const;

export default function MorningStarSignIn({
  frame,
}: {
  frame: () => Window | null | undefined;
}) {
  useLanguage();
  const [status, setStatus] = useState<Status>('idle');
  const cancel = useRef<() => void>();
  useEffect(() => () => cancel.current?.(), []);
  if (!signInURL) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2">
      <Button
        loading={status === 'pending'}
        onClick={() => {
          cancel.current?.();
          cancel.current = signInWithMorningStar(
            window,
            signInURL,
            frame,
            setStatus,
          );
          setStatus(cancel.current ? 'pending' : 'blocked');
        }}
      >
        {t('Sign in with MorningStar')}
      </Button>
      {status in messages && (
        <Alert
          type={status === 'signed-in' ? 'success' : 'warning'}
          showIcon
          message={t(messages[status as keyof typeof messages])}
        />
      )}
    </div>
  );
}

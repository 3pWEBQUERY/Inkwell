'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { pollExport, requestExport } from '@/features/posts/actions';
import { buildExportDownload } from '@/features/posts/export-client';

type State = 'idle' | 'preparing' | 'decrypting' | 'ready' | 'failed';

/**
 * Starts the server-side part, polls until it is ready, then merges the
 * decrypted private entries in the browser and offers the download.
 */
export function ExportButton() {
  const t = useTranslations('journal.export');
  const [state, setState] = useState<State>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const start = async () => {
    setState('preparing');
    const requested = await requestExport();
    if (!requested.ok) return setState('failed');
    const id = requested.data.id;
    const poll = async (attempt: number) => {
      const status = await pollExport(id);
      if (!status.ok || status.data.status === 'failed' || attempt > 60) return setState('failed');
      if (status.data.status !== 'ready' || !status.data.downloadUrl) {
        timer.current = setTimeout(() => void poll(attempt + 1), 3000);
        return;
      }
      setState('decrypting');
      try {
        const blob = await buildExportDownload(status.data.downloadUrl);
        setUrl(URL.createObjectURL(blob));
        setState('ready');
      } catch {
        setState('failed');
      }
    };
    await poll(0);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-ink-secondary">{t('explain')}</p>
      {state === 'ready' && url ? (
        <a
          href={url}
          download="inkwell-export.zip"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-accent px-4 font-medium text-accent-ink"
        >
          <Icon name="download" size={18} />
          {t('download')}
        </a>
      ) : (
        <Button
          variant="secondary"
          className="w-fit"
          onClick={() => void start()}
          busy={state === 'preparing' || state === 'decrypting'}
        >
          <Icon name="download" size={18} />
          {state === 'preparing'
            ? t('preparing')
            : state === 'decrypting'
              ? t('decrypting')
              : t('button')}
        </Button>
      )}
      {state === 'failed' ? (
        <p role="alert" className="text-[13px] text-warn">
          {t('failed')}
        </p>
      ) : null}
    </div>
  );
}

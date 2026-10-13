'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { Avatar, AVATAR_SHAPES, AVATAR_TONES } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/components/ui/error-text';
import { Overlay } from '@/components/ui/overlay';
import { updateMe, uploadAvatar } from '@/features/posts/actions';
import { cn } from '@/lib/cn';

/** A generic shape from the set, or an own photo (2 MB, resized to 512 px on the server). */
export function AvatarPicker({
  current,
  userId,
  pseudonym,
}: {
  current: string;
  userId: string;
  pseudonym: string;
}) {
  const t = useTranslations('me.avatar');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const fileRef = useRef<HTMLInputElement>(null);

  const choose = (avatar: string) => {
    startTransition(async () => {
      const result = await updateMe({ avatar });
      if (!result.ok) return announce(message(result.error) ?? '');
      setOpen(false);
    });
  };

  const upload = (file: File) => {
    const form = new FormData();
    form.append('file', file);
    startTransition(async () => {
      const result = await uploadAvatar(form);
      if (!result.ok) return announce(message(result.error) ?? '');
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('change')}
        className="rounded-full outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        <Avatar avatar={current} pseudonym={pseudonym} userId={userId} size={72} />
      </button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={t('change')}
        closeLabel={common('close')}
      >
        <p className="text-sm text-ink-secondary">{t('shapes')}</p>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {AVATAR_SHAPES.flatMap((shape) =>
            Array.from({ length: AVATAR_TONES }, (_, tone) => {
              const value = `shape:${shape}-${tone + 1}`;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => choose(value)}
                  aria-pressed={current === value}
                  aria-label={value}
                  className={cn('rounded-full p-0.5', current === value && 'ring-2 ring-accent')}
                >
                  <Avatar avatar={value} size={40} />
                </button>
              );
            }),
          )}
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            busy={pending}
          >
            {t('upload')}
          </Button>
          <p className="mt-2 text-[13px] text-ink-secondary">{t('hint')}</p>
        </div>
      </Overlay>
    </>
  );
}

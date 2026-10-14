'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useTransition } from 'react';

import { REPORT_REASONS, type FeedPost, type ReportReason } from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/components/ui/error-text';
import { Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Overlay } from '@/components/ui/overlay';
import { publicEnv } from '@/env';
import { blockFrom, reportContent } from '@/features/posts/actions';
import { Link, useRouter } from '@/i18n/navigation';

/** Top-right menu: report, block, copy link (profile texts only), edit (author only). */
export function PostMenu({ post }: { post: FeedPost }) {
  const t = useTranslations('reading');
  const report = useTranslations('report');
  const common = useTranslations('common');
  const me = useMe();
  const router = useRouter();
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [freeText, setFreeText] = useState('');
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const shareable = post.visibility === 'public' && !post.expiresAt;

  const copyLink = async () => {
    setOpen(false);
    if (!shareable) return announce(t('noLink'));
    try {
      await navigator.clipboard.writeText(`${publicEnv.appOrigin}/posts/${post.id}`);
      announce(t('linkCopied'));
    } catch {
      announce(message('INTERNAL') ?? '');
    }
  };

  const block = () => {
    setOpen(false);
    if (!me) return router.push('/sign-in');
    startTransition(async () => {
      const result = await blockFrom('post', post.id);
      if (!result.ok) return announce(message(result.error) ?? '');
      announce(t('blocked'));
      router.back();
    });
  };

  const sendReport = () => {
    if (!reason) return;
    startTransition(async () => {
      const result = await reportContent({
        targetType: 'post',
        targetId: post.id,
        reason,
        freeText: freeText || undefined,
      });
      setReporting(false);
      if (!result.ok)
        return announce(
          result.error === 'ALREADY_REPORTED' ? report('already') : (message(result.error) ?? ''),
        );
      announce(reason === 'self_harm_other' ? report('selfHarmAck') : report('sent'));
      setReason(null);
      setFreeText('');
    });
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('menu')}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
      >
        <Icon name="more" />
      </button>
      {open ? (
        <div
          role="menu"
          className="float absolute top-full right-0 z-20 mt-1.5 w-60 rounded-lg p-1.5"
        >
          {post.viewer.isAuthor ? (
            <Link
              href={`/write?edit=${post.id}`}
              role="menuitem"
              className="block rounded-md px-3 py-2 text-[0.9375rem] hover:bg-paper-raised"
            >
              {t('edit')}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="block w-full rounded-md px-3 py-2 text-left text-[0.9375rem] hover:bg-paper-raised"
          >
            {t('copyLink')}
          </button>
          {!post.viewer.isAuthor ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  if (!me) return router.push('/sign-in');
                  setReporting(true);
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-[0.9375rem] hover:bg-paper-raised"
              >
                {t('report')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={block}
                className="block w-full rounded-md px-3 py-2 text-left text-[0.9375rem] text-warn hover:bg-warn-soft"
              >
                {t('block')}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <Overlay
        open={reporting}
        onClose={() => setReporting(false)}
        title={report('title')}
        closeLabel={common('close')}
      >
        <div className="flex flex-col gap-1" role="radiogroup" aria-label={report('title')}>
          {REPORT_REASONS.map((option) => (
            <div key={option}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-paper-raised">
                <input
                  type="radio"
                  name="reason"
                  value={option}
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="h-4 w-4 accent-accent"
                />
                <span>{report(`reasons.${option}`)}</span>
              </label>
            </div>
          ))}
        </div>
        <Textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value.slice(0, 500))}
          placeholder={report('freeText')}
          aria-label={report('freeText')}
          className="mt-3"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setReporting(false)}>
            {common('cancel')}
          </Button>
          <Button onClick={sendReport} disabled={!reason} busy={pending}>
            {report('send')}
          </Button>
        </div>
      </Overlay>
    </div>
  );
}

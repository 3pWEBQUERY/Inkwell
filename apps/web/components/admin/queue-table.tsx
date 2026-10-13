'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import {
  MODERATION_ACTIONS,
  type Locale,
  type ModerationAction,
  type ModerationQueueItem,
} from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/components/ui/error-text';
import { Textarea } from '@/components/ui/field';
import { applyModerationAction } from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { relativeBucket } from '@/lib/format';

/** The review queue: priority first, then age. Every action needs a plain-language note except "keep". */
export function QueueTable({ items }: { items: ModerationQueueItem[] }) {
  const t = useTranslations('admin');
  const report = useTranslations('report');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<ModerationAction>('keep');
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  const apply = (flagId: string) => {
    startTransition(async () => {
      const result = await applyModerationAction(flagId, action, note.trim());
      if (!result.ok) return announce(message(result.error) ?? '');
      announce(t('applied'));
      setSelected(null);
      setNote('');
      setAction('keep');
      router.refresh();
    });
  };

  if (items.length === 0) return <p className="text-ink-secondary">{t('empty')}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[13px] text-ink-secondary">
            <th className="py-2 pr-3">{t('columns.priority')}</th>
            <th className="py-2 pr-3">{t('columns.reason')}</th>
            <th className="py-2 pr-3">{t('columns.reports')}</th>
            <th className="py-2 pr-3">{t('columns.preview')}</th>
            <th className="py-2 pr-3">{t('columns.room')}</th>
            <th className="py-2 pr-3">{t('columns.age')}</th>
            <th className="py-2">{t('columns.history')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const relative = relativeBucket(item.createdAt);
            const open = selected === item.id;
            return (
              <tr
                key={item.id}
                className={cn(
                  'cursor-pointer border-b border-line align-top',
                  open && 'bg-paper-raised',
                )}
                onClick={() => setSelected(open ? null : item.id)}
              >
                <td className="py-3 pr-3">
                  <span
                    className={cn(
                      'rounded-sm px-1.5 py-0.5 text-[12px]',
                      item.priority === 1
                        ? 'bg-warn-soft text-warn'
                        : item.priority === 2
                          ? 'bg-accent-soft'
                          : 'bg-paper-sunken',
                    )}
                  >
                    {t(`priorityLabel.${item.priority}`)}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  {report(`reasons.${item.reason}`)}
                  {item.freeText ? (
                    <span className="block text-[13px] text-ink-secondary">{item.freeText}</span>
                  ) : null}
                </td>
                <td className="py-3 pr-3">{item.reportCount}</td>
                <td className="max-w-md py-3 pr-3">
                  <span className="line-clamp-3 font-serif text-[15px]">{item.preview}</span>
                  {open ? (
                    <div
                      className="mt-3 flex flex-col gap-3"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      role="presentation"
                    >
                      <div className="flex flex-wrap gap-2">
                        {MODERATION_ACTIONS.map((candidate) => (
                          <button
                            key={candidate}
                            type="button"
                            aria-pressed={action === candidate}
                            onClick={() => setAction(candidate)}
                            className={cn(
                              'h-9 rounded-md border px-3 text-sm state-toggle',
                              action === candidate
                                ? 'border-accent bg-accent-soft'
                                : 'border-line-strong text-ink-secondary',
                            )}
                          >
                            {t(`actions.${candidate}`)}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={t('note')}
                        aria-label={t('note')}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => apply(item.id)}
                          disabled={action !== 'keep' && note.trim().length === 0}
                          busy={pending}
                        >
                          {t('apply')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                          {common('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </td>
                <td className="py-3 pr-3">{item.roomName ?? '—'}</td>
                <td className="py-3 pr-3 whitespace-nowrap">
                  {relative.key === 'justNow'
                    ? common('relative.justNow')
                    : common(`relative.${relative.key}`, { count: relative.count })}
                  <span className="sr-only">{locale}</span>
                </td>
                <td className="py-3 text-[13px] text-ink-secondary">
                  {t('history', {
                    warnings: item.accountHistory.warnings,
                    suspensions: item.accountHistory.suspensions,
                    flags: item.accountHistory.previousFlags,
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

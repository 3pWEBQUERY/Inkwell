'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import {
  LETTER_DELAYS,
  LIMITS,
  type Expiry,
  type LetterDelay,
  type PostType,
  type Visibility,
} from '@inkwell/shared';

import { Button } from '@/components/ui/button';
import { ErrorText } from '@/components/ui/error-text';
import { Input } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import type { OwnSeries, RoomView } from '@/features/posts/queries';

export interface CompletionChoice {
  type: PostType;
  visibility: Visibility;
  roomId: string | null;
  expiry: Expiry;
  commentsEnabled: boolean;
  seriesId: string | null;
  newSeriesTitle: string | null;
  /** Private only: seal the entry as a letter to one's later self. */
  sealFor: LetterDelay | null;
}

interface CompletionPanelProps {
  rooms: RoomView[];
  series: OwnSeries[];
  wordCount: number;
  hasTitle: boolean;
  charCount: number;
  defaults: { visibility: Visibility; expiry: Expiry };
  /** Opened from a room's "write here": that room is chosen once the text is shared. */
  initialRoomId?: string | null;
  canEncrypt: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (choice: CompletionChoice) => void;
}

const VISIBILITY_ICON: Record<Visibility, IconName> = {
  private: 'lock',
  anonymous: 'mask',
  public: 'globe',
};

/**
 * Every decision about visibility happens here, after writing. Type is
 * pre-selected from length and title; the room list unfolds when sharing.
 */
export function CompletionPanel({
  rooms,
  series,
  wordCount,
  hasTitle,
  charCount,
  defaults,
  initialRoomId,
  canEncrypt,
  busy,
  error,
  onSubmit,
}: CompletionPanelProps) {
  const t = useTranslations('completion');
  const editor = useTranslations('editor');
  const [type, setType] = useState<PostType>(
    wordCount > LIMITS.storyWordThreshold || hasTitle ? 'story' : 'thought',
  );
  const [visibility, setVisibility] = useState<Visibility>(
    defaults.visibility === 'anonymous' && type === 'story' ? 'public' : defaults.visibility,
  );
  const [roomId, setRoomId] = useState<string | null>(initialRoomId ?? null);
  const [roomQuery, setRoomQuery] = useState('');
  const [expiry, setExpiry] = useState<Expiry>(defaults.expiry);
  const [commentsEnabled, setCommentsEnabled] = useState<boolean | null>(null);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [sealFor, setSealFor] = useState<LetterDelay | null>(null);

  const sharing = visibility !== 'private';
  const kind = type === 'story' ? 'fiction' : 'reflection';
  const candidateRooms = useMemo(() => {
    const needle = roomQuery.trim().toLowerCase();
    return rooms.filter(
      (room) =>
        room.joined &&
        room.kind === kind &&
        (needle === '' || room.name.toLowerCase().includes(needle)),
    );
  }, [rooms, kind, roomQuery]);

  const comments = commentsEnabled ?? visibility === 'public';
  const tooShort = sharing && charCount < LIMITS.sharedPostMinChars;
  const titleMissing = type === 'story' && !hasTitle;
  const privateBlocked = visibility === 'private' && !canEncrypt;
  const disabled = busy || (sharing && !roomId) || tooShort || titleMissing || privateBlocked;

  const choose = (next: Visibility) => {
    if (next === 'anonymous' && type === 'story') return;
    setVisibility(next);
  };

  const chooseType = (next: PostType) => {
    setType(next);
    setRoomId(null);
    if (next === 'story' && visibility === 'anonymous') setVisibility('public');
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        onSubmit({
          type,
          visibility,
          roomId: sharing ? roomId : null,
          expiry: sharing ? expiry : 'none',
          commentsEnabled: sharing ? comments : false,
          seriesId: sharing && type === 'story' && visibility === 'public' ? seriesId : null,
          newSeriesTitle: seriesId === 'new' ? newSeriesTitle.trim() || null : null,
          sealFor: sharing ? null : sealFor,
        });
      }}
    >
      <fieldset>
        <legend className="label">{t('type.label')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['thought', 'story'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              onClick={() => chooseType(option)}
              className={cn(
                'h-11 rounded-md border font-medium state-toggle',
                type === option
                  ? 'border-accent bg-accent-tint text-ink shadow-[inset_0_0_0_1px_var(--color-accent)]'
                  : 'border-line-strong bg-surface text-ink-secondary hover:border-ink-tertiary/60 hover:text-ink',
              )}
            >
              {t(`type.${option}`)}
            </button>
          ))}
        </div>
        {titleMissing ? <p className="mt-2 text-[13px] text-warn">{t('titleRequired')}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="label">{t('visibility.label')}</legend>
        <div className="mt-2 flex flex-col gap-2">
          {(['private', 'anonymous', 'public'] as const).map((option) => {
            const greyed = option === 'anonymous' && type === 'story';
            return (
              <button
                key={option}
                type="button"
                aria-pressed={visibility === option}
                aria-disabled={greyed}
                onClick={() => choose(option)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3.5 text-left state-toggle',
                  visibility === option
                    ? 'border-accent bg-accent-tint text-ink shadow-[inset_0_0_0_1px_var(--color-accent)]'
                    : 'border-line-strong bg-surface hover:border-ink-tertiary/60',
                  greyed && 'opacity-40',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md state-toggle',
                    visibility === option
                      ? 'bg-accent text-accent-ink'
                      : 'bg-paper-sunken text-ink-secondary',
                  )}
                >
                  <Icon name={VISIBILITY_ICON[option]} size={17} />
                </span>
                <span>
                  <span className="block font-medium">{t(`visibility.${option}.title`)}</span>
                  <span className="block text-[13px] text-ink-secondary">
                    {greyed ? t('visibility.anonymousDisabled') : t(`visibility.${option}.body`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {privateBlocked ? (
          <p className="mt-2 text-[13px] text-warn">{editor('unlockToWrite')}</p>
        ) : null}
      </fieldset>

      <div
        className="grid transition-[grid-template-rows]"
        style={{
          gridTemplateRows: sharing ? '0fr' : '1fr',
          transitionDuration: 'var(--motion-base)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        <div className="overflow-hidden">
          <fieldset disabled={sharing}>
            <legend className="label flex items-center gap-1.5">
              <Icon name="envelope" size={14} />
              {t('letter.label')}
            </legend>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {([null, ...LETTER_DELAYS] as const).map((option) => (
                <button
                  key={option ?? 'none'}
                  type="button"
                  aria-pressed={sealFor === option}
                  onClick={() => setSealFor(option)}
                  className={cn(
                    'h-10 rounded-md border text-[0.8125rem] font-medium state-toggle',
                    sealFor === option
                      ? 'border-accent bg-accent-tint text-ink shadow-[inset_0_0_0_1px_var(--color-accent)]'
                      : 'border-line-strong bg-surface text-ink-secondary hover:border-ink-tertiary/60 hover:text-ink',
                  )}
                >
                  {t(`letter.${option ?? 'none'}`)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink-secondary">
              {sealFor ? t('letter.hint') : t('letter.intro')}
            </p>
          </fieldset>
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows]"
        style={{
          gridTemplateRows: sharing ? '1fr' : '0fr',
          transitionDuration: 'var(--motion-base)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        <div className="flex flex-col gap-6 overflow-hidden">
          <fieldset>
            <legend className="label">{t('room.label')}</legend>
            {rooms.some((room) => room.joined && room.kind === kind) ? (
              <>
                <Input
                  type="search"
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  placeholder={t('room.search')}
                  aria-label={t('room.search')}
                  className="mt-2"
                />
                <ul className="mt-2 max-h-48 divide-y divide-line overflow-y-auto rounded-lg border border-line bg-surface">
                  {candidateRooms.map((room) => (
                    <li key={room.id}>
                      <button
                        type="button"
                        aria-pressed={roomId === room.id}
                        onClick={() => setRoomId(room.id)}
                        className={cn(
                          'flex min-h-11 w-full items-center justify-between px-3.5 text-left state-toggle',
                          roomId === room.id
                            ? 'bg-accent-tint font-medium'
                            : 'hover:bg-paper-raised',
                        )}
                      >
                        <span>{room.name}</span>
                        {roomId === room.id ? (
                          <Icon name="check" size={16} className="text-accent-text" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-ink-secondary">
                {t('room.none')}{' '}
                <Link
                  href={`/rooms?kind=${kind}`}
                  className="text-accent-text underline-offset-4 hover:underline"
                >
                  {t('room.browse')}
                </Link>
              </p>
            )}
            {tooShort ? <p className="mt-2 text-[13px] text-warn">{t('tooShort')}</p> : null}
          </fieldset>

          <fieldset>
            <legend className="label">{t('expiry.label')}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['none', '24h', '7d'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={expiry === option}
                  onClick={() => setExpiry(option)}
                  className={cn(
                    'h-11 rounded-md border font-medium state-toggle',
                    expiry === option
                      ? 'border-accent bg-accent-tint text-ink shadow-[inset_0_0_0_1px_var(--color-accent)]'
                      : 'border-line-strong bg-surface text-ink-secondary hover:border-ink-tertiary/60 hover:text-ink',
                  )}
                >
                  {t(`expiry.${option}`)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink-secondary">{t('expiry.hint')}</p>
          </fieldset>

          <Switch checked={comments} onChange={setCommentsEnabled} label={t('comments.label')} />

          {type === 'story' && visibility === 'public' ? (
            <fieldset>
              <legend className="label">{t('series.label')}</legend>
              <select
                value={seriesId ?? ''}
                onChange={(e) => setSeriesId(e.target.value || null)}
                aria-label={t('series.label')}
                className="mt-2 h-11 w-full rounded-md border border-line-strong bg-surface px-3"
              >
                <option value="">{t('series.none')}</option>
                {series.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} · {t('series.chapterHint', { chapter: item.chapterCount + 1 })}
                  </option>
                ))}
                <option value="new">{t('series.new')}</option>
              </select>
              {seriesId === 'new' ? (
                <Input
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder={t('series.newTitle')}
                  aria-label={t('series.newTitle')}
                  className="mt-2"
                />
              ) : null}
            </fieldset>
          ) : null}
        </div>
      </div>

      <ErrorText code={error} />
      <Button type="submit" size="lg" disabled={disabled} busy={busy}>
        {sealFor && !sharing ? t('submit.sealed') : t(`submit.${visibility}`)}
      </Button>
    </form>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { LIMITS, type CommentView, type FeedPost } from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/components/ui/error-text';
import { Field, Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { createComment, removeComment, updatePost } from '@/features/posts/actions';
import { Link, useRouter } from '@/i18n/navigation';
import { relativeBucket } from '@/lib/format';

interface CommentsProps {
  post: FeedPost;
  comments: CommentView[];
}

/**
 * Flat, chronological, at most 2000 characters. Reflection rooms get a plain
 * reply box; fiction rooms require both feedback fields before sending.
 */
export function Comments({ post, comments }: CommentsProps) {
  const t = useTranslations('comments');
  const common = useTranslations('common');
  const me = useMe();
  const router = useRouter();
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState('');
  const [worked, setWorked] = useState('');
  const [unclear, setUnclear] = useState('');
  const feedbackMode = post.room.kind === 'fiction';

  const submit = () => {
    if (!me) return router.push('/sign-in');
    startTransition(async () => {
      const input = feedbackMode ? { mode: 'feedback', worked, unclear } : { mode: 'reply', body };
      const result = await createComment(post.id, input);
      if (!result.ok) return announce(message(result.error) ?? '');
      setBody('');
      setWorked('');
      setUnclear('');
      announce(common('sent'));
      router.refresh();
    });
  };

  const toggleComments = () => {
    startTransition(async () => {
      const result = await updatePost(post.id, { commentsEnabled: !post.commentsEnabled });
      if (!result.ok) return announce(message(result.error) ?? '');
      router.refresh();
    });
  };

  const remove = (commentId: string) => {
    startTransition(async () => {
      const result = await removeComment(post.id, commentId);
      if (!result.ok) return announce(message(result.error) ?? '');
      router.refresh();
    });
  };

  const canSend = feedbackMode
    ? worked.trim().length > 0 && unclear.trim().length > 0
    : body.trim().length > 0;

  return (
    <section className="mt-10 border-t border-line pt-6" aria-labelledby="comments-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="comments-title" className="font-serif text-xl">
          {feedbackMode ? t('feedback.title') : t('title')}
        </h2>
        {post.viewer.isAuthor ? (
          <button
            type="button"
            onClick={toggleComments}
            className="text-sm text-ink-secondary hover:text-ink"
          >
            {post.commentsEnabled ? t('disableAll') : t('enableAll')}
          </button>
        ) : null}
      </div>

      {comments.length === 0 ? <p className="mt-4 text-ink-secondary">{t('empty')}</p> : null}
      <ol className="mt-4 flex flex-col divide-y divide-line">
        {comments.map((comment) => {
          const relative = relativeBucket(comment.createdAt);
          return (
            <li key={comment.id} className="py-4">
              <div className="flex items-center gap-2 text-[13px] text-ink-secondary">
                {comment.author ? (
                  <span className="flex items-center gap-1.5">
                    <Avatar avatar={comment.author.avatar} size={16} />
                    {comment.author.pseudonym}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Icon name="mask" size={14} />
                    {common('anonymous')}
                  </span>
                )}
                <span aria-hidden>·</span>
                <time dateTime={comment.createdAt}>
                  {relative.key === 'justNow'
                    ? common('relative.justNow')
                    : common(`relative.${relative.key}`, { count: relative.count })}
                </time>
                {comment.hidden ? <span className="text-ink-tertiary">· {t('hidden')}</span> : null}
                {comment.isOwn || post.viewer.isAuthor ? (
                  <button
                    type="button"
                    onClick={() => remove(comment.id)}
                    className="ml-auto text-ink-tertiary hover:text-warn"
                  >
                    {comment.isOwn ? t('delete') : t('hide')}
                  </button>
                ) : null}
              </div>
              {comment.mode === 'feedback' ? (
                <dl className="mt-2 grid gap-2 text-[15px]">
                  <div>
                    <dt className="text-[13px] text-ink-tertiary">{t('feedback.worked')}</dt>
                    <dd className="whitespace-pre-wrap">{comment.worked}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-tertiary">{t('feedback.unclear')}</dt>
                    <dd className="whitespace-pre-wrap">{comment.unclear}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-[15px]">{comment.body}</p>
              )}
            </li>
          );
        })}
      </ol>

      {post.commentsEnabled ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {feedbackMode ? (
            <>
              <Field label={t('feedback.worked')}>
                {({ id, describedBy }) => (
                  <Textarea
                    id={id}
                    aria-describedby={describedBy}
                    value={worked}
                    maxLength={LIMITS.commentMaxChars}
                    onChange={(e) => setWorked(e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('feedback.unclear')} hint={t('feedback.both')}>
                {({ id, describedBy }) => (
                  <Textarea
                    id={id}
                    aria-describedby={describedBy}
                    value={unclear}
                    maxLength={LIMITS.commentMaxChars}
                    onChange={(e) => setUnclear(e.target.value)}
                  />
                )}
              </Field>
            </>
          ) : (
            <Textarea
              value={body}
              maxLength={LIMITS.commentMaxChars}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('placeholder')}
              aria-label={t('title')}
            />
          )}
          <div className="flex items-center justify-between">
            <Link
              href={`/rooms/${post.room.slug}`}
              className="text-sm text-ink-secondary hover:text-ink"
            >
              {t('rules')}
            </Link>
            <Button type="submit" disabled={!canSend} busy={pending}>
              {feedbackMode ? t('feedback.send') : t('send')}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-tertiary">{t('disabled')}</p>
      )}
    </section>
  );
}

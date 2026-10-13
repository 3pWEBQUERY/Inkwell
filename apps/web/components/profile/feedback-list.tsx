import { getLocale, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

import type { FeedbackLine } from '@/features/posts/queries';
import type { Locale } from '@inkwell/shared';

/** One line per shared text, aggregated and nameless. Only the author sees this. */
export async function FeedbackList({ items }: { items: FeedbackLine[] }) {
  const t = await getTranslations('me');
  const locale = (await getLocale()) as Locale;
  if (items.length === 0) return <p className="text-ink-secondary">{t('noFeedback')}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.postId} className="py-4">
          <Link href={`/posts/${item.postId}`} className="block">
            <span className="prose-reading line-clamp-1 text-[1.0625rem]">
              {item.title ?? item.preview}
            </span>
            <span className="mt-1 block text-[13px] text-ink-secondary">
              {formatDate(item.createdAt, locale, { day: 'numeric', month: 'short' })} ·{' '}
              {t('feedbackLine', {
                read: item.summary.read,
                felt: item.summary.felt,
                known: item.summary.known,
                thanks: item.summary.thanks,
              })}
              {item.summary.netVotes !== null
                ? ` · ${t('feedbackVotes', { net: item.summary.netVotes })}`
                : ''}
              {' · '}
              {t('feedbackComments', { count: item.summary.comments })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

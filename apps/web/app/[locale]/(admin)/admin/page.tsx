import { getTranslations } from 'next-intl/server';

import { QueueTable } from '@/components/admin/queue-table';
import { getModerationQueue } from '@/features/posts/queries';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin');
  return { title: t('title'), robots: { index: false } };
}

export default async function AdminQueuePage() {
  const t = await getTranslations('admin');
  const items = await getModerationQueue();
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">{t('title')}</h1>
      <QueueTable items={items} />
    </div>
  );
}

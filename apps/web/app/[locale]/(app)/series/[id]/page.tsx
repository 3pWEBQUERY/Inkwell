import { notFound } from 'next/navigation';

import { SeriesView } from '@/components/profile/series-view';
import { getSeries } from '@/features/posts/queries';

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const series = await getSeries(id);
  return { title: series?.title ?? '' };
}

export default async function SeriesPage({ params }: Props) {
  const { id } = await params;
  const series = await getSeries(id);
  if (!series) notFound();
  return <SeriesView series={series} readIds={[]} />;
}

import { WritePage } from '../../write/write-page';

export default async function InterceptedWrite({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    first?: string;
    edit?: string;
    editPrivate?: string;
    prompt?: string;
    room?: string;
  }>;
}) {
  const { locale } = await params;
  return <WritePage locale={locale} searchParams={await searchParams} intercepted />;
}

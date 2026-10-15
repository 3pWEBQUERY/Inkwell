import { LettersOnTheWay } from '@/components/journal/letters-on-the-way';
import { OnThisDay } from '@/components/journal/on-this-day';
import { ReviewCalendar } from '@/components/journal/review-calendar';
import { isDayKey } from '@/lib/format';

/** Journal context column: the month at a glance, this day in earlier months, letters on their way. */
export default async function JournalContext({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; view?: string }>;
}) {
  const { day, view } = await searchParams;
  if (view === 'kept' || view === 'drafts') return null;
  return (
    <div className="sticky top-12">
      <ReviewCalendar selected={isDayKey(day) ? day : null} />
      <OnThisDay />
      <LettersOnTheWay />
    </div>
  );
}

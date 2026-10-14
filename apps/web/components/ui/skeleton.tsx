import { cn } from '@/lib/cn';

/** Static lines in the final shape. No shimmer: PRD 13. */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['92%', '78%', '85%', '60%', '88%'];
  return (
    <div className={cn('flex flex-col gap-2.5', className)} aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{ width: widths[index % widths.length] }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5" aria-hidden>
      <div className="skeleton-line mb-3 w-24" />
      <SkeletonLines lines={3} />
      <div className="skeleton-line mt-3 w-32" />
    </div>
  );
}

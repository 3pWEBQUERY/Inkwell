import { SkeletonCard, SkeletonLines } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div>
      <SkeletonLines lines={1} className="mb-8 w-40" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

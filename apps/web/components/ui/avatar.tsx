import { cn } from '@/lib/cn';

const SHAPES: Record<string, string> = {
  leaf: 'M8 24c0-9 5-14 16-14-1 10-6 15-16 14z',
  stone: 'M9 12c3-5 11-5 14 0 2 4 1 9-3 11-4 2-10 1-12-3-1-3 0-6 1-8z',
  wave: 'M5 18c3-5 6-5 9 0s6 5 9 0M5 12c3-5 6-5 9 0s6 5 9 0',
  moon: 'M18 7a8 8 0 1 0 6 11 7 7 0 0 1-6-11z',
  seed: 'M16 8c5 4 7 10 3 15-4 3-9 1-11-4-1-5 3-9 8-11z',
  cloud: 'M9 21h11a4 4 0 0 0 0-8 6 6 0 0 0-11-2 5 5 0 0 0 0 10z',
  drop: 'M16 6c4 5 7 9 7 13a7 7 0 0 1-14 0c0-4 3-8 7-13z',
  feather: 'M8 24l12-12M24 6c-6 0-12 4-14 12l2 2c8-2 12-8 12-14z',
};

/** Earthy inks, all readable on paper and on the dark surface at 1.6 px. */
const TONES = ['#2f6bc4', '#3f8a6a', '#b8573f', '#a37a2c', '#5b7fa0', '#8a5f9a'];

interface AvatarProps {
  avatar: string;
  pseudonym?: string | null;
  size?: number;
  className?: string;
  /** Resolved on the server: uploads are served through /api/media. */
  userId?: string;
}

/** Generic shapes from a set, or an uploaded photo. Never initials, never a number. */
export function Avatar({ avatar, pseudonym, size = 40, className, userId }: AvatarProps) {
  if (avatar.startsWith('upload:') && userId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served through our own route with fixed size
      <img
        src={`/api/media/avatars/${userId}?v=${avatar.slice(7)}`}
        alt={pseudonym ?? ''}
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }
  const [, descriptor = 'leaf-1'] = avatar.split(':');
  const [shape = 'leaf', toneRaw = '1'] = descriptor.split('-');
  const tone = TONES[(Number.parseInt(toneRaw, 10) - 1) % TONES.length] ?? TONES[0];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={pseudonym ? 'img' : undefined}
      aria-label={pseudonym ?? undefined}
      aria-hidden={pseudonym ? undefined : true}
      className={cn('rounded-full', className)}
    >
      <circle cx="16" cy="16" r="16" fill={tone} opacity="0.14" />
      <path
        d={SHAPES[shape] ?? SHAPES.leaf}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const AVATAR_SHAPES = Object.keys(SHAPES);
export const AVATAR_TONES = TONES.length;

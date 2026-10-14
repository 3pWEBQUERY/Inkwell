import Image, { type ImageProps } from 'next/image';

import { cn } from '@/lib/cn';

type ThemeImageProps = Omit<ImageProps, 'src' | 'priority' | 'preload' | 'loading'> & {
  /** Path without extension; the dark variant lives next to it with a `-dark` suffix. */
  base: string;
  wrapperClassName?: string;
  /** Above the fold: the light variant loads at once with high priority. */
  eager?: boolean;
};

/**
 * A screenshot in the colour scheme the reader is looking at. Both variants
 * are in the markup; CSS shows one, and the hidden one is not fetched because
 * it is lazy and not displayed. Only the light variant is ever loaded eagerly;
 * no preload, because the largest element differs between phone and desktop.
 */
export function ThemeImage({
  base,
  wrapperClassName,
  eager = false,
  alt,
  ...rest
}: ThemeImageProps) {
  return (
    <>
      <span className={cn('theme-light-only', wrapperClassName)}>
        <Image
          src={`${base}.png`}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          {...rest}
        />
      </span>
      <span className={cn('theme-dark-only', wrapperClassName)}>
        <Image src={`${base}-dark.png`} alt={alt} loading="lazy" {...rest} />
      </span>
    </>
  );
}

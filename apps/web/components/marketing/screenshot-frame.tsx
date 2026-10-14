import { ThemeImage } from './theme-image';

/**
 * Real screenshots of the editor: a browser window on desktop with the phone
 * version resting on its corner, the phone alone on small screens. Static
 * images, no live demo, no invented interface.
 */
export function ScreenshotFrame({ alt }: { alt: string }) {
  return (
    <figure className="relative">
      <div className="hidden overflow-hidden rounded-xl border border-line-strong bg-surface md:block">
        <div
          className="flex h-10 items-center gap-2 border-b border-line bg-paper-sunken px-4"
          aria-hidden
        >
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="mx-auto h-6 w-72 rounded-md border border-line bg-surface" />
          <span className="w-[52px]" />
        </div>
        <ThemeImage
          base="/images/editor-desktop"
          alt={alt}
          width={1440}
          height={900}
          eager
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="block aspect-[16/9] h-auto w-full object-cover object-top"
        />
      </div>
      <div className="mx-auto w-[260px] overflow-hidden rounded-[34px] border-[7px] border-night bg-night md:absolute md:right-10 md:-bottom-14 md:mx-0 md:w-[200px] md:shadow-[var(--shadow-float)] lg:w-[220px]">
        <ThemeImage
          base="/images/editor-mobile"
          alt={alt}
          width={390}
          height={664}
          eager
          sizes="(min-width: 768px) 220px, 260px"
          className="block h-auto w-full rounded-[27px]"
        />
      </div>
    </figure>
  );
}

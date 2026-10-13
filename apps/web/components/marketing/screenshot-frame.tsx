import Image from 'next/image';

/**
 * One real screenshot of the editor, in a browser frame on desktop and a phone
 * frame on small screens. Static images, no live demo.
 */
export function ScreenshotFrame({ alt }: { alt: string }) {
  return (
    <figure className="mx-auto mt-12 w-full max-w-4xl">
      <div className="hidden overflow-hidden rounded-lg border border-line bg-paper-raised md:block">
        <div className="flex h-9 items-center gap-1.5 border-b border-line px-3" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 h-5 flex-1 rounded-sm bg-paper-sunken" />
        </div>
        <Image
          src="/images/editor-desktop.png"
          alt={alt}
          width={1440}
          height={900}
          priority
          sizes="(min-width: 768px) 896px, 100vw"
          className="block h-auto w-full"
        />
      </div>
      <div className="mx-auto w-[280px] overflow-hidden rounded-[32px] border-[6px] border-paper-sunken bg-paper-raised md:hidden">
        <Image
          src="/images/editor-mobile.png"
          alt={alt}
          width={390}
          height={664}
          priority
          sizes="280px"
          className="block h-auto w-full"
        />
      </div>
    </figure>
  );
}

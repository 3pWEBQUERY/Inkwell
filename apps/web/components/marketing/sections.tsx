import { useTranslations } from 'next-intl';

import { Icon, type IconName } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { site } from '@/lib/site';

import { Reveal } from './reveal';
import { ScreenshotFrame } from './screenshot-frame';
import { ThemeImage } from './theme-image';

import type { ReactNode } from 'react';

export const CONTAINER = 'mx-auto w-full max-w-6xl px-5 md:px-8';

const BUTTON =
  'inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-base font-medium state-toggle';
const PRIMARY = `${BUTTON} bg-accent text-accent-ink hover:bg-accent-hover`;
const SECONDARY = `${BUTTON} border border-line-strong bg-surface text-ink hover:bg-paper-raised`;

/** The headline ends in the same ink dot as the wordmark. */
function InkDot({ text }: { text: string }) {
  if (!text.endsWith('.')) return <>{text}</>;
  return (
    <>
      {text.slice(0, -1)}
      <span className="text-accent">.</span>
    </>
  );
}

function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="display max-w-[20ch] text-[2.25rem] md:text-[3rem]">
      {children}
    </h2>
  );
}

function IconTile({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-[12px] bg-accent-tint text-accent-text',
        className,
      )}
    >
      <Icon name={name} size={21} />
    </span>
  );
}

export function Hero() {
  const t = useTranslations('marketing.hero');
  const common = useTranslations('common');
  return (
    <section className="overflow-hidden pb-24 md:pb-32">
      <div className={cn(CONTAINER, 'pt-14 md:pt-24')}>
        <h1 className="display max-w-[18ch] text-[3.25rem] leading-[1] md:text-[5.5rem]">
          <InkDot text={t('title')} />
        </h1>
        <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16">
          <p className="max-w-[44ch] text-lg leading-relaxed text-pretty text-ink-secondary md:text-xl">
            {t('subtitle')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-in?intent=create" className={PRIMARY}>
              {common('createAccount')}
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link href="/rooms" className={SECONDARY}>
              {common('readOnly')}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-[0.875rem] text-ink-tertiary">{t('note')}</p>
      </div>
      <div className={cn(CONTAINER, 'mt-14 md:mt-20')}>
        <ScreenshotFrame alt={t('screenshotAlt')} />
      </div>
    </section>
  );
}

export function Promises() {
  const t = useTranslations('marketing.promises');
  const items: { key: 'noPressure' | 'noAlgorithm' | 'noReaders'; icon: IconName }[] = [
    { key: 'noPressure', icon: 'leaf' },
    { key: 'noAlgorithm', icon: 'clock' },
    { key: 'noReaders', icon: 'lock' },
  ];
  return (
    <section className={cn(CONTAINER, 'pb-24 md:pb-32')} aria-labelledby="promises">
      <h2 id="promises" className="sr-only">
        {t('title')}
      </h2>
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.key} delay={index * 60} className="bg-surface p-7 md:p-9">
            <IconTile name={item.icon} />
            <h3 className="mt-6 font-serif text-[1.625rem] leading-tight font-medium tracking-[-0.015em]">
              {t(`${item.key}.title`)}
            </h3>
            <p className="mt-3 leading-relaxed text-pretty text-ink-secondary">
              {t(`${item.key}.body`)}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const t = useTranslations('marketing.how');
  const steps = ['write', 'decide', 'letGo', 'beRead'] as const;
  return (
    <section id="how" className="scroll-mt-20 border-t border-line bg-paper-sunken/60">
      <div className={cn(CONTAINER, 'py-24 md:py-32')}>
        <SectionTitle>{t('title')}</SectionTitle>
        <ol className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step} className="card flex flex-col overflow-hidden">
              <div className="border-b border-line bg-paper-sunken px-6 pt-6 md:px-8 md:pt-8">
                <div className="overflow-hidden rounded-t-[10px] border border-b-0 border-line bg-paper">
                  <ThemeImage
                    base={`/images/step-${index + 1}`}
                    alt=""
                    width={640}
                    height={400}
                    sizes="(min-width: 768px) 560px, 100vw"
                    className="block aspect-[16/9] h-auto w-full object-cover object-top"
                  />
                </div>
              </div>
              <div className="flex gap-5 p-6 md:p-8">
                <span className="font-serif text-[1.75rem] leading-none font-medium text-accent-text tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.01em]">
                    {t(`steps.${step}.title`)}
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-pretty text-ink-secondary">
                    {t(`steps.${step}.body`)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ExamplePost({
  room,
  author,
  title,
  body,
  anonymous,
}: {
  room: string;
  author: string;
  title?: string;
  body: string;
  anonymous: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <p className="flex items-center gap-2 text-[13px] text-ink-secondary">
        <span
          aria-hidden
          className={cn(
            'flex h-[22px] w-[22px] items-center justify-center rounded-full',
            anonymous ? 'bg-paper-sunken text-ink-secondary' : 'bg-accent-soft text-accent-text',
          )}
        >
          <Icon name={anonymous ? 'mask' : 'leaf'} size={13} />
        </span>
        <span className="font-medium text-ink">{author}</span>
        <span aria-hidden>·</span>
        <span>{room}</span>
      </p>
      {title ? (
        <p className="mt-3 font-serif text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]">
          {title}
        </p>
      ) : null}
      <p className={cn('prose-reading text-[1.0625rem]', title ? 'mt-1.5' : 'mt-3')}>{body}</p>
    </div>
  );
}

export function RoomsPreview() {
  const t = useTranslations('marketing.rooms');
  const common = useTranslations('common');
  return (
    <section className={cn(CONTAINER, 'py-24 md:py-32')}>
      <SectionTitle>{t('title')}</SectionTitle>
      <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2">
        <article className="card flex flex-col gap-6 p-6 md:p-8">
          <div>
            <IconTile name="leaf" />
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em]">
              {t('reflection.title')}
            </h3>
            <p className="mt-1.5 text-pretty text-ink-secondary">{t('reflection.body')}</p>
          </div>
          <ExamplePost
            anonymous
            author={common('anonymous')}
            room={t('reflection.exampleRoom')}
            body={t('reflection.example')}
          />
        </article>
        <article className="card flex flex-col gap-6 p-6 md:p-8">
          <div>
            <IconTile name="book" />
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em]">{t('fiction.title')}</h3>
            <p className="mt-1.5 text-pretty text-ink-secondary">{t('fiction.body')}</p>
          </div>
          <ExamplePost
            anonymous={false}
            author="stille.birke"
            room={t('fiction.exampleRoom')}
            title={t('fiction.exampleTitle')}
            body={t('fiction.example')}
          />
        </article>
      </div>
    </section>
  );
}

export function Trust() {
  const t = useTranslations('marketing.trust');
  const doItems = t.raw('do.items') as string[];
  const dontItems = t.raw('dont.items') as string[];
  const link =
    'text-night-ink underline decoration-night-muted/60 underline-offset-4 hover:decoration-night-ink';
  return (
    <section id="trust" className="scroll-mt-20 bg-night text-night-ink">
      <div className={cn(CONTAINER, 'py-24 md:py-32')}>
        <SectionTitle>{t('title')}</SectionTitle>
        <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="text-[0.875rem] font-medium text-night-muted">{t('do.title')}</h3>
            <ul className="mt-4 divide-y divide-night-line border-y border-night-line">
              {doItems.map((item) => (
                <li key={item} className="flex gap-4 py-4 leading-relaxed">
                  <Icon name="check" className="mt-0.5 shrink-0 text-night-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[0.875rem] font-medium text-night-muted">{t('dont.title')}</h3>
            <ul className="mt-4 divide-y divide-night-line border-y border-night-line">
              {dontItems.map((item) => (
                <li key={item} className="flex gap-4 py-4 leading-relaxed">
                  <Icon name="close" className="mt-0.5 shrink-0 text-night-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 text-[0.875rem] text-night-muted">
          {t.rich('links', {
            privacy: (chunks) => (
              <Link href="/privacy" className={link}>
                {chunks}
              </Link>
            ),
            imprint: (chunks) => (
              <Link href="/imprint" className={link}>
                {chunks}
              </Link>
            ),
          })}
          {site.operatorName
            ? ` ${site.operatorName}${site.responsiblePerson ? `, ${site.responsiblePerson}` : ''}.`
            : ''}
        </p>
      </div>
    </section>
  );
}

/** "Name 143 · Name 147" → name and dialable number per line. */
function parseLines(raw: string): { name: string; number: string }[] {
  return raw.split(' · ').map((entry) => {
    const match = /^(.*?)\s([\d\s]+)$/.exec(entry.trim());
    return match
      ? { name: match[1] ?? entry, number: (match[2] ?? '').trim() }
      : { name: entry, number: '' };
  });
}

export function Safety() {
  const t = useTranslations('marketing.safety');
  const lines = parseLines(t('lines'));
  return (
    <section className={cn(CONTAINER, 'py-24 md:py-32')}>
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-16">
        <SectionTitle>{t('title')}</SectionTitle>
        <div>
          <p className="text-lg leading-relaxed text-pretty text-ink-secondary">{t('body')}</p>
          <p className="mt-6 border-l-2 border-accent pl-5 font-serif text-xl leading-snug text-pretty">
            {t('promise')}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {lines.map((line) => (
              <li key={line.name}>
                {line.number ? (
                  <a
                    href={`tel:${line.number.replace(/\s/g, '')}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[0.875rem] state-toggle hover:bg-paper-raised"
                  >
                    <Icon name="phone" size={15} className="text-ink-secondary" />
                    <span className="text-ink-secondary">{line.name}</span>
                    <span className="font-semibold tabular-nums">{line.number}</span>
                  </a>
                ) : (
                  <span className="text-[0.875rem] text-ink-secondary">{line.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function InstallAndPricing() {
  const install = useTranslations('marketing.install');
  const pricing = useTranslations('marketing.pricing');
  return (
    <section className={cn(CONTAINER, 'pb-24 md:pb-32')}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-7 md:p-9">
          <IconTile name="install" />
          <h2 className="mt-6 font-serif text-[1.625rem] leading-tight font-medium tracking-[-0.015em]">
            {install('title')}
          </h2>
          <p className="mt-3 leading-relaxed text-pretty text-ink-secondary">{install('body')}</p>
          <p className="mt-3 text-[0.875rem] text-ink-tertiary">{install('native')}</p>
        </div>
        <div className="card p-7 md:p-9">
          <IconTile name="leaf" />
          <h2 className="mt-6 font-serif text-[1.625rem] leading-tight font-medium tracking-[-0.015em]">
            {pricing('title')}
          </h2>
          <p className="mt-3 leading-relaxed text-pretty text-ink-secondary">{pricing('body')}</p>
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  const t = useTranslations('marketing.cta');
  return (
    <section className={cn(CONTAINER, 'pb-24 md:pb-32')}>
      <div className="flex flex-col items-center rounded-xl border border-line bg-paper-sunken px-6 py-16 text-center md:py-24">
        <h2 className="display max-w-[16ch] text-[2.5rem] md:text-[4rem]">
          <InkDot text={t('title')} />
        </h2>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/sign-in?intent=create" className={PRIMARY}>
            {t('button')}
            <Icon name="arrow-right" size={18} />
          </Link>
          <Link href="/sign-in" className={SECONDARY}>
            {t('link')}
          </Link>
        </div>
      </div>
    </section>
  );
}

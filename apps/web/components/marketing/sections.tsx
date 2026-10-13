import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Icon, type IconName } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { site } from '@/lib/site';

import { Reveal } from './reveal';
import { ScreenshotFrame } from './screenshot-frame';

export function Hero() {
  const t = useTranslations('marketing.hero');
  const common = useTranslations('common');
  return (
    <section className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-[640px]">
        <h1 className="font-serif text-4xl leading-tight text-balance md:text-6xl">{t('title')}</h1>
        <p className="mt-6 text-lg text-ink-secondary text-pretty md:text-xl">{t('subtitle')}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-in?intent=create"
            className="inline-flex h-12 items-center rounded-md bg-accent px-6 font-medium text-accent-ink"
          >
            {common('createAccount')}
          </Link>
          <Link
            href="/rooms"
            className="inline-flex h-12 items-center px-2 text-accent underline-offset-4 hover:underline"
          >
            {common('readOnly')}
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink-tertiary">{t('note')}</p>
      </div>
      <ScreenshotFrame alt={t('screenshotAlt')} />
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
    <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="promises">
      <h2 id="promises" className="sr-only">
        {t('title')}
      </h2>
      <div className="grid gap-10 md:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.key} delay={index * 60}>
            <Icon name={item.icon} size={28} className="text-accent" />
            <h3 className="mt-4 font-serif text-2xl">{t(`${item.key}.title`)}</h3>
            <p className="mt-2 text-ink-secondary text-pretty">{t(`${item.key}.body`)}</p>
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
    <section id="how" className="border-t border-line bg-paper-raised/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-serif text-3xl">{t('title')}</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="flex flex-col">
              <div className="overflow-hidden rounded-md border border-line bg-paper">
                <Image
                  src={`/images/step-${index + 1}.png`}
                  alt=""
                  width={640}
                  height={400}
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="block h-auto w-full"
                />
              </div>
              <span className="mt-4 text-sm text-ink-tertiary">{index + 1}</span>
              <h3 className="mt-1 font-medium">{t(`steps.${step}.title`)}</h3>
              <p className="mt-1 text-ink-secondary">{t(`steps.${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function RoomsPreview() {
  const t = useTranslations('marketing.rooms');
  const common = useTranslations('common');
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="font-serif text-3xl">{t('title')}</h2>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <article className="rounded-lg border border-line p-6">
          <h3 className="font-medium">{t('reflection.title')}</h3>
          <p className="mt-1 text-ink-secondary">{t('reflection.body')}</p>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-ink-tertiary">
              {t('reflection.exampleRoom')} · {common('anonymous')}
            </p>
            <p className="prose-reading mt-2 text-[1.0625rem]">{t('reflection.example')}</p>
          </div>
        </article>
        <article className="rounded-lg border border-line p-6">
          <h3 className="font-medium">{t('fiction.title')}</h3>
          <p className="mt-1 text-ink-secondary">{t('fiction.body')}</p>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-ink-tertiary">{t('fiction.exampleRoom')} · stille.birke</p>
            <p className="mt-2 font-serif text-lg font-semibold">{t('fiction.exampleTitle')}</p>
            <p className="prose-reading mt-1 text-[1.0625rem]">{t('fiction.example')}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

export function Trust() {
  const t = useTranslations('marketing.trust');
  const doItems = t.raw('do.items') as string[];
  const dontItems = t.raw('dont.items') as string[];
  return (
    <section id="trust" className="border-y border-line bg-paper-raised/60">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-serif text-3xl">{t('title')}</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-medium">{t('do.title')}</h3>
            <ul className="mt-4 space-y-3 text-ink-secondary">
              {doItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <Icon name="check" className="mt-1 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium">{t('dont.title')}</h3>
            <ul className="mt-4 space-y-3 text-ink-secondary">
              {dontItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <Icon name="close" className="mt-1 shrink-0 text-ink-tertiary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 text-sm text-ink-secondary">
          {t.rich('links', {
            privacy: (chunks) => (
              <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
                {chunks}
              </Link>
            ),
            imprint: (chunks) => (
              <Link href="/imprint" className="text-accent underline-offset-4 hover:underline">
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

export function Safety() {
  const t = useTranslations('marketing.safety');
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="font-serif text-3xl">{t('title')}</h2>
      <p className="mt-4 text-ink-secondary text-pretty">{t('body')}</p>
      <p className="mt-4 font-serif text-lg">{t('promise')}</p>
      <p className="mt-6 text-sm text-ink-secondary">{t('lines')}</p>
    </section>
  );
}

export function InstallAndPricing() {
  const install = useTranslations('marketing.install');
  const pricing = useTranslations('marketing.pricing');
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2">
        <div>
          <Icon name="install" size={28} className="text-accent" />
          <h2 className="mt-4 font-serif text-2xl">{install('title')}</h2>
          <p className="mt-2 text-ink-secondary text-pretty">{install('body')}</p>
          <p className="mt-2 text-sm text-ink-tertiary">{install('native')}</p>
        </div>
        <div>
          <Icon name="leaf" size={28} className="text-accent" />
          <h2 className="mt-4 font-serif text-2xl">{pricing('title')}</h2>
          <p className="mt-2 text-ink-secondary text-pretty">{pricing('body')}</p>
        </div>
      </div>
    </section>
  );
}

export function ClosingCta() {
  const t = useTranslations('marketing.cta');
  return (
    <section className="border-t border-line bg-paper-raised/60">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <h2 className="font-serif text-3xl text-balance md:text-4xl">{t('title')}</h2>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/sign-in?intent=create"
            className="inline-flex h-12 items-center rounded-md bg-accent px-6 font-medium text-accent-ink"
          >
            {t('button')}
          </Link>
          <Link href="/sign-in" className="text-accent underline-offset-4 hover:underline">
            {t('link')}
          </Link>
        </div>
      </div>
    </section>
  );
}

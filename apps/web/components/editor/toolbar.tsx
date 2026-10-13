'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

import type { Editor } from '@tiptap/react';

interface ToolbarProps {
  editor: Editor | null;
  titleVisible: boolean;
  onToggleTitle: () => void;
  wordCount: number | null;
}

/** Bold, italic, quote, divider, title toggle, word count for stories. Sits above the on-screen keyboard on phones. */
export function Toolbar({ editor, titleVisible, onToggleTitle, wordCount }: ToolbarProps) {
  const t = useTranslations('editor.toolbar');
  const common = useTranslations('common');
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setBottom(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  const button = (
    name: IconName,
    label: string,
    active: boolean,
    onClick: () => void,
    disabled = false,
  ) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'touch-target flex items-center justify-center rounded-md state-toggle',
        active ? 'bg-accent-soft text-ink' : 'text-ink-secondary hover:text-ink',
        disabled && 'opacity-40',
      )}
    >
      <Icon name={name} />
    </button>
  );

  return (
    <div
      role="toolbar"
      aria-label={t('bold')}
      className="safe-bottom fixed inset-x-0 z-10 flex items-center justify-between border-t border-line bg-paper px-2 md:static md:border-t-0 md:border-b md:px-0"
      style={{ bottom }}
    >
      <div className="flex items-center">
        {button('bold', t('bold'), editor?.isActive('bold') ?? false, () =>
          editor?.chain().focus().toggleBold().run(),
        )}
        {button('italic', t('italic'), editor?.isActive('italic') ?? false, () =>
          editor?.chain().focus().toggleItalic().run(),
        )}
        {button('quote', t('quote'), editor?.isActive('blockquote') ?? false, () =>
          editor?.chain().focus().toggleBlockquote().run(),
        )}
        {button('divider', t('divider'), false, () =>
          editor?.chain().focus().setHorizontalRule().run(),
        )}
        {button('heading', t('title'), titleVisible, onToggleTitle)}
      </div>
      <div className="flex items-center gap-2">
        {wordCount !== null ? (
          <span className="text-[13px] text-ink-tertiary">
            {common('words', { count: wordCount })}
          </span>
        ) : null}
        {button(
          'undo',
          t('undo'),
          false,
          () => editor?.chain().focus().undo().run(),
          !editor?.can().undo(),
        )}
        {button(
          'redo',
          t('redo'),
          false,
          () => editor?.chain().focus().redo().run(),
          !editor?.can().redo(),
        )}
      </div>
    </div>
  );
}

'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import {
  countChars,
  countWords,
  type FeedPost,
  type Locale,
  type UserSettings,
} from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { useCryptoState } from '@/components/providers/crypto-provider';
import { useOnline } from '@/components/providers/online-provider';
import { Button } from '@/components/ui/button';
import { Confirm } from '@/components/ui/confirm';
import { Icon } from '@/components/ui/icon';
import { Overlay } from '@/components/ui/overlay';
import { CrisisScanner } from '@/features/crisis/client';
import { cryptoClient } from '@/features/crypto/client';
import { requestAfterNavigation } from '@/features/navigation/after-navigation';
import { canGoBackInApp } from '@/features/navigation/close-overlay';
import { enqueuePublish } from '@/features/offline/queue';
import { createPost, createSeries, updatePost } from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { db } from '@/lib/db';

import { CompletionPanel, type CompletionChoice } from './completion-panel';
import { CrisisPanel } from './crisis-panel';
import { editorExtensions } from './extensions';
import { docToMarkdown, markdownToDoc } from './markdown-serializer';
import { Toolbar } from './toolbar';

import type { OwnSeries, RoomView } from '@/features/posts/queries';

const DRAFT_ID = 'current';
const AUTOSAVE_MS = 2000;

interface WriteOverlayProps {
  rooms: RoomView[];
  series: OwnSeries[];
  settings: UserSettings;
  /** First entry after onboarding: the placeholder asks what is on your mind and "Later" leads to /today. */
  first: boolean;
  /** Editing a shared text (within the edit window, or any time for stories). */
  editPost: FeedPost | null;
  /** Editing a private entry: decrypted from the local journal copy. */
  editPrivateId: string | null;
  /** Rendered through the @modal slot over another page. */
  intercepted: boolean;
  onClose: () => void;
}

type Phase = 'writing' | 'crisis' | 'completion';

/**
 * The editor: nothing but text, full screen. Autosaves an encrypted draft every
 * two seconds, scans for crisis signals in a worker, and hands every decision
 * about visibility to the completion panel afterwards.
 */
export function WriteOverlay({
  rooms,
  series,
  settings,
  first,
  editPost,
  editPrivateId,
  intercepted,
  onClose,
}: WriteOverlayProps) {
  const t = useTranslations('editor');
  const completion = useTranslations('completion');
  const auth = useTranslations('auth');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const online = useOnline();
  const crypto = useCryptoState();
  const { announce } = useAnnouncer();
  const [open, setOpen] = useState(true);
  const [phase, setPhase] = useState<Phase>('writing');
  const [title, setTitle] = useState(editPost?.title ?? '');
  const [titleVisible, setTitleVisible] = useState(
    Boolean(editPost?.title) || editPost?.type === 'story',
  );
  const [markdown, setMarkdown] = useState(editPost?.body ?? '');
  const [askKeep, setAskKeep] = useState(false);
  const [draftOffer, setDraftOffer] = useState<string | null>(null);
  const [crisisShown, setCrisisShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  const scanner = useMemo(() => new CrisisScanner(), []);
  const dirty = useRef(false);

  const editor = useEditor({
    extensions: editorExtensions(first ? auth('firstEntry.placeholder') : t('placeholder')),
    content: editPost ? markdownToDoc(editPost.body) : null,
    immediatelyRender: false,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: cn(
          'tiptap prose-reading mx-auto w-full max-w-none',
          settings.editorFont === 'sans' && 'sans',
        ),
        style: `font-size:${settings.fontSize}px`,
        'aria-label': t('placeholder'),
      },
    },
    onUpdate: ({ editor: current }) => {
      dirty.current = true;
      const next = docToMarkdown(current.getJSON());
      setMarkdown(next);
      if (!crisisShown) {
        scanner.scanDebounced(`${title}\n${next}`, locale, (hit) => {
          if (!hit) return;
          setCrisisShown(true);
          setCrisisPending(true);
        });
      }
    },
  });

  const [crisisPending, setCrisisPending] = useState(false);

  // Restore a draft or decrypt the private entry being edited.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (crypto.hasKey === null) return;
      if (editPrivateId) {
        const entry = await db().entries.get(editPrivateId);
        if (entry?.body) {
          editor?.commands.setContent(markdownToDoc(entry.body));
          setMarkdown(entry.body);
          setTitle(entry.title ?? '');
          setTitleVisible(Boolean(entry.title));
        }
        setReady(true);
        return;
      }
      if (editPost || !crypto.hasKey) {
        setReady(true);
        return;
      }
      const draft = await db().drafts.get(DRAFT_ID);
      if (draft && !cancelled) {
        try {
          const plain = await cryptoClient.decrypt({
            ciphertext: draft.ciphertext,
            nonce: draft.nonce,
            wrappedKey: draft.wrappedKey,
          });
          if (plain.trim().length > 0) setDraftOffer(plain);
        } catch {
          await db().drafts.delete(DRAFT_ID);
        }
      }
      if (!cancelled) setReady(true);
    })().catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once the editor and key state exist
  }, [editor, crypto.hasKey]);

  // Autosave every two seconds, encrypted; drafts never reach the server.
  useEffect(() => {
    if (!crypto.hasKey || editPost || editPrivateId) return;
    const interval = window.setInterval(() => {
      if (!dirty.current) return;
      dirty.current = false;
      const payload = title ? `# ${title}\n\n${markdown}` : markdown;
      void cryptoClient
        .encrypt(payload)
        .then((encrypted) => db().drafts.put({ id: DRAFT_ID, ...encrypted, updatedAt: Date.now() }))
        .catch(() => undefined);
    }, AUTOSAVE_MS);
    return () => window.clearInterval(interval);
  }, [crypto.hasKey, markdown, title, editPost, editPrivateId]);

  useEffect(() => () => scanner.dispose(), [scanner]);

  const applyDraft = (plain: string) => {
    const lines = plain.split('\n');
    if (lines[0]?.startsWith('# ')) {
      setTitle(lines[0].slice(2));
      setTitleVisible(true);
      editor?.commands.setContent(markdownToDoc(lines.slice(2).join('\n')));
      setMarkdown(lines.slice(2).join('\n'));
    } else {
      editor?.commands.setContent(markdownToDoc(plain));
      setMarkdown(plain);
    }
    setDraftOffer(null);
    announce(t('draftRestored'));
  };

  const discardDraft = async () => {
    await db().drafts.delete(DRAFT_ID);
    setDraftOffer(null);
  };

  const hasContent = markdown.trim().length > 0 || title.trim().length > 0;
  const wordCount = countWords(markdown);
  const charCount = countChars(markdown);

  /** Cancel: back to the page underneath. */
  const close = useCallback(() => {
    setOpen(false);
    onClose();
  }, [onClose]);

  /** Success: the overlay closes and the app moves on to where the text now lives. */
  const leave = useCallback(
    (href: string) => {
      setOpen(false);
      if (intercepted && canGoBackInApp()) {
        requestAfterNavigation({ href });
        router.back();
      } else {
        requestAfterNavigation({});
        router.replace(href);
      }
    },
    [intercepted, router],
  );

  const beforeClose = useCallback(() => {
    if (!hasContent || editPost || editPrivateId) return true;
    setAskKeep(true);
    return false;
  }, [hasContent, editPost, editPrivateId]);

  const finish = () => {
    if (crisisPending) {
      setCrisisPending(false);
      setPhase('crisis');
      return;
    }
    if (editPost) return saveEdit();
    if (editPrivateId) return savePrivateEdit();
    setPhase('completion');
  };

  const saveEdit = () => {
    if (!editPost) return;
    startTransition(async () => {
      const result = await updatePost(editPost.id, {
        body: markdown,
        title: titleVisible && title.trim() ? title.trim() : null,
      });
      if (!result.ok) return setError(result.error);
      announce(common('saved'));
      leave(editPost ? `/posts/${editPost.id}` : '/journal');
    });
  };

  const savePrivateEdit = () => {
    if (!editPrivateId) return;
    startTransition(async () => {
      try {
        const payload =
          titleVisible && title.trim() ? `# ${title.trim()}\n\n${markdown}` : markdown;
        const encrypted = await cryptoClient.encrypt(payload);
        const result = await updatePost(editPrivateId, encrypted);
        if (!result.ok) return setError(result.error);
        await db().entries.update(editPrivateId, {
          body: markdown,
          title: titleVisible && title.trim() ? title.trim() : null,
          searchText: `${title}\n${markdown}`.toLowerCase(),
        });
        announce(common('saved'));
        leave('/journal');
      } catch {
        setError('CIPHERTEXT_REQUIRED');
      }
    });
  };

  const submit = (choice: CompletionChoice) => {
    startTransition(async () => {
      setError(null);
      const clientId = globalThis.crypto.randomUUID();
      const cleanTitle = titleVisible && title.trim() ? title.trim() : null;

      if (choice.visibility === 'private') {
        try {
          const payload = cleanTitle ? `# ${cleanTitle}\n\n${markdown}` : markdown;
          const encrypted = await cryptoClient.encrypt(payload);
          const input = {
            visibility: 'private' as const,
            type: choice.type,
            ...encrypted,
            clientId,
          };
          const result = online ? await createPost(input) : null;
          if (result && !result.ok) return setError(result.error);
          if (!result) await enqueuePublish(input);
          await db().drafts.delete(DRAFT_ID);
          announce(online ? completion('stored') : t('offlineQueued'));
          leave('/journal');
          return;
        } catch {
          return setError('CIPHERTEXT_REQUIRED');
        }
      }

      let seriesId = choice.seriesId;
      if (seriesId === 'new' && choice.newSeriesTitle) {
        const created = await createSeries({ title: choice.newSeriesTitle, description: '' });
        if (!created.ok) return setError(created.error);
        seriesId = created.data.id;
      } else if (seriesId === 'new') {
        seriesId = null;
      }

      if (!choice.roomId) return setError('ROOM_REQUIRED');
      const input = {
        visibility: choice.visibility,
        type: choice.type,
        title: cleanTitle,
        body: markdown,
        roomId: choice.roomId,
        expiry: choice.expiry,
        commentsEnabled: choice.commentsEnabled,
        seriesId,
        clientId,
      };
      if (!online) {
        await enqueuePublish(input);
        await db().drafts.delete(DRAFT_ID);
        announce(t('offlineQueued'));
        leave('/journal');
        return;
      }
      const result = await createPost(input);
      if (!result.ok) return setError(result.error);
      await db().drafts.delete(DRAFT_ID);
      try {
        localStorage.setItem('inkwell.shared-once', '1');
      } catch {
        // ignore
      }
      announce(completion('published'));
      const room = rooms.find((candidate) => candidate.id === choice.roomId);
      leave(room ? `/rooms/${room.slug}?highlight=${result.data.id}` : '/today');
    });
  };

  return (
    <Overlay
      open={open}
      onClose={onClose}
      kind="full"
      closeLabel={common('close')}
      beforeClose={beforeClose}
    >
      <div className="full-editor flex h-dvh flex-col bg-paper">
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-3 md:px-5">
          <Button variant="ghost" size="sm" onClick={() => (beforeClose() ? close() : undefined)}>
            {first ? common('later') : t('cancel')}
          </Button>
          <div className="hidden md:block">
            <Toolbar
              editor={editor}
              titleVisible={titleVisible}
              onToggleTitle={() => setTitleVisible((v) => !v)}
              wordCount={wordCount > 0 && (titleVisible || wordCount > 400) ? wordCount : null}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={finish}
            disabled={!hasContent || !ready || phase !== 'writing'}
            busy={pending && phase === 'writing'}
            className="min-w-20"
          >
            <Icon name="check" size={16} />
            {t('done')}
          </Button>
        </div>

        <div
          className={cn(
            'relative flex-1 overflow-y-auto px-4 pb-24 md:pb-8',
            phase !== 'writing' && 'editor-dimmed',
          )}
          aria-hidden={phase !== 'writing'}
        >
          <div className="mx-auto w-full max-w-[680px] pt-8 pb-10 md:pt-16">
            {titleVisible ? (
              <input
                value={title}
                onChange={(event) => {
                  dirty.current = true;
                  setTitle(event.target.value);
                }}
                placeholder={t('titlePlaceholder')}
                aria-label={t('titlePlaceholder')}
                maxLength={120}
                className="display mb-6 w-full bg-transparent text-[2.125rem] outline-none placeholder:text-ink-tertiary md:text-[2.5rem]"
              />
            ) : null}
            {draftOffer !== null ? (
              <div className="mb-8 rounded-lg border border-accent/25 bg-accent-tint p-4">
                <p className="font-medium">{t('draftFound.title')}</p>
                <p className="text-sm text-ink-secondary">{t('draftFound.body')}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => applyDraft(draftOffer)}>
                    {t('draftFound.continue')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void discardDraft()}>
                    {t('draftFound.fresh')}
                  </Button>
                </div>
              </div>
            ) : null}
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="md:hidden">
          {phase === 'writing' ? (
            <Toolbar
              editor={editor}
              titleVisible={titleVisible}
              onToggleTitle={() => setTitleVisible((v) => !v)}
              wordCount={titleVisible && wordCount > 0 ? wordCount : null}
            />
          ) : null}
        </div>

        {phase === 'crisis' ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 pb-8 md:top-1/2 md:bottom-auto md:-translate-y-1/2">
            <CrisisPanel onContinue={() => setPhase('writing')} />
          </div>
        ) : null}

        {phase === 'completion' ? (
          <div className="sheet float absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-xl border-b-0 p-6 md:top-2 md:right-2 md:bottom-2 md:left-auto md:max-h-none md:w-[440px] md:rounded-xl md:border-b">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-[1.375rem] font-medium tracking-[-0.01em]">
                {completion('title')}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setPhase('writing')}>
                {common('back')}
              </Button>
            </div>
            <CompletionPanel
              rooms={rooms}
              series={series}
              wordCount={wordCount}
              hasTitle={titleVisible && title.trim().length > 0}
              charCount={charCount}
              defaults={{ visibility: settings.defaultVisibility, expiry: settings.defaultExpiry }}
              canEncrypt={crypto.hasKey === true}
              busy={pending}
              error={error}
              onSubmit={submit}
            />
          </div>
        ) : null}

        <Confirm
          open={askKeep}
          title={t('keepDraft.title')}
          body=""
          confirmLabel={t('keepDraft.keep')}
          cancelLabel={t('keepDraft.discard')}
          closeLabel={common('close')}
          onConfirm={() => {
            setAskKeep(false);
            close();
          }}
          onCancel={() => {
            setAskKeep(false);
            void db().drafts.delete(DRAFT_ID).then(close);
          }}
        />
      </div>
    </Overlay>
  );
}

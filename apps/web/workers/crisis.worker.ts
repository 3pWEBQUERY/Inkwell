/// <reference lib="webworker" />
import { detectCrisis } from '@/features/crisis/patterns';

import type { Locale } from '@inkwell/shared';

/** Receives the current text and answers with a boolean. Keeps the editor free of the scan. */
const scope = self as unknown as DedicatedWorkerGlobalScope;

interface CrisisRequest {
  id: number;
  text: string;
  locale: Locale;
}

scope.addEventListener('message', (event: MessageEvent<CrisisRequest>) => {
  const { id, text, locale } = event.data;
  scope.postMessage({ id, hit: detectCrisis(text, locale) });
});

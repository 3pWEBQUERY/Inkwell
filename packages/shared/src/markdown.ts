/**
 * The Markdown subset used for texts: paragraphs, hard line breaks, *italic*,
 * **bold**, `> quote` and `---` dividers. Nothing else is interpreted; everything
 * else is literal text. Rendering escapes every character, so the output is
 * safe to inject as HTML without a sanitizer.
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'break' }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] };

export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'quote'; children: BlockNode[] }
  | { type: 'divider' };

export interface Document {
  blocks: BlockNode[];
}

const NBSP = new RegExp(String.fromCharCode(0xa0), 'g');

const DIVIDER = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

export function parseMarkdown(source: string): Document {
  const lines = normalize(source).split('\n');
  return { blocks: parseBlocks(lines) };
}

function normalize(source: string): string {
  return source.replace(/\r\n?/g, '\n').replace(NBSP, ' ');
}

function parseBlocks(lines: string[]): BlockNode[] {
  const blocks: BlockNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    if (DIVIDER.test(line)) {
      blocks.push({ type: 'divider' });
      index += 1;
      continue;
    }

    if (isQuoteLine(line)) {
      const inner: string[] = [];
      while (index < lines.length && isQuoteLine(lines[index] ?? '')) {
        inner.push(stripQuoteMarker(lines[index] ?? ''));
        index += 1;
      }
      blocks.push({ type: 'quote', children: parseBlocks(inner) });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? '';
      if (current.trim() === '' || DIVIDER.test(current) || isQuoteLine(current)) break;
      paragraph.push(current);
      index += 1;
    }
    blocks.push({ type: 'paragraph', children: parseParagraph(paragraph) });
  }

  return blocks;
}

function isQuoteLine(line: string): boolean {
  return /^\s{0,3}>/.test(line);
}

function stripQuoteMarker(line: string): string {
  return line.replace(/^\s{0,3}> ?/, '');
}

function parseParagraph(lines: string[]): InlineNode[] {
  const nodes: InlineNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) nodes.push({ type: 'break' });
    nodes.push(...parseInline(line.replace(/\s+$/, '')));
  });
  return nodes;
}

type Delimiter = '**' | '*' | '_';

/**
 * Inline parser with a tiny delimiter stack. Unmatched delimiters stay literal.
 * Backslash escapes `\*`, `\_` and `\\`.
 */
export function parseInline(text: string): InlineNode[] {
  const stack: { delimiter: Delimiter; children: InlineNode[] }[] = [];
  let current: InlineNode[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer.length > 0) {
      current.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };

  const open = (delimiter: Delimiter) => {
    flush();
    stack.push({ delimiter, children: current });
    current = [];
  };

  const close = (delimiter: Delimiter) => {
    flush();
    const frame = stack.pop();
    if (!frame) return;
    const node: InlineNode =
      delimiter === '**'
        ? { type: 'strong', children: current }
        : { type: 'em', children: current };
    current = frame.children;
    current.push(node);
  };

  const isOpen = (delimiter: Delimiter) => stack.some((frame) => frame.delimiter === delimiter);

  let i = 0;
  while (i < text.length) {
    const char = text[i] ?? '';
    const next = text[i + 1] ?? '';

    if (char === '\\' && (next === '*' || next === '_' || next === '\\')) {
      buffer += next;
      i += 2;
      continue;
    }

    if (char === '*' || char === '_') {
      const top = stack[stack.length - 1]?.delimiter;

      // A single-star run closes an open *em* before anything else, so "***" after
      // "**a *b" closes both levels in order.
      if (top === char) {
        close(char);
        i += 1;
        continue;
      }

      if (char === '*' && next === '*') {
        if (top === '**') close('**');
        else if (!isOpen('**') && canOpen(text, i + 2) && hasClosing(text, i + 2, '**')) open('**');
        else buffer += '**';
        i += 2;
        continue;
      }

      const delimiter: Delimiter = char;
      if (
        !isOpen(delimiter) &&
        canOpen(text, i + 1) &&
        hasClosing(text, i + 1, delimiter) &&
        !isWordInternal(text, i, delimiter)
      ) {
        open(delimiter);
      } else buffer += char;
      i += 1;
      continue;
    }

    buffer += char;
    i += 1;
  }

  flush();

  // Unclosed delimiters become literal text again.
  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) break;
    const literal: InlineNode[] = [{ type: 'text', value: frame.delimiter }, ...current];
    current = frame.children;
    current.push(...mergeText(literal));
  }

  return mergeText(current);
}

/** An opener must be followed by a non-space character. */
function canOpen(text: string, from: number): boolean {
  const after = text[from] ?? '';
  return after !== '' && after !== ' ';
}

function hasClosing(text: string, from: number, delimiter: Delimiter): boolean {
  const idx = text.indexOf(delimiter, from);
  if (idx === -1) return false;
  // A closing delimiter must follow a non-space character.
  const before = text[idx - 1] ?? '';
  return idx > from && before !== ' ';
}

function isWordInternal(text: string, index: number, delimiter: Delimiter): boolean {
  if (delimiter !== '_') return false;
  const before = text[index - 1] ?? '';
  return /[\p{L}\p{N}]/u.test(before);
}

function mergeText(nodes: InlineNode[]): InlineNode[] {
  const merged: InlineNode[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === 'text' && last?.type === 'text') {
      last.value += node.value;
    } else {
      merged.push(node);
    }
  }
  return merged;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export function renderInline(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return escapeHtml(node.value);
        case 'break':
          return '<br>';
        case 'strong':
          return `<strong>${renderInline(node.children)}</strong>`;
        case 'em':
          return `<em>${renderInline(node.children)}</em>`;
      }
    })
    .join('');
}

export function renderBlocks(blocks: BlockNode[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${renderInline(block.children)}</p>`;
        case 'quote':
          return `<blockquote>${renderBlocks(block.children)}</blockquote>`;
        case 'divider':
          return '<hr>';
      }
    })
    .join('\n');
}

/** Renders the Markdown subset to HTML. Output contains only p, br, strong, em, blockquote and hr. */
export function renderMarkdown(source: string): string {
  return renderBlocks(parseMarkdown(source).blocks);
}

export function inlineToPlainText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.value;
        case 'break':
          return '\n';
        case 'strong':
        case 'em':
          return inlineToPlainText(node.children);
      }
    })
    .join('');
}

export function blocksToPlainText(blocks: BlockNode[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return inlineToPlainText(block.children);
        case 'quote':
          return blocksToPlainText(block.children);
        case 'divider':
          return '';
      }
    })
    .filter((text) => text.length > 0)
    .join('\n\n');
}

/** Plain text without any markup, used for previews, length checks and the local search index. */
export function toPlainText(source: string): string {
  return blocksToPlainText(parseMarkdown(source).blocks);
}

/** The first non-empty line, used as a preview wherever there is no title. */
export function firstLine(source: string, maxChars = 140): string {
  const text = toPlainText(source);
  const line = text.split('\n').find((candidate) => candidate.trim().length > 0) ?? '';
  const trimmed = line.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function countWords(source: string): number {
  const text = toPlainText(source).trim();
  if (text.length === 0) return 0;
  return text.split(/\s+/u).length;
}

/** Characters of the plain text, the unit for the length limits. */
export function countChars(source: string): number {
  return Array.from(toPlainText(source)).length;
}

/** Reading time in minutes at a calm 200 words per minute, never below one. */
export function readingMinutes(source: string): number {
  return Math.max(1, Math.round(countWords(source) / 200));
}

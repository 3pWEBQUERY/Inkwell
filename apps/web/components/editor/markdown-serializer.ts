import type { JSONContent } from '@tiptap/core';

/**
 * Serialises the reduced editor document to the Markdown subset and back.
 * Allowed: paragraph, hardBreak, bold, italic, blockquote, horizontalRule.
 */
export function docToMarkdown(doc: JSONContent): string {
  return (doc.content ?? [])
    .map(blockToMarkdown)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function blockToMarkdown(node: JSONContent): string {
  if (node.type === 'paragraph') return inlineToMarkdown(node.content ?? []);
  if (node.type === 'blockquote') {
    return (node.content ?? [])
      .map(blockToMarkdown)
      .join('\n\n')
      .split('\n')
      .map((line) => (line.length > 0 ? `> ${line}` : '>'))
      .join('\n');
  }
  if (node.type === 'horizontalRule') return '---';
  return '';
}

function inlineToMarkdown(nodes: JSONContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '\n';
      if (node.type !== 'text') return '';
      let text = escapeMarkdown(node.text ?? '');
      const marks = new Set((node.marks ?? []).map((mark) => mark.type));
      if (marks.has('italic')) text = `*${text}*`;
      if (marks.has('bold')) text = `**${text}**`;
      return text;
    })
    .join('');
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/^(\s*)>/g, '$1\\>')
    .replace(/^(\s*)-{3,}\s*$/g, '$1\\---');
}

/** Builds an editor document from the Markdown subset (used when editing an existing text or restoring a draft). */
export function markdownToDoc(markdown: string): JSONContent {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const content: JSONContent[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (line.trim() === '') {
      index += 1;
      continue;
    }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      content.push({ type: 'horizontalRule' });
      index += 1;
      continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const inner: string[] = [];
      while (index < lines.length && /^\s{0,3}>/.test(lines[index] ?? '')) {
        inner.push((lines[index] ?? '').replace(/^\s{0,3}> ?/, ''));
        index += 1;
      }
      content.push({ type: 'blockquote', content: markdownToDoc(inner.join('\n')).content ?? [] });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? '';
      if (
        current.trim() === '' ||
        /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(current) ||
        /^\s{0,3}>/.test(current)
      )
        break;
      paragraph.push(current);
      index += 1;
    }
    const inline: JSONContent[] = [];
    paragraph.forEach((text, i) => {
      if (i > 0) inline.push({ type: 'hardBreak' });
      inline.push(...parseInlineMarks(text));
    });
    content.push({ type: 'paragraph', content: inline });
  }
  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] };
}

function parseInlineMarks(text: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    if (start > last) nodes.push({ type: 'text', text: unescape(text.slice(last, start)) });
    if (match[2] !== undefined)
      nodes.push({ type: 'text', text: unescape(match[2]), marks: [{ type: 'bold' }] });
    else if (match[3] !== undefined)
      nodes.push({ type: 'text', text: unescape(match[3]), marks: [{ type: 'italic' }] });
    last = start + match[0].length;
  }
  if (last < text.length) nodes.push({ type: 'text', text: unescape(text.slice(last)) });
  return nodes.filter((node) => node.text !== '');
}

function unescape(text: string): string {
  return text.replace(/\\([\\*_>-])/g, '$1');
}

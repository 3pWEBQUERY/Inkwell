import { describe, expect, it } from 'vitest';

import { docToMarkdown, markdownToDoc } from '@/components/editor/markdown-serializer';

describe('editor serializer', () => {
  it('serialises the reduced schema to the Markdown subset', () => {
    const markdown = docToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Ein ' },
            { type: 'text', text: 'fetter', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' Satz.' },
          ],
        },
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Zitat' }] }],
        },
        { type: 'horizontalRule' },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Zeile eins' },
            { type: 'hardBreak' },
            { type: 'text', text: 'Zeile zwei', marks: [{ type: 'italic' }] },
          ],
        },
      ],
    });
    expect(markdown).toBe('Ein **fetter** Satz.\n\n> Zitat\n\n---\n\nZeile eins\n*Zeile zwei*');
  });

  it('escapes characters that would otherwise become markup', () => {
    expect(
      docToMarkdown({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '5 * 3 und snake_case' }] }],
      }),
    ).toBe('5 \\* 3 und snake\\_case');
  });

  it('parses the subset back into a document', () => {
    const doc = markdownToDoc('Ein **fetter** Satz.\n\n> Zitat\n\n---\n\nZeile eins\n*Zeile zwei*');
    expect(doc.content).toHaveLength(4);
    expect(doc.content?.[0]?.content?.[1]).toEqual({
      type: 'text',
      text: 'fetter',
      marks: [{ type: 'bold' }],
    });
    expect(doc.content?.[1]?.type).toBe('blockquote');
    expect(doc.content?.[2]?.type).toBe('horizontalRule');
    expect(doc.content?.[3]?.content?.[1]).toEqual({ type: 'hardBreak' });
  });

  it('round-trips', () => {
    const source = 'Erster Absatz mit *Betonung*.\n\n> Ein Gedanke\n\nLetzter Absatz.';
    expect(docToMarkdown(markdownToDoc(source))).toBe(source);
  });
});

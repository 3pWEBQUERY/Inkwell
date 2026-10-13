import { describe, expect, it } from 'vitest';

import {
  countChars,
  countWords,
  firstLine,
  parseInline,
  renderMarkdown,
  toPlainText,
} from '../src/markdown.js';

describe('renderMarkdown', () => {
  it('renders paragraphs and hard breaks', () => {
    expect(renderMarkdown('Erste Zeile\nZweite Zeile\n\nNeuer Absatz')).toBe(
      '<p>Erste Zeile<br>Zweite Zeile</p>\n<p>Neuer Absatz</p>',
    );
  });

  it('renders bold and italic', () => {
    expect(renderMarkdown('Ein **fetter** und ein *kursiver* Satz.')).toBe(
      '<p>Ein <strong>fetter</strong> und ein <em>kursiver</em> Satz.</p>',
    );
  });

  it('renders nested emphasis', () => {
    expect(renderMarkdown('**fett *und kursiv***')).toBe(
      '<p><strong>fett <em>und kursiv</em></strong></p>',
    );
  });

  it('renders quotes and dividers', () => {
    expect(renderMarkdown('> Ein Zitat\n> über zwei Zeilen\n\n---\n\nDanach')).toBe(
      '<blockquote><p>Ein Zitat<br>über zwei Zeilen</p></blockquote>\n<hr>\n<p>Danach</p>',
    );
  });

  it('escapes HTML and never interprets links, images or headings', () => {
    expect(
      renderMarkdown('# Kein Titel\n<script>alert(1)</script> [link](http://x) ![img](y)'),
    ).toBe(
      '<p># Kein Titel<br>&lt;script&gt;alert(1)&lt;/script&gt; [link](http://x) ![img](y)</p>',
    );
  });

  it('keeps unmatched delimiters literal', () => {
    expect(renderMarkdown('5 * 3 = 15 und 2*')).toBe('<p>5 * 3 = 15 und 2*</p>');
    expect(renderMarkdown('**nicht geschlossen')).toBe('<p>**nicht geschlossen</p>');
  });

  it('does not treat word-internal underscores as emphasis', () => {
    expect(renderMarkdown('snake_case_name bleibt')).toBe('<p>snake_case_name bleibt</p>');
  });

  it('honours escapes', () => {
    expect(renderMarkdown('\\*kein kursiv\\*')).toBe('<p>*kein kursiv*</p>');
  });
});

describe('parseInline', () => {
  it('merges adjacent text nodes', () => {
    expect(parseInline('a*b')).toEqual([{ type: 'text', value: 'a*b' }]);
  });
});

describe('plain text helpers', () => {
  const sample = '**Nachts** ist es still.\n\n> Ein Gedanke\n\n---\n\nDas war alles.';

  it('strips markup', () => {
    expect(toPlainText(sample)).toBe('Nachts ist es still.\n\nEin Gedanke\n\nDas war alles.');
  });

  it('finds the first line and truncates on word boundaries', () => {
    expect(firstLine(sample)).toBe('Nachts ist es still.');
    expect(firstLine('ein sehr langer erster satz der gekürzt werden muss', 20)).toBe(
      'ein sehr langer…',
    );
  });

  it('counts words and characters', () => {
    expect(countWords(sample)).toBe(9);
    expect(countChars('ab\n\ncd')).toBe(6);
    expect(countWords('')).toBe(0);
  });
});

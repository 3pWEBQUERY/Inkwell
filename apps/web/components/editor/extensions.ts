import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Italic } from '@tiptap/extension-italic';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Focus, Placeholder, UndoRedo } from '@tiptap/extensions';

/** The whole schema: nothing but paragraphs, bold, italic, quotes and dividers. No images, links or heading levels. */
export function editorExtensions(placeholder: string) {
  return [
    Document,
    Paragraph,
    Text,
    HardBreak,
    Bold,
    Italic,
    Blockquote,
    HorizontalRule,
    UndoRedo,
    Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
    // Marks the block being written in; focus mode dims everything else (globals.css).
    Focus.configure({ className: 'has-focus', mode: 'shallowest' }),
  ];
}

'use client';

import { Button } from './button';
import { Overlay } from './overlay';

interface ConfirmProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive actions say in the button what happens. */
export function Confirm({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  closeLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Overlay open={open} onClose={onCancel} title={title} closeLabel={closeLabel} width={400}>
      <p className="text-ink-secondary">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} busy={busy ?? false}>
          {confirmLabel}
        </Button>
      </div>
    </Overlay>
  );
}

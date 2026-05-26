// ============================================================
// ZRHO — UI: Custom Confirmation Modal
// ============================================================

import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirm Action Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="text-red-500 h-8 w-8 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="text-amber-500 h-8 w-8 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="text-emerald-500 h-8 w-8 shrink-0" />;
      default:
        return <HelpCircle className="text-indigo-500 h-8 w-8 shrink-0" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4 pt-1">
        <div className="flex gap-4 items-start bg-background/30 p-4 rounded-2xl border border-border/60">
          {getIcon()}
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleConfirm}
            loading={loading}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1 rounded-xl py-3 text-xs font-bold font-sans"
          >
            {confirmText}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-5 border border-border text-xs font-sans"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

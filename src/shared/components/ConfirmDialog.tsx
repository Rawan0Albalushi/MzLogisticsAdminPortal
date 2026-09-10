import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  danger,
  busy,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  if (!open) {
    return null
  }

  return (
    <div className="mz-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="mz-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mz-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mz-dialog__head">
          <h2 id="mz-dialog-title">{title}</h2>
        </div>
        <div className="mz-dialog__body">{children}</div>
        <div className="mz-dialog__foot">
          <button type="button" className="mz-btn mz-btn--ghost" onClick={onClose} disabled={busy}>
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            className={`mz-btn ${danger ? 'mz-btn--danger' : 'mz-btn--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

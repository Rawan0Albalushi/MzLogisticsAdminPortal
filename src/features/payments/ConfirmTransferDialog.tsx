import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { confirmBankTransfer } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Payment } from '@/core/api/types.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'

export function awaitsBankTransfer(payment?: Payment | null): boolean {
  return payment?.method === 'bank_transfer' && (payment.status === 'pending' || payment.status === 'processing')
}

export function paymentMethodLabel(t: (key: string) => string, method?: string | null): string {
  if (method === 'bank_transfer') {
    return t('paymentMethods.processorBankTransfer')
  }
  if (method === 'cash') {
    return t('paymentMethods.processorCash')
  }
  if (method === 'thawani' || method === 'card') {
    return t('paymentMethods.processorThawani')
  }
  return method || '—'
}

export function ConfirmTransferDialog({
  payment,
  open,
  onClose,
  onConfirmed,
}: {
  payment: Payment | null
  open: boolean
  onClose: () => void
  onConfirmed?: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [receipt, setReceipt] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setReceipt(null)
      setReference('')
      setError('')
    }
  }, [open, payment?.id])

  const mutation = useMutation({
    mutationFn: () => {
      if (!payment || (!receipt && !payment.has_receipt)) {
        throw new Error(t('payments.receiptRequired'))
      }
      return confirmBankTransfer(payment.id, receipt, reference)
    },
    onSuccess: async () => {
      setError('')
      onConfirmed?.()
      onClose()
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['invoices'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('payments.confirmFailed')))
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!receipt && !payment?.has_receipt) {
      setError(t('payments.receiptRequired'))
      return
    }
    mutation.mutate()
  }

  return (
    <ConfirmDialog
      open={open && payment !== null}
      title={t('payments.confirmTransfer')}
      confirmLabel={mutation.isPending ? t('common.saving') : t('payments.confirmTransfer')}
      busy={mutation.isPending}
      disabled={!receipt && !payment?.has_receipt}
      onConfirm={() => {
        const form = document.getElementById('confirm-transfer-form') as HTMLFormElement | null
        form?.requestSubmit()
      }}
      onClose={onClose}
    >
      <form id="confirm-transfer-form" className="mz-form" onSubmit={onSubmit}>
        <p className="mz-field__hint">{t('payments.confirmTransferHint', { reference: payment?.reference ?? '' })}</p>
        {error ? <div className="mz-alert">{error}</div> : null}
        <FormField
          label={t('payments.receipt')}
          htmlFor="transfer-receipt"
          required={!payment?.has_receipt}
          hint={payment?.has_receipt ? t('payments.receiptAlreadyUploaded') : t('payments.receiptHint')}
        >
          <input
            id="transfer-receipt"
            className="mz-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <FormField label={t('payments.transferReference')} htmlFor="transfer-reference">
          <input
            id="transfer-reference"
            className="mz-input"
            value={reference}
            maxLength={64}
            onChange={(event) => setReference(event.target.value)}
          />
        </FormField>
      </form>
    </ConfirmDialog>
  )
}

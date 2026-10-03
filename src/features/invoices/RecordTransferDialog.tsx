import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { recordInvoiceBankTransfer } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Invoice } from '@/core/api/types.ts'
import { awaitsBankTransfer } from '@/features/payments/ConfirmTransferDialog.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'

export function canRecordBankTransfer(invoice: Invoice): boolean {
  if (invoice.type !== 'customer' || invoice.status !== 'issued' || !invoice.payable) {
    return false
  }

  const payment = invoice.payment
  if (!payment) {
    return true
  }

  if (payment.status === 'completed' || payment.status === 'refunded') {
    return false
  }

  return awaitsBankTransfer(payment) || payment.status === 'failed'
}

export function RecordTransferDialog({
  invoice,
  open,
  onClose,
  onRecorded,
}: {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onRecorded?: () => void
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
  }, [open, invoice?.id])

  const mutation = useMutation({
    mutationFn: () => {
      if (!invoice || !receipt) {
        throw new Error(t('payments.receiptRequired'))
      }
      return recordInvoiceBankTransfer(invoice.id, receipt, reference)
    },
    onSuccess: async () => {
      setError('')
      onRecorded?.()
      onClose()
      await queryClient.invalidateQueries({ queryKey: ['invoices'] })
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('invoices.recordFailed')))
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!receipt) {
      setError(t('payments.receiptRequired'))
      return
    }
    mutation.mutate()
  }

  return (
    <ConfirmDialog
      open={open && invoice !== null}
      title={t('invoices.recordTransfer')}
      confirmLabel={mutation.isPending ? t('common.saving') : t('invoices.recordTransfer')}
      busy={mutation.isPending}
      disabled={!receipt}
      onConfirm={() => {
        const form = document.getElementById('record-transfer-form') as HTMLFormElement | null
        form?.requestSubmit()
      }}
      onClose={onClose}
    >
      <form id="record-transfer-form" className="mz-form" onSubmit={onSubmit}>
        <p className="mz-field__hint">{t('invoices.recordTransferHint', { reference: invoice?.reference ?? '' })}</p>
        {error ? <div className="mz-alert">{error}</div> : null}
        <FormField label={t('payments.method')} htmlFor="record-transfer-method">
          <input id="record-transfer-method" className="mz-input" value={t('paymentMethods.processorBankTransfer')} readOnly />
        </FormField>
        <FormField label={t('payments.receipt')} htmlFor="record-transfer-receipt" required hint={t('payments.receiptHint')}>
          <input
            id="record-transfer-receipt"
            className="mz-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <FormField label={t('payments.transferReference')} htmlFor="record-transfer-reference">
          <input
            id="record-transfer-reference"
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

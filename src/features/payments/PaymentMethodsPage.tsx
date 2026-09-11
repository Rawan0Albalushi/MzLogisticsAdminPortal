import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
} from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { PaymentMethod } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { displayValue } from '@/shared/utils/format.ts'

const emptyForm = {
  code: '',
  name: '',
  name_ar: '',
  processor: 'thawani' as 'thawani' | 'cash',
  is_active: true,
  sort_order: '10',
}

export function PaymentMethodsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['payment-methods'],
    queryFn: fetchPaymentMethods,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const processors = [
    { value: 'thawani', label: t('paymentMethods.processorThawani') },
    { value: 'cash', label: t('paymentMethods.processorCash') },
  ] as const

  function methodName(row: PaymentMethod) {
    return i18n.language.startsWith('ar') && row.name_ar ? row.name_ar : row.name
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEdit(row: PaymentMethod) {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      name_ar: row.name_ar,
      processor: row.processor === 'cash' ? 'cash' : 'thawani',
      is_active: row.is_active,
      sort_order: String(row.sort_order),
    })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        name_ar: form.name_ar.trim(),
        processor: form.processor,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        ...(editing ? {} : { code: form.code.trim() }),
      }
      return editing ? updatePaymentMethod(editing.id, payload) : createPaymentMethod({ ...payload, code: form.code.trim() })
    },
    onSuccess: async () => {
      setFeedback(editing ? t('paymentMethods.updateSuccess') : t('paymentMethods.createSuccess'))
      setError('')
      setFormOpen(false)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, editing ? t('paymentMethods.updateFailed') : t('paymentMethods.createFailed')))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (row: PaymentMethod) => updatePaymentMethod(row.id, { is_active: !row.is_active }),
    onSuccess: async () => {
      setFeedback(t('paymentMethods.updateSuccess'))
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('paymentMethods.updateFailed')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (row: PaymentMethod) => deletePaymentMethod(row.id),
    onSuccess: async () => {
      setFeedback(t('paymentMethods.deleteSuccess'))
      setError('')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('paymentMethods.deleteFailed')))
    },
  })

  const columns: Column<PaymentMethod>[] = [
    { id: 'name', header: t('common.name'), cell: (row) => methodName(row) },
    { id: 'name_ar', header: t('paymentMethods.nameAr'), cell: (row) => displayValue(row.name_ar) },
    { id: 'code', header: t('paymentMethods.code'), cell: (row) => row.code },
    {
      id: 'processor',
      header: t('paymentMethods.processor'),
      cell: (row) => (row.processor === 'cash' ? t('paymentMethods.processorCash') : t('paymentMethods.processorThawani')),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <div className="mz-table-actions">
          <button type="button" className="mz-btn mz-btn--ghost" onClick={() => openEdit(row)}>
            {t('paymentMethods.edit')}
          </button>
          <button
            type="button"
            className="mz-btn mz-btn--ghost"
            onClick={() => toggleMutation.mutate(row)}
            disabled={toggleMutation.isPending}
          >
            {row.is_active ? t('paymentMethods.disable') : t('paymentMethods.enable')}
          </button>
          {!row.is_system ? (
            <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setDeleteTarget(row)}>
              {t('paymentMethods.delete')}
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('paymentMethods.title')}
        subtitle={t('paymentMethods.subtitle')}
        actions={
          <button type="button" className="mz-btn mz-btn--primary" onClick={openCreate}>
            {t('paymentMethods.create')}
          </button>
        }
      />
      {feedback ? <div className="mz-alert mz-alert--ok" style={{ marginBottom: 12 }}>{feedback}</div> : null}
      {error ? <div className="mz-alert" style={{ marginBottom: 12 }}>{error}</div> : null}
      <DataTable
        columns={columns}
        rows={query.data ?? []}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
      />

      <ConfirmDialog
        open={formOpen}
        title={editing ? t('paymentMethods.editTitle') : t('paymentMethods.createTitle')}
        confirmLabel={saveMutation.isPending ? t('common.saving') : t('common.save')}
        busy={saveMutation.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('payment-method-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setFormOpen(false)}
      >
        <form id="payment-method-form" className="mz-form" onSubmit={onSubmit}>
          <FormField label={t('paymentMethods.code')} htmlFor="payment-method-code" required hint={t('paymentMethods.codeHint')}>
            <input
              id="payment-method-code"
              className="mz-input"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              required
              disabled={Boolean(editing)}
            />
          </FormField>
          <FormField label={t('paymentMethods.nameEn')} htmlFor="payment-method-name" required>
            <input
              id="payment-method-name"
              className="mz-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('paymentMethods.nameAr')} htmlFor="payment-method-name-ar" required>
            <input
              id="payment-method-name-ar"
              className="mz-input"
              value={form.name_ar}
              onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('paymentMethods.processor')} htmlFor="payment-method-processor" required hint={t('paymentMethods.processorHint')}>
            <select
              id="payment-method-processor"
              className="mz-select"
              value={form.processor}
              onChange={(event) => setForm((current) => ({ ...current, processor: event.target.value as 'thawani' | 'cash' }))}
              disabled={Boolean(editing?.is_system)}
            >
              {processors.map((processor) => (
                <option key={processor.value} value={processor.value}>
                  {processor.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('paymentMethods.sortOrder')} htmlFor="payment-method-sort">
            <input
              id="payment-method-sort"
              className="mz-input"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
            />
          </FormField>
          <label className="mz-check">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            {t('paymentMethods.active')}
          </label>
        </form>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('paymentMethods.deleteTitle')}
        confirmLabel={t('paymentMethods.delete')}
        danger
        busy={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      >
        <p>{t('paymentMethods.deleteBody')}</p>
      </ConfirmDialog>
    </>
  )
}

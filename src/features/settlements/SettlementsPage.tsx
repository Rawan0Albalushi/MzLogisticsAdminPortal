import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { completeSettlement, createSettlement, fetchSettlements } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Settlement } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'

const emptyForm = {
  provider_organization_id: '',
  amount: '',
  commission_amount: '',
  net_amount: '',
  period_start: '',
  period_end: '',
}

export function SettlementsPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.SETTLEMENTS_MANAGE)
  const list = useListQuery()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['settlements', list.status, list.page],
    queryFn: () => fetchSettlements({ status: list.status, page: list.page }),
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [completeId, setCompleteId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createSettlement({
        provider_organization_id: Number(form.provider_organization_id),
        amount: Number(form.amount),
        commission_amount: Number(form.commission_amount),
        net_amount: Number(form.net_amount),
        period_start: form.period_start,
        period_end: form.period_end,
      }),
    onSuccess: async () => {
      setFeedback(t('settlements.createSuccess'))
      setError('')
      setCreateOpen(false)
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('settlements.createFailed')))
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeSettlement(id),
    onSuccess: async () => {
      setFeedback(t('settlements.completeSuccess'))
      setError('')
      setCompleteId(null)
      await queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('settlements.completeFailed')))
    },
  })

  const columns: Column<Settlement>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider_organization) },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'commission', header: t('settlements.commissionAmount'), cell: (row) => formatMoney(row.commission_amount, row.currency ?? undefined) },
    { id: 'net', header: t('settlements.netAmount'), cell: (row) => formatMoney(row.net_amount, row.currency ?? undefined) },
    { id: 'period', header: t('common.period'), cell: (row) => `${formatDate(row.period_start)} – ${formatDate(row.period_end)}` },
    { id: 'settled', header: t('settlements.settledAt'), cell: (row) => formatDate(row.settled_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) =>
        canManage && row.status !== 'completed' ? (
          <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setCompleteId(row.id)}>
            {t('settlements.complete')}
          </button>
        ) : (
          displayValue(null)
        ),
    },
  ]

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('settlements.title')}
        subtitle={t('settlements.subtitle')}
        actions={
          canManage ? (
            <button type="button" className="mz-btn mz-btn--primary" onClick={() => setCreateOpen(true)}>
              {t('settlements.create')}
            </button>
          ) : null
        }
      />
      {feedback ? <div className="mz-alert mz-alert--ok" style={{ marginBottom: 12 }}>{feedback}</div> : null}
      {error ? <div className="mz-alert" style={{ marginBottom: 12 }}>{error}</div> : null}
      <FilterBar>
        <StatusFilter
          value={list.status}
          options={['pending', 'processing', 'completed']}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        meta={query.data?.meta}
        onPageChange={list.setPage}
      />

      <ConfirmDialog
        open={createOpen}
        title={t('settlements.createTitle')}
        confirmLabel={createMutation.isPending ? t('settlements.creating') : t('common.create')}
        busy={createMutation.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('settlement-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setCreateOpen(false)}
      >
        <form id="settlement-form" className="mz-form" onSubmit={onCreate}>
          <FormField label={t('settlements.providerId')} htmlFor="provider_organization_id" required>
            <input
              id="provider_organization_id"
              className="mz-input"
              type="number"
              min={1}
              value={form.provider_organization_id}
              onChange={(event) => setForm((current) => ({ ...current, provider_organization_id: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('common.amount')} htmlFor="amount" required>
            <input
              id="amount"
              className="mz-input"
              type="number"
              min="0"
              step="0.001"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('settlements.commissionAmount')} htmlFor="commission_amount" required>
            <input
              id="commission_amount"
              className="mz-input"
              type="number"
              min="0"
              step="0.001"
              value={form.commission_amount}
              onChange={(event) => setForm((current) => ({ ...current, commission_amount: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('settlements.netAmount')} htmlFor="net_amount" required>
            <input
              id="net_amount"
              className="mz-input"
              type="number"
              min="0"
              step="0.001"
              value={form.net_amount}
              onChange={(event) => setForm((current) => ({ ...current, net_amount: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('settlements.periodStart')} htmlFor="period_start" required>
            <input
              id="period_start"
              className="mz-input"
              type="date"
              value={form.period_start}
              onChange={(event) => setForm((current) => ({ ...current, period_start: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('settlements.periodEnd')} htmlFor="period_end" required>
            <input
              id="period_end"
              className="mz-input"
              type="date"
              value={form.period_end}
              onChange={(event) => setForm((current) => ({ ...current, period_end: event.target.value }))}
              required
            />
          </FormField>
        </form>
      </ConfirmDialog>

      <ConfirmDialog
        open={completeId !== null}
        title={t('settlements.completeTitle')}
        confirmLabel={t('common.complete')}
        busy={completeMutation.isPending}
        onConfirm={() => {
          if (completeId !== null) {
            completeMutation.mutate(completeId)
          }
        }}
        onClose={() => setCompleteId(null)}
      >
        <p>{t('settlements.completeBody')}</p>
      </ConfirmDialog>
    </>
  )
}

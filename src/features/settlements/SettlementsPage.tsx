import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { completeSettlement, createSettlement, fetchProviders, fetchSettlements, fetchWallets } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Settlement } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'

function localIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function emptyForm() {
  const now = new Date()
  return {
    provider_organization_id: '',
    amount: '',
    period_start: localIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    period_end: localIsoDate(now),
  }
}

export function SettlementsPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.SETTLEMENTS_MANAGE)
  const list = useListQuery()
  const queryClient = useQueryClient()
  const catalog = useCatalog()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(() => emptyForm())
  const query = useQuery({
    queryKey: ['settlements', list.search, list.status, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchSettlements({
        search: list.search,
        status: list.status,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })
  const providersQuery = useQuery({
    queryKey: ['providers', 'settlement-options'],
    queryFn: () => fetchProviders({ per_page: 100, page: 1 }),
    enabled: createOpen,
  })
  const walletQuery = useQuery({
    queryKey: ['wallets', 'settlement', form.provider_organization_id],
    queryFn: () => fetchWallets({ organization_id: form.provider_organization_id, per_page: 1 }),
    enabled: createOpen && Boolean(form.provider_organization_id),
  })
  const [completeId, setCompleteId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const availableBalance = Number(walletQuery.data?.items[0]?.available_balance ?? 0)
    if (!form.provider_organization_id || !walletQuery.isSuccess) {
      return
    }
    setForm((current) => {
      if (current.amount !== '') {
        return current
      }
      return { ...current, amount: availableBalance > 0 ? availableBalance.toFixed(3) : '' }
    })
  }, [form.provider_organization_id, walletQuery.data, walletQuery.isSuccess])

  const createMutation = useMutation({
    mutationFn: () =>
      createSettlement({
        provider_organization_id: Number(form.provider_organization_id),
        amount: Number(form.amount),
        period_start: form.period_start,
        period_end: form.period_end,
      }),
    onSuccess: async () => {
      setFeedback(t('settlements.createSuccess'))
      setError('')
      setCreateOpen(false)
      setForm(emptyForm())
      await queryClient.invalidateQueries({ queryKey: ['settlements'] })
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('settlements.completeFailed')))
    },
  })

  const columns: Column<Settlement>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider_organization) },
    { id: 'amount', header: t('settlements.payoutAmount'), cell: (row) => formatMoney(row.net_amount ?? row.amount, row.currency ?? undefined) },
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

  const providers = [...(providersQuery.data?.items ?? [])].sort((left, right) =>
    organizationName(left).localeCompare(organizationName(right), undefined, { sensitivity: 'base' }),
  )
  const selectedProvider = providers.find((item) => String(item.id) === form.provider_organization_id)
  const wallet = walletQuery.data?.items[0]
  const available = Number(wallet?.available_balance ?? 0)
  const pending = Number(wallet?.pending_balance ?? 0)
  const reserved = Number(wallet?.reserved_balance ?? 0)
  const commissionRate = Number(
    selectedProvider?.effective_commission_rate ?? selectedProvider?.commission_rate ?? catalog.data?.commission_rate ?? 0.1,
  )
  const canSubmit =
    Boolean(form.provider_organization_id) &&
    walletQuery.isSuccess &&
    Number(form.amount) > 0 &&
    Number(form.amount) <= available + 0.0005

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
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <StatusFilter
          value={list.status}
          options={['pending', 'processing', 'completed']}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
        <DateRangeFilter
          from={list.dateFrom}
          to={list.dateTo}
          onChange={(nextFrom, nextTo) => list.setFilters({ date_from: nextFrom, date_to: nextTo })}
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
        disabled={!canSubmit}
        onConfirm={() => {
          const formEl = document.getElementById('settlement-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setCreateOpen(false)}
      >
        <form id="settlement-form" className="mz-form" onSubmit={onCreate}>
          <FormField
            label={t('common.provider')}
            htmlFor="provider_organization_id"
            required
            error={providersQuery.isError ? t('settlements.providersFailed') : undefined}
          >
            <select
              id="provider_organization_id"
              className="mz-select"
              value={form.provider_organization_id}
              onChange={(event) => {
                const providerId = event.target.value
                setForm((current) => ({ ...current, provider_organization_id: providerId, amount: '' }))
              }}
              required
              disabled={providersQuery.isLoading}
            >
              <option value="">{providersQuery.isLoading ? t('common.loading') : t('settlements.providerPlaceholder')}</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {organizationName(provider)}
                  {provider.status !== 'active' ? ` · ${t(`status.${provider.status}`)}` : ''}
                </option>
              ))}
            </select>
          </FormField>
          {form.provider_organization_id ? (
            <InfoGrid
              fields={[
                {
                  label: t('settlements.commissionRate'),
                  value: t('settlements.commissionRateValue', { rate: (commissionRate * 100).toFixed(1) }),
                },
                { label: t('wallets.available'), value: formatMoney(available, wallet?.currency ?? undefined) },
                { label: t('wallets.pending'), value: formatMoney(pending, wallet?.currency ?? undefined) },
                { label: t('wallets.reserved'), value: formatMoney(reserved, wallet?.currency ?? undefined) },
              ]}
            />
          ) : null}
          <p className="mz-field__hint">{t('settlements.commissionPresetHint')}</p>
          <FormField
            label={t('settlements.payoutAmount')}
            htmlFor="amount"
            required
            hint={t('settlements.payoutHint')}
            error={form.provider_organization_id && walletQuery.isSuccess && available <= 0 ? t('settlements.noAvailable') : undefined}
          >
            <input
              id="amount"
              className="mz-input"
              type="number"
              min="0.001"
              max={available || undefined}
              step="0.001"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              required
              disabled={!form.provider_organization_id || walletQuery.isFetching || available <= 0}
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

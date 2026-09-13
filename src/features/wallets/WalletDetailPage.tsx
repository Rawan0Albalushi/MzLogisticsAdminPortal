import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchWallet, fetchWalletTransactions } from '@/core/api/services.ts'
import type { WalletTransaction } from '@/core/api/types.ts'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { WALLET_TRANSACTION_TYPES } from '@/core/constants/statuses.ts'
import { displayValue, formatCommissionRate, formatDateTime, formatMoney, organizationName } from '@/shared/utils/format.ts'

export function WalletDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const list = useListQuery()
  const walletQuery = useQuery({
    queryKey: ['wallet', id],
    queryFn: () => fetchWallet(id),
    enabled: Boolean(id),
  })
  const ledgerQuery = useQuery({
    queryKey: ['wallet', id, 'transactions', list.search, list.type, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchWalletTransactions(id, {
        search: list.search,
        type: list.type,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
    enabled: Boolean(id),
  })

  if (walletQuery.isLoading) {
    return <LoadingState />
  }

  if (walletQuery.isError || !walletQuery.data) {
    return <ErrorState onRetry={() => void walletQuery.refetch()} />
  }

  const wallet = walletQuery.data
  const columns: Column<WalletTransaction>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    {
      id: 'type',
      header: t('common.type'),
      cell: (row) => <StatusBadge status={row.type} />,
    },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    {
      id: 'job',
      header: t('nav.jobs'),
      cell: (row) =>
        row.job ? (
          <Link className="mz-link" to={`/jobs/${row.job.id}`}>
            {row.job.reference}
          </Link>
        ) : (
          displayValue(null)
        ),
    },
    {
      id: 'payment',
      header: t('nav.payments'),
      cell: (row) =>
        row.payment ? (
          <Link className="mz-link" to="/payments">
            {row.payment.reference}
          </Link>
        ) : (
          displayValue(null)
        ),
    },
    { id: 'created', header: t('common.createdAt'), cell: (row) => formatDateTime(row.created_at) },
  ]

  return (
    <>
      <PageHeader
        title={t('wallets.detailTitle', { name: organizationName(wallet.organization) })}
        subtitle={t('wallets.detailSubtitle')}
        crumbs={[{ label: t('wallets.title'), to: '/wallets' }, { label: organizationName(wallet.organization) }]}
      />
      <section className="mz-card">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('common.provider'), value: organizationName(wallet.organization) },
              {
                label: t('providers.commissionRate'),
                value: formatCommissionRate(
                  wallet.organization?.effective_commission_rate ?? wallet.organization?.commission_rate,
                ),
              },
              { label: t('wallets.pending'), value: formatMoney(wallet.pending_balance, wallet.currency ?? undefined) },
              { label: t('wallets.available'), value: formatMoney(wallet.available_balance, wallet.currency ?? undefined) },
              { label: t('wallets.reserved'), value: formatMoney(wallet.reserved_balance, wallet.currency ?? undefined) },
              { label: t('wallets.outstanding'), value: formatMoney(wallet.outstanding_balance, wallet.currency ?? undefined) },
              { label: t('wallets.lifetimeEarned'), value: formatMoney(wallet.lifetime_earned, wallet.currency ?? undefined) },
              { label: t('wallets.lifetimeWithdrawn'), value: formatMoney(wallet.lifetime_withdrawn, wallet.currency ?? undefined) },
            ]}
          />
        </div>
      </section>
      <h2 className="mz-section-label">{t('wallets.ledger')}</h2>
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <StatusFilter
          value={list.type}
          options={[...WALLET_TRANSACTION_TYPES]}
          onChange={(value) => list.setFilter('type', value)}
          allLabel={t('common.allTypes')}
          label={(type) => t(`status.${type}`, { defaultValue: type })}
        />
        <DateRangeFilter
          from={list.dateFrom}
          to={list.dateTo}
          onChange={(nextFrom, nextTo) => list.setFilters({ date_from: nextFrom, date_to: nextTo })}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={ledgerQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={ledgerQuery.isLoading}
        isError={ledgerQuery.isError}
        onRetry={() => void ledgerQuery.refetch()}
        meta={ledgerQuery.data?.meta}
        onPageChange={list.setPage}
      />
    </>
  )
}

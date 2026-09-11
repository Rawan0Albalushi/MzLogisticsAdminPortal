import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchWallets } from '@/core/api/services.ts'
import type { Wallet } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { formatCommissionRate, formatMoney, organizationName } from '@/shared/utils/format.ts'

export function WalletsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['wallets', list.page],
    queryFn: () => fetchWallets({ page: list.page }),
  })

  const columns: Column<Wallet>[] = [
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.organization) },
    {
      id: 'commission',
      header: t('providers.commissionRate'),
      cell: (row) => formatCommissionRate(row.organization?.effective_commission_rate ?? row.organization?.commission_rate),
    },
    { id: 'pending', header: t('wallets.pending'), cell: (row) => formatMoney(row.pending_balance, row.currency ?? undefined) },
    { id: 'available', header: t('wallets.available'), cell: (row) => formatMoney(row.available_balance, row.currency ?? undefined) },
    { id: 'reserved', header: t('wallets.reserved'), cell: (row) => formatMoney(row.reserved_balance, row.currency ?? undefined) },
    { id: 'outstanding', header: t('wallets.outstanding'), cell: (row) => formatMoney(row.outstanding_balance, row.currency ?? undefined) },
    { id: 'earned', header: t('wallets.lifetimeEarned'), cell: (row) => formatMoney(row.lifetime_earned, row.currency ?? undefined) },
    { id: 'withdrawn', header: t('wallets.lifetimeWithdrawn'), cell: (row) => formatMoney(row.lifetime_withdrawn, row.currency ?? undefined) },
  ]

  return (
    <>
      <PageHeader title={t('wallets.title')} subtitle={t('wallets.subtitle')} />
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        rowTo={(row) => `/wallets/${row.id}`}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        meta={query.data?.meta}
        onPageChange={list.setPage}
      />
    </>
  )
}

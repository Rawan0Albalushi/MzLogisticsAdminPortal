import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchWallets } from '@/core/api/services.ts'
import type { Wallet } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { formatCommissionRate, formatMoney, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function WalletsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['wallets', list.search, list.page],
    queryFn: () => fetchWallets({ search: list.search, page: list.page }),
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
      <PageHeader
        title={t('wallets.title')}
        subtitle={t('wallets.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchWallets({ search: list.search, page, per_page: perPage }),
              )
              return createListReport({
                title: t('wallets.title'),
                subtitle: t('wallets.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.provider'),
                  t('providers.commissionRate'),
                  t('wallets.pending'),
                  t('wallets.available'),
                  t('wallets.reserved'),
                  t('wallets.outstanding'),
                  t('wallets.lifetimeEarned'),
                  t('wallets.lifetimeWithdrawn'),
                ],
                rows: items.map((row) => [
                  organizationName(row.organization),
                  formatCommissionRate(row.organization?.effective_commission_rate ?? row.organization?.commission_rate),
                  formatMoney(row.pending_balance, row.currency ?? undefined),
                  formatMoney(row.available_balance, row.currency ?? undefined),
                  formatMoney(row.reserved_balance, row.currency ?? undefined),
                  formatMoney(row.outstanding_balance, row.currency ?? undefined),
                  formatMoney(row.lifetime_earned, row.currency ?? undefined),
                  formatMoney(row.lifetime_withdrawn, row.currency ?? undefined),
                ]),
              })
            }}
          />
        }
      />
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
      </FilterBar>
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

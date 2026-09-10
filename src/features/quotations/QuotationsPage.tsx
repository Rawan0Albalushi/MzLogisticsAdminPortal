import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchQuotations } from '@/core/api/services.ts'
import type { Quotation } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { displayValue, formatMoney, organizationName } from '@/shared/utils/format.ts'

export function QuotationsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const catalog = useCatalog()
  const statuses = catalog.data?.quotation_statuses ?? ['submitted', 'withdrawn', 'accepted', 'rejected', 'expired']
  const query = useQuery({
    queryKey: ['quotations', list.status, list.page],
    queryFn: () => fetchQuotations({ status: list.status, page: list.page }),
  })

  const columns: Column<Quotation>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/quotations/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider) },
    { id: 'price', header: t('quotations.price'), cell: (row) => formatMoney(row.total_price, row.currency ?? undefined) },
    { id: 'trucks', header: t('quotations.truckCount'), cell: (row) => displayValue(row.truck_count) },
    { id: 'trips', header: t('quotations.tripCount'), cell: (row) => displayValue(row.trip_count) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/quotations/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader title={t('quotations.title')} subtitle={t('quotations.subtitle')} />
      <FilterBar>
        <StatusFilter
          value={list.status}
          options={statuses}
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
        rowTo={(row) => `/quotations/${row.id}`}
      />
    </>
  )
}

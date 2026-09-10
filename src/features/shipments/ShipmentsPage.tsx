import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchShipments } from '@/core/api/services.ts'
import type { Shipment } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'

export function ShipmentsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const catalog = useCatalog()
  const statuses = catalog.data?.shipment_statuses ?? ['draft', 'published', 'awarded', 'cancelled', 'expired']
  const query = useQuery({
    queryKey: ['shipments', list.search, list.status, list.page],
    queryFn: () => fetchShipments({ search: list.search, status: list.status, page: list.page }),
  })

  const columns: Column<Shipment>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/shipments/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'customer', header: t('common.customer'), cell: (row) => organizationName(row.customer) },
    { id: 'cargo', header: t('shipments.cargoType'), cell: (row) => displayValue(row.cargo_type) },
    { id: 'route', header: t('common.pickup'), cell: (row) => `${displayValue(row.pickup_city)} → ${displayValue(row.delivery_city)}` },
    { id: 'date', header: t('shipments.requiredDate'), cell: (row) => formatDate(row.required_date) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/shipments/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader title={t('shipments.title')} subtitle={t('shipments.subtitle')} />
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
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
        rowTo={(row) => `/shipments/${row.id}`}
      />
    </>
  )
}

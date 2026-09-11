import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchTrucks } from '@/core/api/services.ts'
import type { Truck } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'

const STATUSES = ['available', 'assigned', 'maintenance', 'inactive']

export function FleetPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['trucks', list.status, list.page],
    queryFn: () => fetchTrucks({ status: list.status, page: list.page }),
  })

  const columns: Column<Truck>[] = [
    { id: 'plate', header: t('fleet.plate'), cell: (row) => row.plate_number },
    { id: 'type', header: t('common.type'), cell: (row) => displayValue(row.type_label ?? row.type) },
    { id: 'capacity', header: t('fleet.capacity'), cell: (row) => displayValue(row.capacity_tons) },
    { id: 'make', header: t('fleet.make'), cell: (row) => `${displayValue(row.make)} ${displayValue(row.model)}` },
    { id: 'org', header: t('common.provider'), cell: (row) => organizationName(row.organization) },
    { id: 'driver', header: t('fleet.assignedDriver'), cell: (row) => displayValue(row.assigned_driver?.name) },
    { id: 'insurance', header: t('fleet.insurance'), cell: (row) => formatDate(row.insurance_expires_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <PageHeader title={t('fleet.title')} subtitle={t('fleet.subtitle')} />
      <FilterBar>
        <StatusFilter
          value={list.status}
          options={STATUSES}
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
    </>
  )
}

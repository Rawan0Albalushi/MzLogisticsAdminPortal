import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchTrucks } from '@/core/api/services.ts'
import type { Truck } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { TRUCK_LIST_STATUSES } from '@/core/constants/statuses.ts'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function FleetPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['trucks', list.search, list.status, list.page],
    queryFn: () => fetchTrucks({ search: list.search, status: list.status, page: list.page }),
  })

  const columns: Column<Truck>[] = [
    { id: 'plate', header: t('fleet.plate'), cell: (row) => row.plate_number },
    { id: 'type', header: t('common.type'), cell: (row) => displayValue(row.type_label ?? row.type) },
    { id: 'capacity', header: t('fleet.capacity'), cell: (row) => displayValue(row.capacity_tons) },
    { id: 'volume', header: t('fleet.volume'), cell: (row) => displayValue(row.volume_cbm) },
    { id: 'make', header: t('fleet.make'), cell: (row) => `${displayValue(row.make)} ${displayValue(row.model)}` },
    { id: 'org', header: t('common.provider'), cell: (row) => organizationName(row.organization) },
    { id: 'driver', header: t('fleet.assignedDriver'), cell: (row) => displayValue(row.assigned_driver?.name) },
    { id: 'insurance', header: t('fleet.insurance'), cell: (row) => formatDate(row.insurance_expires_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <PageHeader
        title={t('fleet.title')}
        subtitle={t('fleet.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchTrucks({ search: list.search, status: list.status, page, per_page: perPage }),
              )
              return createListReport({
                title: t('fleet.title'),
                subtitle: t('fleet.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('fleet.plate'),
                  t('common.type'),
                  t('fleet.capacity'),
                  t('fleet.volume'),
                  t('fleet.make'),
                  t('common.provider'),
                  t('fleet.assignedDriver'),
                  t('fleet.insurance'),
                  t('common.status'),
                ],
                rows: items.map((row) => [
                  row.plate_number,
                  displayValue(row.type_label ?? row.type),
                  displayValue(row.capacity_tons),
                  displayValue(row.volume_cbm),
                  `${displayValue(row.make)} ${displayValue(row.model)}`,
                  organizationName(row.organization),
                  displayValue(row.assigned_driver?.name),
                  formatDate(row.insurance_expires_at),
                  reportStatus(t, row.status),
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
        <StatusFilter
          value={list.status}
          options={[...TRUCK_LIST_STATUSES]}
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

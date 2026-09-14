import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchDrivers } from '@/core/api/services.ts'
import type { AuthUser } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { DRIVER_LIST_STATUSES } from '@/core/constants/statuses.ts'
import { displayValue, formatDate, formatDateTime } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function DriversPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['drivers', list.search, list.status, list.page],
    queryFn: () => fetchDrivers({ search: list.search, status: list.status, page: list.page }),
  })

  const columns: Column<AuthUser>[] = [
    { id: 'name', header: t('common.name'), cell: (row) => row.name },
    { id: 'email', header: t('common.email'), cell: (row) => row.email },
    { id: 'phone', header: t('common.phone'), cell: (row) => displayValue(row.phone) },
    { id: 'license', header: t('drivers.license'), cell: (row) => displayValue(row.driver_profile?.license_number) },
    { id: 'expiry', header: t('drivers.licenseExpiry'), cell: (row) => formatDate(row.driver_profile?.license_expires_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.driver_profile?.status} /> },
    { id: 'login', header: t('drivers.lastLogin'), cell: (row) => formatDateTime(row.last_login_at) },
  ]

  return (
    <>
      <PageHeader
        title={t('drivers.title')}
        subtitle={t('drivers.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchDrivers({ search: list.search, status: list.status, page, per_page: perPage }),
              )
              return createListReport({
                title: t('drivers.title'),
                subtitle: t('drivers.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.name'),
                  t('common.email'),
                  t('common.phone'),
                  t('drivers.license'),
                  t('drivers.licenseExpiry'),
                  t('common.status'),
                  t('drivers.lastLogin'),
                ],
                rows: items.map((row) => [
                  row.name,
                  row.email,
                  displayValue(row.phone),
                  displayValue(row.driver_profile?.license_number),
                  formatDate(row.driver_profile?.license_expires_at),
                  reportStatus(t, row.driver_profile?.status),
                  formatDateTime(row.last_login_at),
                ]),
              })
            }}
          />
        }
      />
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <StatusFilter
          value={list.status}
          options={[...DRIVER_LIST_STATUSES]}
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

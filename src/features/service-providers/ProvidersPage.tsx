import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchProviders } from '@/core/api/services.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import type { Organization } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { TableIconButton } from '@/shared/components/TableIconButton.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

const STATUSES = ['pending', 'active', 'suspended', 'rejected']

export function ProvidersPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission(PERMISSIONS.PROVIDERS_MANAGE)
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['providers', list.search, list.status, list.city, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchProviders({
        search: list.search,
        status: list.status,
        city: list.city,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const columns: Column<Organization>[] = [
    {
      id: 'name',
      header: t('common.name'),
      cell: (row) => (
        <Link className="mz-link" to={`/providers/${row.id}`}>
          {organizationName(row)}
        </Link>
      ),
    },
    { id: 'cr', header: t('customers.commercialRegister'), cell: (row) => displayValue(row.commercial_register) },
    { id: 'city', header: t('common.city'), cell: (row) => displayValue(row.city) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'created', header: t('common.createdAt'), cell: (row) => formatDate(row.created_at) },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <div className="mz-table-actions">
          <TableIconButton icon="view" label={t('common.view')} to={`/providers/${row.id}`} />
          {canCreate ? <TableIconButton icon="edit" label={t('common.edit')} to={`/providers/${row.id}/edit`} /> : null}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={t('providers.title')}
        subtitle={t('providers.subtitle')}
        actions={
          <>
            {canCreate ? (
              <Link className="mz-btn mz-btn--primary" to="/providers/new">
                {t('providers.create')}
              </Link>
            ) : null}
            <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchProviders({
                  search: list.search,
                  status: list.status,
                  city: list.city,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createListReport({
                title: t('providers.title'),
                subtitle: t('providers.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.name'),
                  t('customers.commercialRegister'),
                  t('common.city'),
                  t('common.status'),
                  t('common.createdAt'),
                ],
                rows: items.map((row) => [
                  organizationName(row),
                  displayValue(row.commercial_register),
                  displayValue(row.city),
                  reportStatus(t, row.status),
                  formatDate(row.created_at),
                ]),
              })
            }}
          />
          </>
        }
      />
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <SearchInput value={list.city} onChange={(value) => list.setFilter('city', value)} placeholder={t('common.cityPlaceholder')} />
        <StatusFilter
          value={list.status}
          options={STATUSES}
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
        rowTo={(row) => `/providers/${row.id}`}
      />
    </>
  )
}

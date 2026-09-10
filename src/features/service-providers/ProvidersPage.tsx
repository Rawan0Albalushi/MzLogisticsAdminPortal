import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchProviders } from '@/core/api/services.ts'
import type { Organization } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'

const STATUSES = ['pending', 'active', 'suspended', 'rejected']

export function ProvidersPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['providers', list.search, list.status, list.page],
    queryFn: () => fetchProviders({ search: list.search, status: list.status, page: list.page }),
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
        <Link className="mz-link" to={`/providers/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader title={t('providers.title')} subtitle={t('providers.subtitle')} />
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
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
        rowTo={(row) => `/providers/${row.id}`}
      />
    </>
  )
}

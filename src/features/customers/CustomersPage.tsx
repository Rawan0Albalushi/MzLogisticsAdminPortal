import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchCustomers } from '@/core/api/services.ts'
import { CUSTOMER_ACCOUNT_TYPES, ORGANIZATION_LIST_STATUSES } from '@/core/constants/statuses.ts'
import type { Organization } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, enumString, formatDate, isCustomerOrganization, organizationName } from '@/shared/utils/format.ts'

export function CustomersPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['customers', list.search, list.status, list.accountType, list.city, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchCustomers({
        search: list.search,
        status: list.status,
        account_type: list.accountType,
        city: list.city,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const rows = useMemo(
    () => (query.data?.items ?? []).filter((row) => isCustomerOrganization(row) || !enumString(row.type)),
    [query.data?.items],
  )

  const columns: Column<Organization>[] = [
    {
      id: 'name',
      header: t('common.name'),
      cell: (row) => (
        <Link className="mz-link" to={`/customers/${row.id}`}>
          {organizationName(row)}
        </Link>
      ),
    },
    {
      id: 'accountType',
      header: t('customers.accountType'),
      cell: (row) => <StatusBadge status={enumString(row.account_type)} />,
    },
    { id: 'email', header: t('common.email'), cell: (row) => displayValue(row.email) },
    { id: 'city', header: t('common.city'), cell: (row) => displayValue(row.city) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    { id: 'created', header: t('common.createdAt'), cell: (row) => formatDate(row.created_at) },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/customers/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader title={t('customers.title')} subtitle={t('customers.subtitle')} />
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <SearchInput value={list.city} onChange={(value) => list.setFilter('city', value)} placeholder={t('common.cityPlaceholder')} />
        <StatusFilter
          value={list.accountType}
          options={[...CUSTOMER_ACCOUNT_TYPES]}
          onChange={(value) => list.setFilter('account_type', value)}
          allLabel={t('customers.allAccountTypes')}
          label={(value) => t(`status.${value}`)}
        />
        <StatusFilter
          value={list.status}
          options={[...ORGANIZATION_LIST_STATUSES]}
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
        rows={rows}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        meta={query.data?.meta}
        onPageChange={list.setPage}
        rowTo={(row) => `/customers/${row.id}`}
      />
    </>
  )
}

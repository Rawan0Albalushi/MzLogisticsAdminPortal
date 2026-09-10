import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchUsers } from '@/core/api/services.ts'
import type { AuthUser } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDateTime } from '@/shared/utils/format.ts'

const TYPES = ['platform', 'customer', 'provider', 'driver']
const STATUSES = ['active', 'inactive']

export function UsersPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['users', list.search, list.type, list.status, list.role, list.page],
    queryFn: () =>
      fetchUsers({
        search: list.search,
        type: list.type,
        status: list.status,
        role: list.role,
        page: list.page,
      }),
  })

  const columns: Column<AuthUser>[] = [
    {
      id: 'name',
      header: t('common.name'),
      cell: (row) => (
        <Link className="mz-link" to={`/users/${row.id}`}>
          {row.name}
        </Link>
      ),
    },
    { id: 'email', header: t('common.email'), cell: (row) => row.email },
    { id: 'phone', header: t('common.phone'), cell: (row) => displayValue(row.phone) },
    {
      id: 'role',
      header: t('settings.role'),
      cell: (row) =>
        (row.roles ?? []).map((role) => t(`roles.${role}`, { defaultValue: role })).join(', ') || t('common.noValue'),
    },
    { id: 'type', header: t('settings.userType'), cell: (row) => t(`status.${row.user_type}`, { defaultValue: row.user_type }) },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    { id: 'login', header: t('drivers.lastLogin'), cell: (row) => formatDateTime(row.last_login_at) },
  ]

  return (
    <>
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={
          <Link className="mz-btn mz-btn--primary" to="/users/new">
            {t('users.create')}
          </Link>
        }
      />
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <StatusFilter
          value={list.type}
          options={TYPES}
          onChange={(value) => list.setFilter('type', value)}
          allLabel={t('users.allTypes')}
          label={(value) => t(`status.${value}`)}
        />
        <StatusFilter
          value={list.status}
          options={STATUSES}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(value) => t(`status.${value}`)}
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
        rowTo={(row) => `/users/${row.id}`}
      />
    </>
  )
}

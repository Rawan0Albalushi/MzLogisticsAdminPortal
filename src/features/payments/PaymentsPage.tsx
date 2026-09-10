import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchPayments } from '@/core/api/services.ts'
import type { Payment } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { displayValue, formatDateTime, formatMoney } from '@/shared/utils/format.ts'

export function PaymentsPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const catalog = useCatalog()
  const statuses = catalog.data?.payment_statuses ?? ['pending', 'processing', 'completed', 'failed', 'refunded']
  const query = useQuery({
    queryKey: ['payments', list.status, list.page],
    queryFn: () => fetchPayments({ status: list.status, page: list.page }),
  })

  const columns: Column<Payment>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'commission', header: t('common.commission'), cell: (row) => formatMoney(row.commission_amount, row.currency ?? undefined) },
    { id: 'provider', header: t('payments.providerAmount'), cell: (row) => formatMoney(row.provider_amount, row.currency ?? undefined) },
    { id: 'method', header: t('payments.method'), cell: (row) => displayValue(row.method) },
    { id: 'gateway', header: t('payments.gateway'), cell: (row) => displayValue(row.gateway) },
    { id: 'paid', header: t('payments.paidAt'), cell: (row) => formatDateTime(row.paid_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />
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
      />
    </>
  )
}

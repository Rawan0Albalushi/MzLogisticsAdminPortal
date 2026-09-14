import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchInvoices } from '@/core/api/services.ts'
import type { Invoice } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { INVOICE_STATUSES, INVOICE_TYPES } from '@/core/constants/statuses.ts'
import { formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function InvoicesPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const query = useQuery({
    queryKey: ['invoices', list.search, list.type, list.status, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchInvoices({
        search: list.search,
        type: list.type,
        status: list.status,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const columns: Column<Invoice>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'type', header: t('common.type'), cell: (row) => t(`status.${row.type}`, { defaultValue: row.type }) },
    { id: 'org', header: t('settings.organization'), cell: (row) => organizationName(row.organization) },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'issued', header: t('invoices.issuedAt'), cell: (row) => formatDate(row.issued_at) },
    { id: 'due', header: t('invoices.dueAt'), cell: (row) => formatDate(row.due_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <PageHeader
        title={t('invoices.title')}
        subtitle={t('invoices.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchInvoices({
                  search: list.search,
                  type: list.type,
                  status: list.status,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createListReport({
                title: t('invoices.title'),
                subtitle: t('invoices.subtitle'),
                filters: listReportFilters(t, list),
                columns: [
                  t('common.reference'),
                  t('common.type'),
                  t('settings.organization'),
                  t('common.amount'),
                  t('invoices.issuedAt'),
                  t('invoices.dueAt'),
                  t('common.status'),
                ],
                rows: items.map((row) => [
                  row.reference,
                  reportStatus(t, row.type),
                  organizationName(row.organization),
                  formatMoney(row.amount, row.currency ?? undefined),
                  formatDate(row.issued_at),
                  formatDate(row.due_at),
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
          value={list.type}
          options={[...INVOICE_TYPES]}
          onChange={(value) => list.setFilter('type', value)}
          allLabel={t('common.allTypes')}
          label={(type) => t(`status.${type}`)}
        />
        <StatusFilter
          value={list.status}
          options={[...INVOICE_STATUSES]}
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
      />
    </>
  )
}

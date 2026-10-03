import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { downloadPaymentReceipt, fetchInvoices } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Invoice } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { canRecordBankTransfer, RecordTransferDialog } from '@/features/invoices/RecordTransferDialog.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { TableIconButton } from '@/shared/components/TableIconButton.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { INVOICE_STATUSES, INVOICE_TYPES } from '@/core/constants/statuses.ts'
import { formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function InvoicesPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canConfirm = hasPermission(PERMISSIONS.PAYMENTS_MANAGE)
  const list = useListQuery()
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
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
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => {
        const payment = row.payment
        return (
          <div className="mz-table-actions">
            {canConfirm && canRecordBankTransfer(row) ? (
              <TableIconButton
                icon="confirm"
                tone="success"
                label={t('invoices.recordTransfer')}
                onClick={() => setRecordInvoice(row)}
              />
            ) : null}
            {payment?.has_receipt ? (
              <TableIconButton
                icon="receipt"
                label={t('payments.receipt')}
                onClick={() => {
                  void downloadPaymentReceipt(payment.id, `${payment.reference}-receipt`).catch((err) => {
                    setError(getApiMessage(err, t('payments.receiptFailed')))
                  })
                }}
              />
            ) : null}
          </div>
        )
      },
    },
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
      {feedback ? <div className="mz-alert mz-alert--ok" style={{ marginBottom: 12 }}>{feedback}</div> : null}
      {error ? <div className="mz-alert" style={{ marginBottom: 12 }}>{error}</div> : null}
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <StatusFilter
          value={list.type}
          options={INVOICE_TYPES.filter((type) => type !== 'commission')}
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
      <RecordTransferDialog
        invoice={recordInvoice}
        open={recordInvoice !== null}
        onClose={() => setRecordInvoice(null)}
        onRecorded={() => {
          setError('')
          setFeedback(t('invoices.recordSuccess'))
        }}
      />
    </>
  )
}

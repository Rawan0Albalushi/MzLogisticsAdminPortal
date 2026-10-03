import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { downloadPaymentReceipt, fetchPayments } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Payment } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { awaitsBankTransfer, ConfirmTransferDialog, paymentMethodLabel } from '@/features/payments/ConfirmTransferDialog.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { JobProjectFilters, useRecordScopeLabels } from '@/shared/components/JobProjectFilters.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { TableIconButton } from '@/shared/components/TableIconButton.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { PAYMENT_METHODS } from '@/core/constants/statuses.ts'
import { displayValue, formatDateTime, formatMoney } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function PaymentsPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canConfirm = hasPermission(PERMISSIONS.PAYMENTS_MANAGE)
  const list = useListQuery()
  const scope = useRecordScopeLabels(list.jobId, list.project)
  const catalog = useCatalog()
  const [confirmPayment, setConfirmPayment] = useState<Payment | null>(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const statuses = catalog.data?.payment_statuses ?? ['pending', 'processing', 'completed', 'failed', 'refunded']
  const query = useQuery({
    queryKey: ['payments', list.search, list.status, list.method, list.project, list.jobId, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchPayments({
        search: list.search,
        status: list.status,
        method: list.method,
        project: list.project,
        job_id: list.jobId,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
  })

  const columns: Column<Payment>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'provider', header: t('payments.providerAmount'), cell: (row) => formatMoney(row.provider_amount, row.currency ?? undefined) },
    { id: 'method', header: t('payments.method'), cell: (row) => paymentMethodLabel(t, row.method) },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <div className="mz-table-actions">
          {canConfirm && awaitsBankTransfer(row) ? (
            <TableIconButton
              icon="confirm"
              tone="success"
              label={t('payments.confirmTransfer')}
              onClick={() => setConfirmPayment(row)}
            />
          ) : null}
          {row.has_receipt ? (
            <TableIconButton
              icon="receipt"
              label={t('payments.receipt')}
              onClick={() => {
                void downloadPaymentReceipt(row.id, `${row.reference}-receipt`).catch((err) => {
                  setError(getApiMessage(err, t('payments.receiptFailed')))
                })
              }}
            />
          ) : null}
        </div>
      ),
    },
    { id: 'gateway', header: t('payments.gateway'), cell: (row) => displayValue(row.gateway) },
    { id: 'paid', header: t('payments.paidAt'), cell: (row) => formatDateTime(row.paid_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <>
      <PageHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchPayments({
                  search: list.search,
                  status: list.status,
                  method: list.method,
                  project: list.project,
                  job_id: list.jobId,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createListReport({
                title: t('payments.title'),
                subtitle: t('payments.subtitle'),
                filters: listReportFilters(t, { ...list, job: scope.jobLabel, project: scope.projectLabel }),
                columns: [
                  t('common.reference'),
                  t('common.amount'),
                  t('payments.providerAmount'),
                  t('payments.method'),
                  t('payments.gateway'),
                  t('payments.paidAt'),
                  t('common.status'),
                ],
                rows: items.map((row) => [
                  row.reference,
                  formatMoney(row.amount, row.currency ?? undefined),
                  formatMoney(row.provider_amount, row.currency ?? undefined),
                  paymentMethodLabel(t, row.method),
                  displayValue(row.gateway),
                  formatDateTime(row.paid_at),
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
          value={list.status}
          options={statuses}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
        <StatusFilter
          value={list.method}
          options={[...PAYMENT_METHODS]}
          onChange={(value) => list.setFilter('method', value)}
          allLabel={t('common.allMethods')}
          label={(method) => paymentMethodLabel(t, method)}
        />
        <DateRangeFilter
          from={list.dateFrom}
          to={list.dateTo}
          onChange={(nextFrom, nextTo) => list.setFilters({ date_from: nextFrom, date_to: nextTo })}
        />
        <JobProjectFilters
          jobId={list.jobId}
          projectId={list.project}
          onProjectChange={(value) => list.setFilters({ project: value, job_id: '' })}
          onJobChange={(value) => list.setFilter('job_id', value)}
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
      <ConfirmTransferDialog
        payment={confirmPayment}
        open={confirmPayment !== null}
        onClose={() => setConfirmPayment(null)}
        onConfirmed={() => {
          setError('')
          setFeedback(t('payments.confirmSuccess'))
        }}
      />
    </>
  )
}

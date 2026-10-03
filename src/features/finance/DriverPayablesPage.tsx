import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { downloadDriverPayableReceipt, fetchDriverPayables, payDriverPayable } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { DriverPayable } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { JobProjectFilters } from '@/shared/components/JobProjectFilters.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { TableIconButton } from '@/shared/components/TableIconButton.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDateTime, formatMoney } from '@/shared/utils/format.ts'

const STATUSES = ['pending', 'paid']

export function DriverPayablesPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERMISSIONS.SETTLEMENTS_MANAGE)
  const list = useListQuery()
  const queryClient = useQueryClient()
  const [payId, setPayId] = useState<number | null>(null)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [dialogError, setDialogError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const query = useQuery({
    queryKey: ['driver-payables', list.search, list.status, list.project, list.jobId, list.page],
    queryFn: () =>
      fetchDriverPayables({
        search: list.search,
        status: list.status,
        project: list.project,
        job_id: list.jobId,
        page: list.page,
      }),
  })

  const pay = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File | null }) => payDriverPayable(id, file),
    onSuccess: async () => {
      setFeedback(t('driverPay.paidSuccess'))
      setError('')
      closePayDialog()
      await queryClient.invalidateQueries({ queryKey: ['driver-payables'] })
      await queryClient.invalidateQueries({ queryKey: ['trip'] })
    },
    onError: (err) => {
      setDialogError(getApiMessage(err, t('driverPay.paidFailed')))
    },
  })

  function openPayDialog(id: number) {
    setReceipt(null)
    setDialogError('')
    setPayId(id)
  }

  function closePayDialog() {
    setPayId(null)
    setReceipt(null)
    setDialogError('')
  }

  const columns: Column<DriverPayable>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'driver', header: t('common.driver'), cell: (row) => displayValue(row.driver?.name) },
    {
      id: 'trip',
      header: t('common.trip'),
      cell: (row) =>
        row.trip ? (
          <Link className="mz-link" to={`/trips/${row.trip.id}`}>
            {row.trip.reference}
          </Link>
        ) : (
          displayValue(null)
        ),
    },
    {
      id: 'job',
      header: t('common.job'),
      cell: (row) =>
        row.job ? (
          <Link className="mz-link" to={`/jobs/${row.job.id}`}>
            {row.job.reference}
          </Link>
        ) : (
          displayValue(null)
        ),
    },
    { id: 'amount', header: t('trips.driverPay'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'paid', header: t('driverPay.paidAt'), cell: (row) => formatDateTime(row.paid_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => {
        const canPay = canManage && row.status === 'pending'
        if (!canPay && !row.has_receipt) {
          return displayValue(null)
        }

        return (
          <div className="mz-table-actions">
            {canPay ? (
              <TableIconButton icon="confirm" tone="success" label={t('driverPay.markPaid')} onClick={() => openPayDialog(row.id)} />
            ) : null}
            {row.has_receipt ? (
              <TableIconButton
                icon="receipt"
                label={t('driverPay.receipt')}
                onClick={() => {
                  void downloadDriverPayableReceipt(row.id, `${row.reference}-receipt`).catch((err) => {
                    setError(getApiMessage(err, t('driverPay.receiptFailed')))
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
      <PageHeader title={t('driverPay.title')} subtitle={t('driverPay.subtitle')} />
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      {error ? <div className="mz-alert">{error}</div> : null}
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} placeholder={t('common.searchReference')} />
        <StatusFilter
          value={list.status}
          options={STATUSES}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
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
      <ConfirmDialog
        open={payId !== null}
        title={t('driverPay.markPaid')}
        confirmLabel={pay.isPending ? t('common.saving') : t('driverPay.markPaid')}
        busy={pay.isPending}
        onConfirm={() => {
          if (payId !== null) {
            setDialogError('')
            pay.mutate({ id: payId, file: receipt })
          }
        }}
        onClose={() => {
          if (!pay.isPending) {
            closePayDialog()
          }
        }}
      >
        <div className="mz-form">
          <p>{t('driverPay.confirmPaid')}</p>
          {dialogError ? <div className="mz-alert">{dialogError}</div> : null}
          <FormField label={t('driverPay.receipt')} htmlFor="driver-pay-receipt" hint={t('driverPay.receiptHint')}>
            <input
              id="driver-pay-receipt"
              className="mz-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={pay.isPending}
              onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            />
          </FormField>
        </div>
      </ConfirmDialog>
    </>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cancelShipment, fetchShipment } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import type { Quotation } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { EmptyState } from '@/shared/components/EmptyState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { displayValue, formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'

export function ShipmentDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState('')
  const query = useQuery({ queryKey: ['shipment', id], queryFn: () => fetchShipment(id), enabled: Boolean(id) })
  const cancelMutation = useMutation({
    mutationFn: () => cancelShipment(id),
    onSuccess: async () => {
      setConfirmCancel(false)
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['shipment', id] })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('shipments.cancelFailed')))
    },
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const shipment = query.data
  const quotations = shipment.quotations ?? []

  const columns: Column<Quotation>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider) },
    { id: 'price', header: t('quotations.price'), cell: (row) => formatMoney(row.total_price, row.currency ?? undefined) },
    { id: 'trips', header: t('quotations.tripCount'), cell: (row) => displayValue(row.trip_count) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/quotations/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={shipment.reference}
        subtitle={t('shipments.detailTitle')}
        crumbs={[{ label: t('shipments.title'), to: '/shipments' }, { label: shipment.reference }]}
        actions={
          hasPermission(PERMISSIONS.SHIPMENTS_MANAGE) && shipment.status !== 'cancelled' && shipment.status !== 'awarded' ? (
            <button type="button" className="mz-btn mz-btn--danger" onClick={() => setConfirmCancel(true)}>
              {t('shipments.cancel')}
            </button>
          ) : null
        }
      />
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}
      <section className="mz-card">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('common.status'), value: <StatusBadge status={shipment.status} /> },
              { label: t('common.customer'), value: organizationName(shipment.customer) },
              { label: t('shipments.cargoType'), value: displayValue(shipment.cargo_type) },
              { label: t('shipments.cargoDescription'), value: displayValue(shipment.cargo_description) },
              { label: t('common.weight'), value: displayValue(shipment.weight_tons) },
              { label: t('common.volume'), value: displayValue(shipment.volume_cbm) },
              { label: t('common.quantity'), value: `${displayValue(shipment.quantity)} ${displayValue(shipment.quantity_unit)}` },
              { label: t('common.pickup'), value: `${displayValue(shipment.pickup_city)} — ${displayValue(shipment.pickup_address)}` },
              { label: t('common.delivery'), value: `${displayValue(shipment.delivery_city)} — ${displayValue(shipment.delivery_address)}` },
              { label: t('shipments.requiredDate'), value: formatDate(shipment.required_date) },
              { label: t('common.notes'), value: displayValue(shipment.notes) },
            ]}
          />
        </div>
      </section>
      <section className="mz-section">
        <h2 className="mz-card__title">{t('shipments.quotations')}</h2>
        {quotations.length === 0 ? (
          <div className="mz-card">
            <EmptyState title={t('shipments.noQuotations')} />
          </div>
        ) : (
          <DataTable columns={columns} rows={quotations} rowKey={(row) => row.id} rowTo={(row) => `/quotations/${row.id}`} />
        )}
      </section>
      <ConfirmDialog
        open={confirmCancel}
        title={t('shipments.cancelTitle')}
        danger
        busy={cancelMutation.isPending}
        confirmLabel={t('shipments.cancel')}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setConfirmCancel(false)}
      >
        <p>{t('shipments.cancelBody')}</p>
      </ConfirmDialog>
    </>
  )
}

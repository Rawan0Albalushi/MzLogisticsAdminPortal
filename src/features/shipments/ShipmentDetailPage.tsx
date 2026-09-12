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
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { displayValue, formatDate, formatMoney, formatNumber, initials, organizationName } from '@/shared/utils/format.ts'

function quantityValue(quantity?: string | number | null, unit?: string | null) {
  if (quantity == null || quantity === '') {
    return null
  }
  const amount = formatNumber(quantity)
  return unit ? `${amount} ${unit}` : amount
}

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
  const customerName = organizationName(shipment.customer)
  const canCancel =
    hasPermission(PERMISSIONS.SHIPMENTS_MANAGE) && shipment.status !== 'cancelled' && shipment.status !== 'awarded'
  const customerLink = shipment.customer ? (
    <Link className="mz-link" to={`/customers/${shipment.customer.id}`}>
      {customerName}
    </Link>
  ) : null

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
          <>
            <StatusBadge status={shipment.status} />
            {canCancel ? (
              <button type="button" className="mz-btn mz-btn--danger" onClick={() => setConfirmCancel(true)}>
                {t('shipments.cancel')}
              </button>
            ) : null}
          </>
        }
      />
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}

      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <div className="mz-avatar mz-avatar--lg" aria-hidden>
                {initials(shipment.cargo_type || shipment.reference)}
              </div>
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{shipment.reference}</h2>
                {shipment.cargo_type ? <p className="mz-profile__aka">{shipment.cargo_type}</p> : null}
                <div className="mz-profile__contacts">
                  <StatusBadge status={shipment.status} />
                  {shipment.customer ? (
                    <Link className="mz-profile__chip" to={`/customers/${shipment.customer.id}`}>
                      {customerName}
                    </Link>
                  ) : null}
                  {shipment.pickup_city || shipment.delivery_city ? (
                    <span className="mz-profile__chip">
                      {displayValue(shipment.pickup_city)} → {displayValue(shipment.delivery_city)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <h2 className="mz-card__title">{t('shipments.cargo')}</h2>
            <InfoGrid
              fields={[
                { label: t('shipments.cargoType'), value: shipment.cargo_type },
                { label: t('common.quantity'), value: quantityValue(shipment.quantity, shipment.quantity_unit) },
                { label: t('common.weight'), value: shipment.weight_tons == null || shipment.weight_tons === '' ? null : formatNumber(shipment.weight_tons) },
                { label: t('common.volume'), value: shipment.volume_cbm == null || shipment.volume_cbm === '' ? null : formatNumber(shipment.volume_cbm) },
                { label: t('shipments.cargoDescription'), value: shipment.cargo_description, wide: true },
              ]}
            />
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <h2 className="mz-card__title">{t('shipments.scheduleSection')}</h2>
              <InfoGrid
                fields={[
                  { label: t('common.customer'), value: customerLink },
                  { label: t('common.status'), value: <StatusBadge status={shipment.status} /> },
                  { label: t('shipments.requiredDate'), value: shipment.required_date ? formatDate(shipment.required_date) : null },
                  { label: t('shipments.publishedAt'), value: shipment.published_at ? formatDate(shipment.published_at) : null },
                  { label: t('common.createdAt'), value: shipment.created_at ? formatDate(shipment.created_at) : null },
                ]}
              />
            </div>
          </section>
          {shipment.notes ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <h2 className="mz-card__title">{t('common.notes')}</h2>
                <p className="mz-notes">{shipment.notes}</p>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <h2 className="mz-card__title">{t('shipments.routeSection')}</h2>
          <div className="mz-grid-2 mz-grid-2--equal">
            <div>
              <h3 className="mz-card__title">{t('common.pickup')}</h3>
              <InfoGrid
                fields={[
                  { label: t('common.city'), value: shipment.pickup_city },
                  { label: t('common.address'), value: shipment.pickup_address, wide: true },
                ]}
              />
            </div>
            <div>
              <h3 className="mz-card__title">{t('common.delivery')}</h3>
              <InfoGrid
                fields={[
                  { label: t('common.city'), value: shipment.delivery_city },
                  { label: t('common.address'), value: shipment.delivery_address, wide: true },
                ]}
              />
            </div>
          </div>
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

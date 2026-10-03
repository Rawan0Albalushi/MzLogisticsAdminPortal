import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cancelShipment, confirmPlatformOffer, fetchShipment, publishPlatformOffer, withdrawPlatformOffer, type PlatformOfferInput } from '@/core/api/services.ts'
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
import { LocationMap } from '@/shared/components/LocationMap.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { RouteLabel } from '@/shared/components/RouteLabel.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { CustomerOfferPanel } from '@/features/shipments/CustomerOfferPanel.tsx'
import { OnBehalfQuotationPanel } from '@/features/shipments/OnBehalfQuotationPanel.tsx'
import { displayValue, formatDate, formatMoney, formatNumber, organizationName } from '@/shared/utils/format.ts'

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
  const [onBehalfOpen, setOnBehalfOpen] = useState(false)
  const [error, setError] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [offerError, setOfferError] = useState('')
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
  const publishOffer = useMutation({
    mutationFn: (payload: PlatformOfferInput) => publishPlatformOffer(id, payload),
    onSuccess: async (_data, payload) => {
      setOfferError('')
      setOfferMessage(payload.confirm ? t('shipments.agreementConfirmed') : t('shipments.offerPublished'))
      await queryClient.invalidateQueries({ queryKey: ['shipment', id] })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
      if (payload.confirm) {
        await queryClient.invalidateQueries({ queryKey: ['jobs'] })
      }
    },
    onError: (err) => {
      setOfferMessage('')
      setOfferError(getApiMessage(err, t('shipments.offerFailed')))
    },
  })
  const confirmOffer = useMutation({
    mutationFn: (offerId: number) => confirmPlatformOffer(offerId),
    onSuccess: async () => {
      setOfferError('')
      setOfferMessage(t('shipments.agreementConfirmed'))
      await queryClient.invalidateQueries({ queryKey: ['shipment', id] })
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
      await queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (err) => {
      setOfferMessage('')
      setOfferError(getApiMessage(err, t('shipments.offerFailed')))
    },
  })
  const withdrawOffer = useMutation({
    mutationFn: (offerId: number) => withdrawPlatformOffer(offerId),
    onSuccess: async () => {
      setOfferError('')
      setOfferMessage(t('shipments.offerWithdrawn'))
      await queryClient.invalidateQueries({ queryKey: ['shipment', id] })
    },
    onError: (err) => {
      setOfferMessage('')
      setOfferError(getApiMessage(err, t('shipments.offerFailed')))
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
  const adminSelects = shipment.offer_selection_mode === 'admin'
  const customerName = organizationName(shipment.customer)
  const canCancel =
    hasPermission(PERMISSIONS.SHIPMENTS_MANAGE) && shipment.status !== 'cancelled' && shipment.status !== 'awarded'
  const canSubmitOnBehalf = shipment.status === 'published' && hasPermission(PERMISSIONS.QUOTATIONS_CREATE)
  const customerLink = shipment.customer ? (
    <Link className="mz-link" to={`/customers/${shipment.customer.id}`}>
      {customerName}
    </Link>
  ) : null

  const columns: Column<Quotation>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    {
      id: 'provider',
      header: t('common.provider'),
      cell: (row) => (
        <>
          {organizationName(row.provider)}
          {row.submitted_on_behalf ? (
            <>
              {' '}
              <span className="mz-badge mz-badge--info">{t('quotations.onBehalfBadge')}</span>
            </>
          ) : null}
        </>
      ),
    },
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
              <IconWell name="shipments" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{shipment.reference}</h2>
                {shipment.cargo_type ? <p className="mz-profile__aka">{shipment.cargo_type}</p> : null}
                <div className="mz-profile__contacts">
                  <StatusBadge status={shipment.status} />
                  {shipment.customer ? (
                    <Link className="mz-profile__chip" to={`/customers/${shipment.customer.id}`}>
                      <AppIcon name="customers" />
                      {customerName}
                    </Link>
                  ) : null}
                  {shipment.pickup_city || shipment.delivery_city ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="trips" />
                      <RouteLabel from={displayValue(shipment.pickup_city)} to={displayValue(shipment.delivery_city)} />
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="shipments" title={t('shipments.cargo')} />
            <InfoGrid
              fields={[
                { icon: 'shipments', label: t('shipments.cargoType'), value: shipment.cargo_type },
                { icon: 'quantity', label: t('common.quantity'), value: quantityValue(shipment.quantity, shipment.quantity_unit) },
                { icon: 'quantity', label: t('common.weight'), value: shipment.weight_tons == null || shipment.weight_tons === '' ? null : formatNumber(shipment.weight_tons) },
                { icon: 'quantity', label: t('common.volume'), value: shipment.volume_cbm == null || shipment.volume_cbm === '' ? null : formatNumber(shipment.volume_cbm) },
                { icon: 'notes', label: t('shipments.cargoDescription'), value: shipment.cargo_description, wide: true },
              ]}
            />
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="calendar" title={t('shipments.scheduleSection')} />
              <InfoGrid
                fields={[
                  { icon: 'customers', label: t('common.customer'), value: customerLink },
                  { icon: 'roles', label: t('common.status'), value: <StatusBadge status={shipment.status} /> },
                  {
                    icon: 'quotations',
                    label: t('shipments.offerSelection'),
                    value:
                      shipment.offer_selection_mode === 'admin'
                        ? t('settings.offerSelectionAdmin')
                        : t('settings.offerSelectionCustomer'),
                  },
                  { icon: 'calendar', label: t('shipments.requiredDate'), value: shipment.required_date ? formatDate(shipment.required_date) : null },
                  { icon: 'clock', label: t('shipments.publishedAt'), value: shipment.published_at ? formatDate(shipment.published_at) : null },
                  { icon: 'clock', label: t('common.createdAt'), value: shipment.created_at ? formatDate(shipment.created_at) : null },
                ]}
              />
            </div>
          </section>
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="payments" title={t('paymentContract.title')} />
              <InfoGrid
                fields={[
                  {
                    icon: 'payments',
                    label: t('paymentContract.trigger'),
                    value:
                      !shipment.payment_terms?.billing_trigger || shipment.payment_terms.billing_trigger === 'on_award'
                        ? t('paymentContract.onAward')
                        : t('paymentContract.onDelivery'),
                  },
                  ...(shipment.payment_terms?.billing_trigger === 'on_delivery'
                    ? [
                        {
                          icon: 'quantity' as const,
                          label: t('paymentContract.unit'),
                          value:
                            shipment.payment_terms.billing_unit === 'trip'
                              ? t('paymentContract.unitTrip')
                              : t('paymentContract.unitJob'),
                        },
                        {
                          icon: 'calendar' as const,
                          label: t('paymentContract.dueDays'),
                          value:
                            !shipment.payment_terms.due_days
                              ? t('paymentContract.dueImmediate')
                              : t('paymentContract.netDays', { days: shipment.payment_terms.due_days }),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </section>
          {shipment.notes ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="notes" title={t('common.notes')} />
                <p className="mz-notes">{shipment.notes}</p>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <SectionTitle icon="trips" title={t('shipments.routeSection')} />
          <div className="mz-grid-2 mz-grid-2--equal">
            <LocationMap
              icon="pickup"
              label={t('common.pickup')}
              address={shipment.pickup_address}
              city={shipment.pickup_city}
              lat={shipment.pickup_lat}
              lng={shipment.pickup_lng}
            />
            <LocationMap
              icon="delivery"
              label={t('common.delivery')}
              address={shipment.delivery_address}
              city={shipment.delivery_city}
              lat={shipment.delivery_lat}
              lng={shipment.delivery_lng}
            />
          </div>
        </div>
      </section>

      {adminSelects ? (
        <CustomerOfferPanel
          shipment={shipment}
          canManage={hasPermission(PERMISSIONS.QUOTATIONS_MANAGE)}
          message={offerMessage}
          error={offerError}
          publishing={publishOffer.isPending}
          confirming={confirmOffer.isPending || publishOffer.isPending}
          withdrawing={withdrawOffer.isPending}
          onPublish={(payload) => publishOffer.mutate(payload)}
          onConfirm={(offerId) => confirmOffer.mutate(offerId)}
          onWithdraw={(offerId) => withdrawOffer.mutate(offerId)}
          canSubmitOnBehalf={canSubmitOnBehalf}
        />
      ) : canSubmitOnBehalf ? (
        <section className="mz-card mz-section">
          <div className="mz-card__body mz-offer">
            <div className="mz-segment" role="radiogroup" aria-label={t('shipments.onBehalfTitle')}>
              <label className={onBehalfOpen ? 'is-active' : undefined}>
                <input type="checkbox" checked={onBehalfOpen} onChange={() => setOnBehalfOpen((current) => !current)} />
                {t('shipments.onBehalfTitle')}
              </label>
            </div>
            {onBehalfOpen ? <OnBehalfQuotationPanel shipment={shipment} /> : null}
          </div>
        </section>
      ) : null}

      <section className="mz-section">
        <SectionTitle icon="quotations" title={t('shipments.quotations')} />
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

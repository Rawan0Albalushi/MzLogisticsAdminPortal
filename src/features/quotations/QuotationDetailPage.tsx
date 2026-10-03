import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getApiMessage } from '@/core/api/client.ts'
import { fetchQuotation, withdrawQuotation } from '@/core/api/services.ts'
import type { Quotation } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { LocationMap } from '@/shared/components/LocationMap.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { RouteLabel } from '@/shared/components/RouteLabel.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { displayValue, formatDate, formatMoney, formatNumber, organizationName } from '@/shared/utils/format.ts'

function quantityValue(quantity?: string | number | null, unit?: string | null, unitLabel?: string | null) {
  if (quantity == null || quantity === '') {
    return null
  }
  const amount = formatNumber(quantity)
  const suffix = unitLabel || unit
  return suffix ? `${amount} ${suffix}` : amount
}

function numericValue(value?: string | number | null) {
  if (value == null || value === '') {
    return null
  }
  return formatNumber(value)
}

function moneyAmount(value?: string | number | null) {
  if (value == null || value === '') {
    return null
  }
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(amount) ? null : amount
}

function isPastDate(value?: string | null) {
  if (!value) {
    return false
  }
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function truckTypeValue(quotation: Quotation, fallback: (type: string) => string) {
  if (quotation.truck_type_label) {
    return quotation.truck_type_label
  }
  if (quotation.truck_type) {
    return fallback(quotation.truck_type)
  }
  return null
}

export function QuotationDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [actionError, setActionError] = useState('')
  const query = useQuery({ queryKey: ['quotation', id], queryFn: () => fetchQuotation(id), enabled: Boolean(id) })
  const withdraw = useMutation({
    mutationFn: () => withdrawQuotation(id),
    onSuccess: async () => {
      setConfirmWithdraw(false)
      setActionError('')
      await queryClient.invalidateQueries({ queryKey: ['quotation', id] })
      await queryClient.invalidateQueries({ queryKey: ['quotations'] })
      await queryClient.invalidateQueries({ queryKey: ['shipment'] })
    },
    onError: (err) => {
      setConfirmWithdraw(false)
      setActionError(getApiMessage(err, t('shipments.onBehalfFailed')))
    },
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const quotation = query.data
  const shipment = quotation.shipment
  const providerName = organizationName(quotation.provider)
  const customerName = organizationName(shipment?.customer)
  const currency = quotation.currency ?? undefined
  const totalAmount = moneyAmount(quotation.total_price)
  const additionalAmount = moneyAmount(quotation.additional_costs)
  const baseAmount =
    totalAmount != null && additionalAmount != null && additionalAmount > 0 ? totalAmount - additionalAmount : null
  const validityExpired = quotation.status === 'submitted' && isPastDate(quotation.valid_until)
  const canWithdraw =
    quotation.submitted_on_behalf === true &&
    quotation.status === 'submitted' &&
    hasPermission(PERMISSIONS.QUOTATIONS_CREATE)
  const routeLabel =
    shipment?.pickup_city || shipment?.delivery_city ? (
      <RouteLabel from={displayValue(shipment?.pickup_city)} to={displayValue(shipment?.delivery_city)} />
    ) : null

  const providerLink = quotation.provider ? (
    <Link className="mz-link" to={`/providers/${quotation.provider.id}`}>
      {providerName}
    </Link>
  ) : null

  const customerLink = shipment?.customer ? (
    <Link className="mz-link" to={`/customers/${shipment.customer.id}`}>
      {customerName}
    </Link>
  ) : null

  const shipmentLink = shipment ? (
    <Link className="mz-link" to={`/shipments/${shipment.id}`}>
      {shipment.reference}
    </Link>
  ) : null

  const formatQuantity = (quantity?: string | number | null, unit?: string | null) =>
    quantityValue(quantity, unit, unit ? t(`common.quantityUnits.${unit}`, { defaultValue: unit }) : null)

  return (
    <>
      <PageHeader
        title={quotation.reference}
        subtitle={t('quotations.detailTitle')}
        crumbs={[{ label: t('quotations.title'), to: '/quotations' }, { label: quotation.reference }]}
        actions={
          <>
            <StatusBadge status={quotation.status} />
            {canWithdraw ? (
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setConfirmWithdraw(true)}>
                {t('shipments.withdrawOnBehalf')}
              </button>
            ) : null}
          </>
        }
      />
      {actionError ? <div className="mz-alert">{actionError}</div> : null}

      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="quotations" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{quotation.reference}</h2>
                <p className="mz-profile__aka">{formatMoney(quotation.total_price, currency)}</p>
                {quotation.submitted_on_behalf ? <p className="mz-offer__hint">{t('quotations.submittedOnBehalf')}</p> : null}
                <div className="mz-profile__contacts">
                  <StatusBadge status={quotation.status} />
                  {quotation.provider ? (
                    <Link className="mz-profile__chip" to={`/providers/${quotation.provider.id}`}>
                      <AppIcon name="providers" />
                      {providerName}
                    </Link>
                  ) : null}
                  {shipment ? (
                    <Link className="mz-profile__chip" to={`/shipments/${shipment.id}`}>
                      <AppIcon name="shipments" />
                      {shipment.reference}
                    </Link>
                  ) : null}
                  {routeLabel ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="trips" />
                      {routeLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="payments" title={t('quotations.offerSection')} />
            <InfoGrid
              fields={[
                ...(quotation.price_per_trip != null && quotation.price_per_trip !== ''
                  ? [{ icon: 'trips' as const, label: t('quotations.pricePerTrip'), value: formatMoney(quotation.price_per_trip, currency) }]
                  : []),
                { icon: 'payments', label: t('quotations.price'), value: formatMoney(quotation.total_price, currency) },
                ...(baseAmount != null
                  ? [{ icon: 'commission' as const, label: t('quotations.basePrice'), value: formatMoney(baseAmount, currency) }]
                  : []),
                { icon: 'invoices', label: t('quotations.additionalCosts'), value: formatMoney(quotation.additional_costs, currency) },
                { icon: 'providers', label: t('common.provider'), value: providerLink },
                { icon: 'shipments', label: t('common.shipment'), value: shipmentLink },
              ]}
            />
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="fleet" title={t('quotations.executionSection')} />
              <InfoGrid
                fields={[
                  { icon: 'fleet', label: t('quotations.truckCount'), value: numericValue(quotation.truck_count) },
                  {
                    icon: 'truckTypes',
                    label: t('quotations.truckType'),
                    value: truckTypeValue(quotation, (type) => t(`status.${type}`, { defaultValue: type })),
                  },
                  { icon: 'quantity', label: t('quotations.truckCapacity'), value: numericValue(quotation.truck_capacity_tons) },
                  { icon: 'trips', label: t('quotations.tripCount'), value: numericValue(quotation.trip_count) },
                  {
                    icon: 'quantity',
                    label: t('quotations.quantityPerTrip'),
                    value: formatQuantity(quotation.quantity_per_trip, shipment?.quantity_unit),
                  },
                  { icon: 'clock', label: t('quotations.duration'), value: numericValue(quotation.duration_days) },
                  {
                    icon: 'calendar',
                    label: t('quotations.transportStartDate'),
                    value: quotation.transport_start_date ? formatDate(quotation.transport_start_date) : null,
                  },
                ]}
              />
            </div>
          </section>
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="calendar" title={t('quotations.validitySection')} />
              <InfoGrid
                fields={[
                  { icon: 'calendar', label: t('quotations.validUntil'), value: quotation.valid_until ? formatDate(quotation.valid_until) : null },
                  ...(quotation.valid_until && quotation.status === 'submitted'
                    ? [
                        {
                          icon: 'clock' as const,
                          label: t('quotations.validityState'),
                          value: validityExpired ? t('quotations.validityExpired') : t('quotations.validityActive'),
                        },
                      ]
                    : []),
                  { icon: 'clock', label: t('common.createdAt'), value: quotation.created_at ? formatDate(quotation.created_at) : null },
                ]}
              />
            </div>
          </section>
          {quotation.conditions ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="notes" title={t('quotations.conditions')} />
                <p className="mz-notes">{quotation.conditions}</p>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {shipment ? (
        <>
          <section className="mz-card mz-section">
            <div className="mz-card__body">
              <SectionTitle icon="shipments" title={t('quotations.shipmentSection')} />
              <InfoGrid
                fields={[
                  { icon: 'quotations', label: t('common.reference'), value: shipmentLink },
                  { icon: 'customers', label: t('common.customer'), value: customerLink },
                  { icon: 'roles', label: t('common.status'), value: <StatusBadge status={shipment.status} /> },
                  { icon: 'shipments', label: t('shipments.cargoType'), value: shipment.cargo_type },
                  { icon: 'quantity', label: t('common.quantity'), value: formatQuantity(shipment.quantity, shipment.quantity_unit) },
                  {
                    icon: 'quantity',
                    label: t('common.weight'),
                    value: shipment.weight_tons == null || shipment.weight_tons === '' ? null : formatNumber(shipment.weight_tons),
                  },
                  { icon: 'calendar', label: t('shipments.requiredDate'), value: shipment.required_date ? formatDate(shipment.required_date) : null },
                  { icon: 'notes', label: t('shipments.cargoDescription'), value: shipment.cargo_description, wide: true },
                ]}
              />
            </div>
          </section>
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
        </>
      ) : null}
      <ConfirmDialog
        open={confirmWithdraw}
        title={t('shipments.withdrawOnBehalf')}
        danger
        busy={withdraw.isPending}
        confirmLabel={t('shipments.withdrawOnBehalf')}
        onConfirm={() => withdraw.mutate()}
        onClose={() => setConfirmWithdraw(false)}
      >
        <p>{t('shipments.withdrawOnBehalfBody')}</p>
      </ConfirmDialog>
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchFleetForPlan, fetchTruckTypes, type PlatformOfferInput } from '@/core/api/services.ts'
import type { PlatformOffer, Quotation, Shipment } from '@/core/api/types.ts'
import { QuoteExecutionFields } from '@/features/quotations/QuoteExecutionFields.tsx'
import { earliestTransportStart } from '@/features/quotations/transportStart.ts'
import { billableTripCount, quotationTotal } from '@/features/quotations/quotationPrice.ts'
import { OnBehalfQuotationPanel } from '@/features/shipments/OnBehalfQuotationPanel.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { displayValue, formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'

type PriceMode = 'fixed' | 'percent'

interface CustomerOfferPanelProps {
  shipment: Shipment
  canManage: boolean
  message: string
  error: string
  publishing: boolean
  confirming: boolean
  withdrawing: boolean
  onPublish: (payload: PlatformOfferInput) => void
  onConfirm: (offerId: number) => void
  onWithdraw: (offerId: number) => void
  canSubmitOnBehalf?: boolean
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

function moneyAmount(value?: string | number | null) {
  if (value == null || value === '') return null
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) ? amount : null
}

function isExpired(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

function formatDetail(value: string | number) {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) return String(value)
  return new Intl.NumberFormat('en', { numberingSystem: 'latn', maximumFractionDigits: 3 }).format(amount)
}

function formatMarkup(value: number) {
  return `${formatDetail(Math.round(value * 100) / 100)}%`
}

function markupInput(customer: number, provider: number) {
  if (provider <= 0) return ''
  const percent = ((customer - provider) / provider) * 100
  const rounded = Math.round(percent * 100) / 100
  return String(rounded)
}

export function CustomerOfferPanel({
  shipment,
  canManage,
  message,
  error,
  publishing,
  confirming,
  withdrawing,
  onPublish,
  onConfirm,
  onWithdraw,
  canSubmitOnBehalf = false,
}: CustomerOfferPanelProps) {
  const { t } = useTranslation()
  const [selectedQuotationId, setSelectedQuotationId] = useState('')
  const [priceMode, setPriceMode] = useState<PriceMode>('fixed')
  const [amountInput, setAmountInput] = useState('')
  const [source, setSource] = useState<'provider' | 'platform' | 'onBehalf'>('provider')
  const [ownedForm, setOwnedForm] = useState({
    price_per_trip: '',
    truck_count: '1',
    truck_type: '',
    truck_capacity_tons: '',
    trip_count: '1',
    quantity_per_trip: '',
    duration_days: '1',
    transport_start_date: earliestTransportStart(shipment.required_date),
    additional_costs: '',
    conditions: '',
  })
  const [planValid, setPlanValid] = useState(true)
  const [seenShipmentId, setSeenShipmentId] = useState(shipment.id)
  if (seenShipmentId !== shipment.id) {
    setSeenShipmentId(shipment.id)
    setOwnedForm({
      price_per_trip: '',
      truck_count: '1',
      truck_type: '',
      truck_capacity_tons: '',
      trip_count: '1',
      quantity_per_trip: '',
      duration_days: '1',
      transport_start_date: earliestTransportStart(shipment.required_date),
      additional_costs: '',
      conditions: '',
    })
    setPlanValid(true)
  }
  const truckTypes = useQuery({ queryKey: ['truck-types'], queryFn: fetchTruckTypes })
  const platformFleet = useQuery({
    queryKey: ['trucks', 'offer-plan', 'platform'],
    queryFn: () => fetchFleetForPlan({ owner: 'platform' }),
    enabled: source === 'platform',
  })

  const quotations = (shipment.quotations ?? []).filter((row) => row.status === 'submitted')
  const selectable = quotations.filter((row) => !isExpired(row.valid_until))
  const lowest = selectable.reduce<Quotation | null>((best, row) => {
    const price = moneyAmount(row.total_price)
    if (price == null) return best
    if (!best || price < Number(best.total_price)) return row
    return best
  }, null)
  const activeQuotationId = selectable.some((row) => String(row.id) === selectedQuotationId)
    ? selectedQuotationId
    : lowest
      ? String(lowest.id)
      : ''
  const selected = selectable.find((row) => String(row.id) === activeQuotationId) ?? null
  const providerPrice = selected ? moneyAmount(selected.total_price) : null
  const currency = selected?.currency ?? shipment.platform_offer?.currency ?? undefined
  const parsedAmount = Number(amountInput)
  const amountReady = amountInput.trim() !== '' && Number.isFinite(parsedAmount)
  let customerPrice: number | null = null
  if (providerPrice != null && amountReady) {
    if (priceMode === 'fixed') {
      customerPrice = roundMoney(parsedAmount)
    } else if (parsedAmount >= 0) {
      customerPrice = roundMoney(providerPrice * (1 + parsedAmount / 100))
    }
  }
  const margin = customerPrice != null && providerPrice != null ? roundMoney(customerPrice - providerPrice) : null
  const marginPercent =
    margin != null && providerPrice != null && providerPrice > 0 ? (margin / providerPrice) * 100 : null
  const priceTooLow = margin != null && margin < 0
  const canPublish = canManage && shipment.status === 'published' && selectable.length > 0
  const canCompose = canManage && shipment.status === 'published'
  const ownedPrice = Number(ownedForm.price_per_trip)
  const ownedTrips = billableTripCount(Number(ownedForm.truck_count), Number(ownedForm.trip_count))
  const ownedTotal = ownedTrips != null && Number.isFinite(ownedPrice) && ownedPrice > 0 ? quotationTotal(ownedPrice, ownedTrips) : null
  const ownedReady =
    ownedForm.price_per_trip.trim() !== '' &&
    Number.isFinite(ownedPrice) &&
    ownedPrice > 0 &&
    ownedTrips != null &&
    Number(ownedForm.truck_count) >= 1 &&
    ownedForm.truck_type !== '' &&
    Number(ownedForm.truck_capacity_tons) > 0 &&
    Number(ownedForm.trip_count) >= 1 &&
    Number(ownedForm.quantity_per_trip) > 0 &&
    Number(ownedForm.duration_days) >= 1 &&
    ownedForm.transport_start_date !== '' &&
    planValid
  const activeTruckTypes = (truckTypes.data ?? []).filter((row) => row.is_active)
  const unitLabel = shipment.quantity_unit
    ? t(`common.quantityUnits.${shipment.quantity_unit}`, { defaultValue: shipment.quantity_unit })
    : null

  function switchMode(next: PriceMode) {
    if (next === priceMode) return
    if (customerPrice != null && providerPrice != null) {
      setAmountInput(next === 'fixed' ? String(customerPrice) : markupInput(customerPrice, providerPrice))
    }
    setPriceMode(next)
  }

  return (
    <section className="mz-card mz-section">
      <div className="mz-card__body mz-offer">
        <SectionTitle icon="quotations" title={t('shipments.platformOffer')} />
        <p className="mz-offer__hint">{t('shipments.platformOfferHint')}</p>
        {message ? <div className="mz-alert mz-alert--ok">{message}</div> : null}
        {error ? <div className="mz-alert">{error}</div> : null}

        {shipment.platform_offer ? (
          <PublishedOffer
            offer={shipment.platform_offer}
            quotation={quotations.find((row) => row.id === shipment.platform_offer?.quotation_id) ?? null}
            unitLabel={unitLabel}
            canConfirm={canManage && shipment.status === 'published' && shipment.platform_offer.status === 'published'}
            confirming={confirming}
            canWithdraw={canManage && shipment.platform_offer.status === 'published'}
            withdrawing={withdrawing}
            onConfirm={() => {
              if (shipment.platform_offer) onConfirm(shipment.platform_offer.id)
            }}
            onWithdraw={() => {
              if (shipment.platform_offer) onWithdraw(shipment.platform_offer.id)
            }}
          />
        ) : null}

        {canCompose ? (
          <div className="mz-offer__group">
            <h3 id="offer-source">{t('shipments.offerSource')}</h3>
            <div className="mz-segment" role="radiogroup" aria-labelledby="offer-source">
              <label className={source === 'provider' ? 'is-active' : undefined}>
                <input
                  type="radio"
                  name="offer-source"
                  checked={source === 'provider'}
                  onChange={() => setSource('provider')}
                />
                {t('shipments.offerFromProvider')}
              </label>
              <label className={source === 'platform' ? 'is-active' : undefined}>
                <input
                  type="radio"
                  name="offer-source"
                  checked={source === 'platform'}
                  onChange={() => setSource('platform')}
                />
                {t('shipments.offerFromPlatform')}
              </label>
              {canSubmitOnBehalf ? (
                <label className={source === 'onBehalf' ? 'is-active' : undefined}>
                  <input
                    type="radio"
                    name="offer-source"
                    checked={source === 'onBehalf'}
                    onChange={() => setSource('onBehalf')}
                  />
                  {t('shipments.onBehalfTitle')}
                </label>
              ) : null}
            </div>
          </div>
        ) : canSubmitOnBehalf ? (
          <div className="mz-segment" role="radiogroup" aria-label={t('shipments.onBehalfTitle')}>
            <label className={source === 'onBehalf' ? 'is-active' : undefined}>
              <input
                type="radio"
                name="offer-source"
                checked={source === 'onBehalf'}
                onChange={() => setSource('onBehalf')}
              />
              {t('shipments.onBehalfTitle')}
            </label>
          </div>
        ) : null}

        {source === 'onBehalf' && canSubmitOnBehalf ? <OnBehalfQuotationPanel shipment={shipment} /> : null}

        {source === 'platform' && canCompose ? (
          <form
            className="mz-form mz-offer-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!ownedReady) return
              const confirm = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'confirm'
              const additional = ownedForm.additional_costs.trim()
              onPublish({
                price_per_trip: ownedPrice,
                truck_count: Number(ownedForm.truck_count),
                truck_type: ownedForm.truck_type,
                truck_capacity_tons: Number(ownedForm.truck_capacity_tons),
                trip_count: Number(ownedForm.trip_count),
                quantity_per_trip: Number(ownedForm.quantity_per_trip),
                duration_days: Number(ownedForm.duration_days),
                transport_start_date: ownedForm.transport_start_date,
                ...(additional !== '' && Number.isFinite(Number(additional)) ? { additional_costs: Number(additional) } : {}),
                ...(ownedForm.conditions.trim() ? { conditions: ownedForm.conditions.trim() } : {}),
                confirm,
              })
            }}
          >
            <p className="mz-offer__hint">{t('shipments.platformOfferFormHint')}</p>
            <FormField label={t('quotations.pricePerTrip')} htmlFor="owned-price" required hint={t('quotations.pricePerTripHint')}>
              <input
                id="owned-price"
                className="mz-input"
                inputMode="decimal"
                value={ownedForm.price_per_trip}
                onChange={(event) => setOwnedForm((current) => ({ ...current, price_per_trip: event.target.value }))}
                required
              />
            </FormField>
            <FormField
              label={t('quotations.transportStartDate')}
              htmlFor="owned-start"
              required
              hint={t('quotations.transportStartHint')}
            >
              <input
                id="owned-start"
                className="mz-input"
                type="date"
                required
                min={earliestTransportStart(shipment.required_date)}
                value={ownedForm.transport_start_date}
                onChange={(event) => setOwnedForm((current) => ({ ...current, transport_start_date: event.target.value }))}
              />
            </FormField>
            <QuoteExecutionFields
              shipment={shipment}
              trucks={platformFleet.data ?? []}
              fleetReady={platformFleet.isFetched || platformFleet.isError}
              truckTypes={activeTruckTypes}
              idPrefix="owned"
              resetKey={String(shipment.id)}
              value={ownedForm}
              onChange={(next) => setOwnedForm((current) => ({ ...current, ...next }))}
              onValidChange={setPlanValid}
            />
            <FormField label={t('quotations.additionalCosts')} htmlFor="owned-extra">
              <input
                id="owned-extra"
                className="mz-input"
                inputMode="decimal"
                value={ownedForm.additional_costs}
                onChange={(event) => setOwnedForm((current) => ({ ...current, additional_costs: event.target.value }))}
              />
            </FormField>
            <FormField label={t('quotations.conditions')} htmlFor="owned-conditions">
              <textarea
                id="owned-conditions"
                className="mz-input"
                value={ownedForm.conditions}
                maxLength={2000}
                onChange={(event) => setOwnedForm((current) => ({ ...current, conditions: event.target.value }))}
              />
            </FormField>
            {ownedTotal != null && ownedTrips != null ? (
              <p className="mz-offer__hint">{t('quotations.calculatedTotal', { amount: formatMoney(ownedTotal), count: ownedTrips })}</p>
            ) : null}
            <p className="mz-offer__hint">{t('shipments.offerActionHint')}</p>
            <div className="mz-form-actions">
              <button type="submit" value="publish" className="mz-btn mz-btn--ghost" disabled={publishing || confirming || !ownedReady}>
                {t('shipments.publishOffer')}
              </button>
              <button type="submit" value="confirm" className="mz-btn mz-btn--primary" disabled={publishing || confirming || !ownedReady}>
                {t('shipments.confirmAgreement')}
              </button>
            </div>
          </form>
        ) : null}

        {source === 'provider' && canPublish ? (
          <form
            className="mz-form mz-offer-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!selected || customerPrice == null || priceTooLow) return
              const confirm = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'confirm'
              onPublish({ quotation_id: selected.id, customer_price: customerPrice, confirm })
            }}
          >
            <div className="mz-offer__group">
              <h3 id="provider-offers">{t('shipments.providerOffers')}</h3>
              <div className="mz-offer-board" role="radiogroup" aria-labelledby="provider-offers">
                {quotations.map((row) => {
                  const expired = isExpired(row.valid_until)
                  const checked = !expired && String(row.id) === activeQuotationId
                  const isLowest = lowest != null && row.id === lowest.id
                  return (
                    <label
                      key={row.id}
                      className={`mz-offer-card${checked ? ' is-selected' : ''}${expired ? ' is-disabled' : ''}`}
                    >
                      <input
                        className="mz-offer-card__input"
                        type="radio"
                        name="provider-offer"
                        value={row.id}
                        checked={checked}
                        disabled={expired}
                        onChange={() => setSelectedQuotationId(String(row.id))}
                      />
                      <span className="mz-offer-card__head">
                        <span>
                          <strong>{organizationName(row.provider)}</strong>
                          <span className="mz-offer-card__ref">{row.reference}</span>
                        </span>
                        <span className="mz-offer-card__marks">
                          {isLowest ? <span className="mz-badge mz-badge--success">{t('shipments.lowestBadge')}</span> : null}
                          {expired ? <span className="mz-badge mz-badge--warning">{t('shipments.expiredBadge')}</span> : null}
                          {checked ? <span className="mz-badge mz-badge--info">{t('shipments.selectedBadge')}</span> : null}
                        </span>
                      </span>
                      <span className="mz-offer-card__price">
                        <span>{t('shipments.providerPrice')}</span>
                        {formatMoney(row.total_price, row.currency ?? undefined)}
                      </span>
                      <OfferFacts detail={row} unitLabel={unitLabel} note={row.conditions} />
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="mz-offer__group">
              <h3 id="customer-price-mode">{t('shipments.priceMode')}</h3>
              <div className="mz-segment" role="radiogroup" aria-labelledby="customer-price-mode">
                <label className={priceMode === 'fixed' ? 'is-active' : undefined}>
                  <input
                    type="radio"
                    name="customer-price-mode"
                    checked={priceMode === 'fixed'}
                    onChange={() => switchMode('fixed')}
                  />
                  {t('shipments.priceFixed')}
                </label>
                <label className={priceMode === 'percent' ? 'is-active' : undefined}>
                  <input
                    type="radio"
                    name="customer-price-mode"
                    checked={priceMode === 'percent'}
                    onChange={() => switchMode('percent')}
                  />
                  {t('shipments.pricePercent')}
                </label>
              </div>
              <FormField
                label={priceMode === 'fixed' ? t('shipments.customerPrice') : t('shipments.percentLabel')}
                htmlFor="platform-offer-price"
                required
                hint={priceMode === 'fixed' ? t('shipments.customerPriceHint') : undefined}
                error={priceTooLow ? t('shipments.priceTooLow') : undefined}
              >
                <div className="mz-offer-amount">
                  <input
                    id="platform-offer-price"
                    className="mz-input"
                    inputMode="decimal"
                    value={amountInput}
                    aria-invalid={priceTooLow || undefined}
                    onChange={(event) => setAmountInput(event.target.value)}
                  />
                  <span>{priceMode === 'fixed' ? (currency ?? 'OMR') : '%'}</span>
                </div>
              </FormField>
            </div>

            <div className="mz-offer-preview" aria-live="polite">
              <div>
                <span>{t('shipments.customerPays')}</span>
                <strong>{customerPrice == null ? displayValue(null) : formatMoney(customerPrice, currency)}</strong>
              </div>
              <div>
                <span>{t('shipments.providerPrice')}</span>
                <strong>{providerPrice == null ? displayValue(null) : formatMoney(providerPrice, currency)}</strong>
              </div>
              <div>
                <span>{t('shipments.margin')}</span>
                <strong className={priceTooLow ? 'is-low' : undefined}>
                  {margin == null ? displayValue(null) : formatMoney(margin, currency)}
                  {marginPercent != null && !priceTooLow ? <small>{formatMarkup(marginPercent)}</small> : null}
                </strong>
              </div>
            </div>

            <p className="mz-offer__hint">{t('shipments.offerActionHint')}</p>
            <div className="mz-form-actions">
              <button
                type="submit"
                value="publish"
                className="mz-btn mz-btn--ghost"
                disabled={publishing || confirming || customerPrice == null || priceTooLow}
              >
                {t('shipments.publishOffer')}
              </button>
              <button
                type="submit"
                value="confirm"
                className="mz-btn mz-btn--primary"
                disabled={publishing || confirming || customerPrice == null || priceTooLow}
              >
                {t('shipments.confirmAgreement')}
              </button>
            </div>
          </form>
        ) : source === 'provider' && quotations.length === 0 && shipment.status === 'published' ? (
          <p className="mz-offer__hint">{t('shipments.noSubmittedQuotations')}</p>
        ) : source === 'provider' && selectable.length === 0 && quotations.length > 0 && shipment.status === 'published' ? (
          <p className="mz-offer__hint">{t('shipments.noValidQuotations')}</p>
        ) : null}
      </div>
    </section>
  )
}

interface OfferDetail {
  price_per_trip?: string | number | null
  truck_count?: number | null
  truck_type?: string | null
  truck_type_label?: string | null
  truck_capacity_tons?: string | number | null
  trip_count?: number | null
  quantity_per_trip?: string | number | null
  duration_days?: number | null
  transport_start_date?: string | null
  additional_costs?: string | number | null
  valid_until?: string | null
  currency?: string | null
}

function OfferFacts({ detail, unitLabel, note }: { detail: OfferDetail; unitLabel: string | null; note?: string | null }) {
  const { t } = useTranslation()
  const rows: { label: string; value: string }[] = []
  const push = (label: string, value?: string | number | null) => {
    if (value == null || value === '') return
    rows.push({ label, value: String(value) })
  }
  if (moneyAmount(detail.price_per_trip)) {
    push(t('quotations.pricePerTrip'), formatMoney(detail.price_per_trip, detail.currency ?? undefined))
  }
  push(t('quotations.truckCount'), detail.truck_count == null ? null : formatDetail(detail.truck_count))
  push(t('quotations.truckType'), detail.truck_type_label || detail.truck_type)
  if (detail.truck_capacity_tons != null && detail.truck_capacity_tons !== '') {
    push(t('quotations.truckCapacity'), formatDetail(detail.truck_capacity_tons))
  }
  push(t('quotations.tripCount'), detail.trip_count == null ? null : formatDetail(detail.trip_count))
  if (detail.quantity_per_trip != null && detail.quantity_per_trip !== '') {
    const amount = formatDetail(detail.quantity_per_trip)
    push(t('quotations.quantityPerTrip'), unitLabel ? `${amount} ${unitLabel}` : amount)
  }
  push(t('quotations.duration'), detail.duration_days == null ? null : formatDetail(detail.duration_days))
  if (detail.transport_start_date) {
    push(t('quotations.transportStartDate'), formatDate(detail.transport_start_date))
  }
  if (moneyAmount(detail.additional_costs)) {
    push(t('quotations.additionalCosts'), formatMoney(detail.additional_costs, detail.currency ?? undefined))
  }
  if (detail.valid_until) {
    push(t('quotations.validUntil'), formatDate(detail.valid_until))
  }
  if (rows.length === 0 && !note) return null
  return (
    <>
      {rows.length > 0 ? (
        <dl className="mz-offer-facts">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note ? <p className="mz-offer-card__note">{note}</p> : null}
    </>
  )
}

function PublishedOffer({
  offer,
  quotation,
  unitLabel,
  canConfirm,
  confirming,
  canWithdraw,
  withdrawing,
  onConfirm,
  onWithdraw,
}: {
  offer: PlatformOffer
  quotation: Quotation | null
  unitLabel: string | null
  canConfirm: boolean
  confirming: boolean
  canWithdraw: boolean
  withdrawing: boolean
  onConfirm: () => void
  onWithdraw: () => void
}) {
  const { t } = useTranslation()
  const owned = offer.owned_by_platform === true
  const providerPrice = moneyAmount(offer.provider_price)
  const customerPrice = moneyAmount(offer.customer_price)
  const margin = moneyAmount(offer.margin_amount)
  const marginPercent =
    !owned && providerPrice != null && providerPrice > 0 && customerPrice != null
      ? ((customerPrice - providerPrice) / providerPrice) * 100
      : null
  const currency = offer.currency ?? undefined
  const provider = owned ? null : (offer.provider ?? quotation?.provider)

  return (
    <article className="mz-offer-live">
      <div className="mz-offer-live__top">
        <div>
          <h3>{t('shipments.currentOffer')}</h3>
          <p>{offer.reference}</p>
          {owned ? <p>{t('shipments.platformFulfillment')}</p> : null}
          {provider ? (
            <Link className="mz-link" to={`/providers/${provider.id}`}>
              {organizationName(provider)}
            </Link>
          ) : null}
        </div>
        <StatusBadge status={offer.status} />
      </div>
      <div className="mz-offer-preview">
        <div>
          <span>{t('shipments.customerPrice')}</span>
          <strong>{formatMoney(offer.customer_price, currency)}</strong>
        </div>
        {owned ? null : (
          <div>
            <span>{t('shipments.providerPrice')}</span>
            <strong>{formatMoney(offer.provider_price, currency)}</strong>
          </div>
        )}
        {owned ? null : (
          <div>
            <span>{t('shipments.margin')}</span>
            <strong>
              {formatMoney(margin, currency)}
              {marginPercent != null ? <small>{formatMarkup(marginPercent)}</small> : null}
            </strong>
          </div>
        )}
      </div>
      <OfferFacts
        detail={{
          truck_count: offer.truck_count,
          truck_type: offer.truck_type,
          truck_type_label: offer.truck_type_label,
          truck_capacity_tons: offer.truck_capacity_tons,
          trip_count: offer.trip_count,
          quantity_per_trip: offer.quantity_per_trip,
          duration_days: offer.duration_days,
          transport_start_date: offer.transport_start_date ?? quotation?.transport_start_date,
          additional_costs: offer.additional_costs ?? quotation?.additional_costs,
          valid_until: offer.valid_until,
          currency: offer.currency,
        }}
        unitLabel={unitLabel}
        note={offer.conditions}
      />
      {canConfirm ? <p className="mz-offer__hint">{t('shipments.agreementPending')}</p> : null}
      {canConfirm || canWithdraw ? (
        <div className="mz-form-actions">
          {canConfirm ? (
            <button type="button" className="mz-btn mz-btn--primary" disabled={confirming || withdrawing} onClick={onConfirm}>
              {t('shipments.confirmAgreement')}
            </button>
          ) : null}
          {canWithdraw ? (
            <button type="button" className="mz-btn mz-btn--danger" disabled={withdrawing || confirming} onClick={onWithdraw}>
              {t('shipments.withdrawOffer')}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

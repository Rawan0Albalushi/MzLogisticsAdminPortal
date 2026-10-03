import { useEffect, useId, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApiMessage } from '@/core/api/client.ts'
import {
  fetchFleetForPlan,
  fetchProviders,
  fetchTruckTypes,
  submitQuotationOnBehalf,
  withdrawQuotation,
} from '@/core/api/services.ts'
import type { Organization, Shipment } from '@/core/api/types.ts'
import { QuoteExecutionFields } from '@/features/quotations/QuoteExecutionFields.tsx'
import { earliestTransportStart } from '@/features/quotations/transportStart.ts'
import { billableTripCount, quotationTotal } from '@/features/quotations/quotationPrice.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { formatMoney, organizationName } from '@/shared/utils/format.ts'

interface OnBehalfQuotationPanelProps {
  shipment: Shipment
}

const emptyForm = {
  price_per_trip: '',
  truck_count: '1',
  truck_type: '',
  truck_capacity_tons: '',
  trip_count: '1',
  quantity_per_trip: '',
  duration_days: '1',
  transport_start_date: '',
  additional_costs: '',
  conditions: '',
}

function providerLabel(organization: Organization) {
  const name = organizationName(organization)
  return organization.email ? `${name} — ${organization.email}` : name
}

function ProviderPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { t } = useTranslation()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [picked, setPicked] = useState<Organization | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) {
      return
    }
    searchRef.current?.focus()
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const providers = useQuery({
    queryKey: ['providers', 'on-behalf', debouncedSearch],
    queryFn: () => fetchProviders({ search: debouncedSearch, status: 'active', per_page: 20, page: 1 }),
    enabled: open,
  })
  const options = providers.data?.items ?? []
  const selected = picked && String(picked.id) === value ? picked : null

  function choose(organization: Organization) {
    setPicked(organization)
    onChange(String(organization.id))
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="mz-picker" ref={rootRef}>
      <button
        id="on-behalf-provider"
        type="button"
        className={`mz-select mz-picker__trigger${selected ? '' : ' is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected ? providerLabel(selected) : t('shipments.chooseProvider')}</span>
      </button>
      {open ? (
        <div className="mz-picker__panel">
          <input
            ref={searchRef}
            className="mz-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('shipments.providerSearchPlaceholder')}
            aria-label={t('shipments.providerSearchPlaceholder')}
          />
          <ul id={listId} className="mz-picker__list" role="listbox">
            {providers.isLoading ? <li className="mz-picker__empty">{t('common.loading')}</li> : null}
            {providers.isError ? <li className="mz-picker__empty">{t('common.error')}</li> : null}
            {!providers.isLoading && !providers.isError && options.length === 0 ? (
              <li className="mz-picker__empty">{t('common.empty')}</li>
            ) : null}
            {options.map((row) => {
              const id = String(row.id)
              const isSelected = id === value
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={`mz-picker__option${isSelected ? ' is-selected' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => choose(row)}
                  >
                    {providerLabel(row)}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function OnBehalfQuotationPanel({ shipment }: OnBehalfQuotationPanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [providerId, setProviderId] = useState('')
  const [form, setForm] = useState({
    ...emptyForm,
    transport_start_date: earliestTransportStart(shipment.required_date),
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [planValid, setPlanValid] = useState(true)
  const truckTypes = useQuery({ queryKey: ['truck-types'], queryFn: fetchTruckTypes })
  const providerFleet = useQuery({
    queryKey: ['trucks', 'offer-plan', providerId],
    queryFn: () => fetchFleetForPlan({ organization_id: providerId }),
    enabled: providerId !== '',
  })
  const activeTruckTypes = (truckTypes.data ?? []).filter((row) => row.is_active)
  const existing = (shipment.quotations ?? []).find(
    (row) => providerId !== '' && String(row.provider?.id) === providerId && row.status !== 'withdrawn',
  )
  const canReplace = existing?.submitted_on_behalf === true && existing.status === 'submitted'
  const blocked = Boolean(existing)
  const price = Number(form.price_per_trip)
  const trips = billableTripCount(Number(form.truck_count), Number(form.trip_count))
  const total = trips != null && Number.isFinite(price) && price > 0 ? quotationTotal(price, trips) : null
  const ready =
    providerId !== '' &&
    !blocked &&
    form.price_per_trip.trim() !== '' &&
    Number.isFinite(price) &&
    price > 0 &&
    trips != null &&
    Number(form.truck_count) >= 1 &&
    form.truck_type !== '' &&
    Number(form.truck_capacity_tons) > 0 &&
    Number(form.trip_count) >= 1 &&
    Number(form.quantity_per_trip) > 0 &&
    Number(form.duration_days) >= 1 &&
    form.transport_start_date !== '' &&
    planValid

  const submit = useMutation({
    mutationFn: () => {
      const additional = form.additional_costs.trim()
      return submitQuotationOnBehalf(shipment.id, {
        provider_organization_id: Number(providerId),
        price_per_trip: price,
        truck_count: Number(form.truck_count),
        truck_type: form.truck_type,
        truck_capacity_tons: Number(form.truck_capacity_tons),
        trip_count: Number(form.trip_count),
        quantity_per_trip: Number(form.quantity_per_trip),
        duration_days: Number(form.duration_days),
        transport_start_date: form.transport_start_date,
        ...(additional !== '' && Number.isFinite(Number(additional)) ? { additional_costs: Number(additional) } : {}),
        ...(form.conditions.trim() ? { conditions: form.conditions.trim() } : {}),
      })
    },
    onSuccess: async () => {
      setError('')
      setMessage(t('shipments.onBehalfSubmitted'))
      await queryClient.invalidateQueries({ queryKey: ['shipment', String(shipment.id)] })
      await queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
    onError: (err) => {
      setMessage('')
      setError(getApiMessage(err, t('shipments.onBehalfFailed')))
    },
  })

  const withdraw = useMutation({
    mutationFn: () => withdrawQuotation(existing?.id ?? 0),
    onSuccess: async () => {
      setConfirmWithdraw(false)
      setError('')
      setMessage(t('shipments.onBehalfWithdrawn'))
      await queryClient.invalidateQueries({ queryKey: ['shipment', String(shipment.id)] })
      await queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
    onError: (err) => {
      setConfirmWithdraw(false)
      setMessage('')
      setError(getApiMessage(err, t('shipments.onBehalfFailed')))
    },
  })

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <>
      <form
        className="mz-form mz-offer-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!ready || submit.isPending) return
          submit.mutate()
        }}
      >
        <p className="mz-offer__hint">{t('shipments.onBehalfHint')}</p>
        {message ? <div className="mz-alert mz-alert--ok">{message}</div> : null}
        {error ? <div className="mz-alert">{error}</div> : null}
          <FormField label={t('common.provider')} htmlFor="on-behalf-provider" required wide>
            <ProviderPicker
              value={providerId}
              onChange={(id) => {
                setProviderId(id)
                setMessage('')
                setError('')
                setPlanValid(true)
                setForm((current) => ({
                  ...current,
                  truck_count: '1',
                  truck_type: '',
                  truck_capacity_tons: '',
                  trip_count: '1',
                  quantity_per_trip: '',
                  duration_days: '1',
                }))
              }}
            />
          </FormField>
          {blocked && !canReplace ? <p className="mz-offer__hint">{t('shipments.providerAlreadyQuoted')}</p> : null}
          {canReplace ? <p className="mz-offer__hint">{t('shipments.onBehalfReplaceHint')}</p> : null}
          {canReplace ? (
            <div className="mz-form-actions">
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setConfirmWithdraw(true)}>
                {t('shipments.withdrawOnBehalf')}
              </button>
            </div>
          ) : null}
          <QuoteExecutionFields
            shipment={shipment}
            trucks={providerFleet.data ?? []}
            fleetReady={providerId === '' || providerFleet.isFetched || providerFleet.isError}
            truckTypes={activeTruckTypes}
            idPrefix="on-behalf"
            resetKey={`${shipment.id}:${providerId}`}
            disabled={blocked}
            value={form}
            onChange={(next) => setForm((current) => ({ ...current, ...next }))}
            onValidChange={setPlanValid}
          />
          <FormField
            label={t('quotations.transportStartDate')}
            htmlFor="on-behalf-start"
            required
            hint={t('quotations.transportStartHint')}
          >
            <input
              id="on-behalf-start"
              className="mz-input"
              type="date"
              required
              min={earliestTransportStart(shipment.required_date)}
              value={form.transport_start_date}
              disabled={blocked}
              onChange={(event) => update('transport_start_date', event.target.value)}
            />
          </FormField>
          <FormField label={t('quotations.pricePerTrip')} htmlFor="on-behalf-price" required hint={t('quotations.pricePerTripHint')}>
            <input
              id="on-behalf-price"
              className="mz-input"
              inputMode="decimal"
              value={form.price_per_trip}
              disabled={blocked}
              onChange={(event) => update('price_per_trip', event.target.value)}
              required
            />
          </FormField>
          <FormField label={t('quotations.additionalCosts')} htmlFor="on-behalf-extra">
            <input
              id="on-behalf-extra"
              className="mz-input"
              inputMode="decimal"
              value={form.additional_costs}
              disabled={blocked}
              onChange={(event) => update('additional_costs', event.target.value)}
            />
          </FormField>
          <FormField label={t('quotations.conditions')} htmlFor="on-behalf-conditions">
            <textarea
              id="on-behalf-conditions"
              className="mz-input mz-textarea"
              value={form.conditions}
              maxLength={2000}
              disabled={blocked}
              onChange={(event) => update('conditions', event.target.value)}
            />
          </FormField>
        {total != null && trips != null ? (
          <p className="mz-offer__hint">{t('quotations.calculatedTotal', { amount: formatMoney(total), count: trips })}</p>
        ) : null}
        <div className="mz-form-actions">
          <button type="submit" className="mz-btn mz-btn--primary" disabled={!ready || submit.isPending || withdraw.isPending}>
            {t('shipments.submitOnBehalf')}
          </button>
        </div>
      </form>
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

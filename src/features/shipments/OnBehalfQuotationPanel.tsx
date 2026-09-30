import { useEffect, useId, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getApiMessage } from '@/core/api/client.ts'
import {
  fetchProviders,
  fetchTruckTypes,
  submitQuotationOnBehalf,
  withdrawQuotation,
} from '@/core/api/services.ts'
import type { Organization, Shipment } from '@/core/api/types.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { organizationName } from '@/shared/utils/format.ts'

interface OnBehalfQuotationPanelProps {
  shipment: Shipment
}

const emptyForm = {
  total_price: '',
  truck_count: '1',
  truck_type: '',
  truck_capacity_tons: '',
  trip_count: '1',
  quantity_per_trip: '',
  duration_days: '1',
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
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const truckTypes = useQuery({ queryKey: ['truck-types'], queryFn: fetchTruckTypes })
  const activeTruckTypes = (truckTypes.data ?? []).filter((row) => row.is_active)
  const existing = (shipment.quotations ?? []).find(
    (row) => providerId !== '' && String(row.provider?.id) === providerId && row.status !== 'withdrawn',
  )
  const canReplace = existing?.submitted_on_behalf === true && existing.status === 'submitted'
  const blocked = Boolean(existing)
  const price = Number(form.total_price)
  const ready =
    providerId !== '' &&
    !blocked &&
    form.total_price.trim() !== '' &&
    Number.isFinite(price) &&
    price > 0 &&
    Number(form.truck_count) >= 1 &&
    form.truck_type !== '' &&
    Number(form.truck_capacity_tons) > 0 &&
    Number(form.trip_count) >= 1 &&
    Number(form.quantity_per_trip) > 0 &&
    Number(form.duration_days) >= 1

  const submit = useMutation({
    mutationFn: () => {
      const additional = form.additional_costs.trim()
      return submitQuotationOnBehalf(shipment.id, {
        provider_organization_id: Number(providerId),
        total_price: price,
        truck_count: Number(form.truck_count),
        truck_type: form.truck_type,
        truck_capacity_tons: Number(form.truck_capacity_tons),
        trip_count: Number(form.trip_count),
        quantity_per_trip: Number(form.quantity_per_trip),
        duration_days: Number(form.duration_days),
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
    <section className="mz-card mz-section">
      <div className="mz-card__body mz-offer">
        <SectionTitle icon="quotations" title={t('shipments.onBehalfTitle')} />
        <p className="mz-offer__hint">{t('shipments.onBehalfHint')}</p>
        {message ? <div className="mz-alert mz-alert--ok">{message}</div> : null}
        {error ? <div className="mz-alert">{error}</div> : null}
        <form
          className="mz-form mz-offer-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!ready || submit.isPending) return
            submit.mutate()
          }}
        >
          <FormField label={t('common.provider')} htmlFor="on-behalf-provider" required wide>
            <ProviderPicker
              value={providerId}
              onChange={(id) => {
                setProviderId(id)
                setMessage('')
                setError('')
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
          <FormField label={t('quotations.price')} htmlFor="on-behalf-price" required hint={t('shipments.onBehalfPriceHint')}>
            <input
              id="on-behalf-price"
              className="mz-input"
              inputMode="decimal"
              value={form.total_price}
              disabled={blocked}
              onChange={(event) => update('total_price', event.target.value)}
              required
            />
          </FormField>
          <FormField label={t('quotations.truckCount')} htmlFor="on-behalf-trucks" required>
            <input
              id="on-behalf-trucks"
              className="mz-input"
              inputMode="numeric"
              value={form.truck_count}
              disabled={blocked}
              onChange={(event) => update('truck_count', event.target.value)}
              required
            />
          </FormField>
          <FormField label={t('quotations.truckType')} htmlFor="on-behalf-type" required>
            <select
              id="on-behalf-type"
              className="mz-select"
              value={form.truck_type}
              disabled={blocked}
              onChange={(event) => update('truck_type', event.target.value)}
              required
            >
              <option value="">{t('shipments.chooseTruckType')}</option>
              {activeTruckTypes.map((row) => (
                <option key={row.id} value={row.code}>
                  {row.name_ar && row.name_ar !== row.name ? `${row.name} / ${row.name_ar}` : row.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={t('quotations.truckCapacity')} htmlFor="on-behalf-capacity" required>
            <input
              id="on-behalf-capacity"
              className="mz-input"
              inputMode="decimal"
              value={form.truck_capacity_tons}
              disabled={blocked}
              onChange={(event) => update('truck_capacity_tons', event.target.value)}
              required
            />
          </FormField>
          <FormField label={t('quotations.tripCount')} htmlFor="on-behalf-trips" required>
            <input
              id="on-behalf-trips"
              className="mz-input"
              inputMode="numeric"
              value={form.trip_count}
              disabled={blocked}
              onChange={(event) => update('trip_count', event.target.value)}
              required
            />
          </FormField>
          <FormField label={t('quotations.quantityPerTrip')} htmlFor="on-behalf-quantity" required>
            <input
              id="on-behalf-quantity"
              className="mz-input"
              inputMode="decimal"
              value={form.quantity_per_trip}
              disabled={blocked}
              onChange={(event) => update('quantity_per_trip', event.target.value)}
              required
            />
          </FormField>
          <FormField label={t('quotations.duration')} htmlFor="on-behalf-duration" required>
            <input
              id="on-behalf-duration"
              className="mz-input"
              inputMode="numeric"
              value={form.duration_days}
              disabled={blocked}
              onChange={(event) => update('duration_days', event.target.value)}
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
          <div className="mz-form-actions">
            <button type="submit" className="mz-btn mz-btn--primary" disabled={!ready || submit.isPending || withdraw.isPending}>
              {t('shipments.submitOnBehalf')}
            </button>
          </div>
        </form>
      </div>
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
    </section>
  )
}

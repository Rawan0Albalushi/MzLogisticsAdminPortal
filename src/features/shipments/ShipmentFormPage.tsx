import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createShipment, fetchCustomers, fetchOrganization } from '@/core/api/services.ts'
import type { Organization, PlaceLocation } from '@/core/api/types.ts'
import { LocationPicker } from '@/features/shipments/LocationPicker.tsx'
import { getApiMessage } from '@/core/api/client.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { isCustomerOrganization, organizationName } from '@/shared/utils/format.ts'

const quantityUnits = ['tons', 'pallets', 'units'] as const

function todayInput(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function customerOptionLabel(organization: Organization): string {
  const name = organizationName(organization)
  return organization.email ? `${name} — ${organization.email}` : name
}

function CustomerPicker({
  value,
  onChange,
  presetId,
}: {
  value: string
  onChange: (id: string) => void
  presetId: string
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

  const customers = useQuery({
    queryKey: ['customers', 'picker', debouncedSearch],
    queryFn: () => fetchCustomers({ search: debouncedSearch, status: 'active', per_page: 20, page: 1 }),
    enabled: open,
  })
  const preset = useQuery({
    queryKey: ['organization', presetId],
    queryFn: () => fetchOrganization(presetId),
    enabled: Boolean(presetId),
  })

  const options = useMemo(() => {
    const rows = (customers.data?.items ?? []).filter(
      (row) => isCustomerOrganization(row) && row.status === 'active',
    )
    const presetOrg = preset.data
    if (
      !debouncedSearch &&
      presetOrg &&
      isCustomerOrganization(presetOrg) &&
      presetOrg.status === 'active' &&
      !rows.some((row) => row.id === presetOrg.id)
    ) {
      return [presetOrg, ...rows]
    }
    return rows
  }, [customers.data?.items, debouncedSearch, preset.data])

  const presetOrg = preset.data
  const selected =
    picked && String(picked.id) === value
      ? picked
      : presetOrg &&
          isCustomerOrganization(presetOrg) &&
          presetOrg.status === 'active' &&
          String(presetOrg.id) === value
        ? presetOrg
        : null

  function choose(organization: Organization) {
    setPicked(organization)
    onChange(String(organization.id))
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="mz-picker" ref={rootRef}>
      <button
        id="shipment-customer"
        type="button"
        className={`mz-select mz-picker__trigger${selected ? '' : ' is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected ? customerOptionLabel(selected) : t('shipments.chooseCustomer')}</span>
      </button>
      {open ? (
        <div className="mz-picker__panel">
          <input
            ref={searchRef}
            className="mz-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('shipments.customerSearchPlaceholder')}
            aria-label={t('shipments.customerSearchPlaceholder')}
          />
          <ul id={listId} className="mz-picker__list" role="listbox">
            {customers.isLoading ? <li className="mz-picker__empty">{t('common.loading')}</li> : null}
            {!customers.isLoading && options.length === 0 ? <li className="mz-picker__empty">{t('common.empty')}</li> : null}
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
                    {customerOptionLabel(row)}
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

export function ShipmentFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const presetId = params.get('customer') ?? ''
  const [customerId, setCustomerId] = useState(presetId)
  const [error, setError] = useState('')
  const [pickup, setPickup] = useState<PlaceLocation | null>(null)
  const [delivery, setDelivery] = useState<PlaceLocation | null>(null)
  const [form, setForm] = useState({
    cargo_type: '',
    cargo_description: '',
    weight_tons: '',
    volume_cbm: '',
    quantity: '',
    quantity_unit: 'tons',
    required_date: todayInput(),
    notes: '',
    publish: true,
  })

  const preset = useQuery({
    queryKey: ['organization', presetId],
    queryFn: () => fetchOrganization(presetId),
    enabled: Boolean(presetId),
  })
  const presetUnavailable =
    Boolean(presetId) &&
    preset.isSuccess &&
    (!preset.data || !isCustomerOrganization(preset.data) || preset.data.status !== 'active')

  const save = useMutation({
    mutationFn: (route: { pickup: PlaceLocation; delivery: PlaceLocation }) => {
      const weight = Number(form.weight_tons)
      const volume = form.volume_cbm.trim() === '' ? undefined : Number(form.volume_cbm)
      const quantity = form.quantity_unit === 'tons' || form.quantity.trim() === '' ? undefined : Number(form.quantity)
      return createShipment({
        customer_organization_id: Number(customerId),
        cargo_type: form.cargo_type.trim(),
        cargo_description: form.cargo_description.trim() || undefined,
        weight_tons: weight,
        volume_cbm: volume,
        quantity,
        quantity_unit: form.quantity_unit,
        pickup_address: route.pickup.address || undefined,
        pickup_city: route.pickup.city,
        pickup_lat: route.pickup.lat,
        pickup_lng: route.pickup.lng,
        delivery_address: route.delivery.address || undefined,
        delivery_city: route.delivery.city,
        delivery_lat: route.delivery.lat,
        delivery_lng: route.delivery.lng,
        required_date: form.required_date,
        notes: form.notes.trim() || undefined,
        publish: form.publish,
      })
    },
    onSuccess: async (shipment) => {
      await queryClient.invalidateQueries({ queryKey: ['shipments'] })
      navigate(`/shipments/${shipment.id}`, { replace: true })
    },
    onError: (err) => setError(getApiMessage(err, t('shipments.createFailed'))),
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!pickup) {
      setError(t('location.pickupMapRequired'))
      return
    }
    if (!delivery) {
      setError(t('location.deliveryMapRequired'))
      return
    }
    save.mutate({ pickup, delivery })
  }

  return (
    <>
      <PageHeader
        title={t('shipments.create')}
        subtitle={t('shipments.createHint')}
        crumbs={[{ label: t('shipments.title'), to: '/shipments' }, { label: t('shipments.create') }]}
      />
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}
      {presetUnavailable ? <div className="mz-alert mz-section-alert">{t('shipments.customerUnavailable')}</div> : null}
      <section className="mz-card">
        <div className="mz-card__body">
          <form className="mz-form" onSubmit={onSubmit}>
            <FormField label={t('common.customer')} htmlFor="shipment-customer" required>
              <CustomerPicker value={customerId} onChange={setCustomerId} presetId={presetId} />
            </FormField>
            <FormField label={t('shipments.cargoType')} htmlFor="shipment-cargo" required>
              <input
                id="shipment-cargo"
                className="mz-input"
                value={form.cargo_type}
                onChange={(event) => setForm((current) => ({ ...current, cargo_type: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('common.weight')} htmlFor="shipment-weight" required>
              <input
                id="shipment-weight"
                className="mz-input"
                type="number"
                min="0.1"
                step="0.1"
                value={form.weight_tons}
                onChange={(event) => setForm((current) => ({ ...current, weight_tons: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('shipments.quantityUnit')} htmlFor="shipment-unit" required>
              <select
                id="shipment-unit"
                className="mz-select"
                value={form.quantity_unit}
                onChange={(event) => setForm((current) => ({ ...current, quantity_unit: event.target.value }))}
              >
                {quantityUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {t(`common.quantityUnits.${unit}`)}
                  </option>
                ))}
              </select>
            </FormField>
            {form.quantity_unit === 'tons' ? (
              <FormField label={t('common.volume')} htmlFor="shipment-volume">
                <input
                  id="shipment-volume"
                  className="mz-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.volume_cbm}
                  onChange={(event) => setForm((current) => ({ ...current, volume_cbm: event.target.value }))}
                />
              </FormField>
            ) : (
              <FormField label={t('common.quantity')} htmlFor="shipment-quantity" required>
                <input
                  id="shipment-quantity"
                  className="mz-input"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                  required
                />
              </FormField>
            )}
            <FormField label={t('shipments.cargoDescription')} htmlFor="shipment-description">
              <textarea
                id="shipment-description"
                className="mz-input mz-textarea"
                rows={3}
                value={form.cargo_description}
                onChange={(event) => setForm((current) => ({ ...current, cargo_description: event.target.value }))}
              />
            </FormField>
            <div className="mz-grid-2 mz-grid-2--equal">
              <FormField label={t('shipments.pickupCity')} htmlFor="shipment-pickup" required>
                <LocationPicker id="shipment-pickup" label={t('shipments.pickupCity')} value={pickup} onChange={setPickup} />
              </FormField>
              <FormField label={t('shipments.deliveryCity')} htmlFor="shipment-delivery" required>
                <LocationPicker
                  id="shipment-delivery"
                  label={t('shipments.deliveryCity')}
                  value={delivery}
                  onChange={setDelivery}
                />
              </FormField>
            </div>
            <FormField label={t('shipments.requiredDate')} htmlFor="shipment-date" required>
              <input
                id="shipment-date"
                className="mz-input"
                type="date"
                min={todayInput()}
                value={form.required_date}
                onChange={(event) => setForm((current) => ({ ...current, required_date: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('common.notes')} htmlFor="shipment-notes">
              <textarea
                id="shipment-notes"
                className="mz-input mz-textarea"
                rows={3}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </FormField>
            <label className="mz-check">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(event) => setForm((current) => ({ ...current, publish: event.target.checked }))}
              />
              {t('shipments.publishNow')}
            </label>
            <div className="mz-form-actions">
              <button
                type="submit"
                className="mz-btn mz-btn--primary"
                disabled={save.isPending || !customerId || !pickup || !delivery}
              >
                {save.isPending ? t('common.saving') : t('shipments.create')}
              </button>
              <Link className="mz-btn mz-btn--ghost" to="/shipments">
                {t('common.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

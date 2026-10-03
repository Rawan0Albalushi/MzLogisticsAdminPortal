import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogTruckType, Shipment, Truck } from '@/core/api/types.ts'
import { FormField } from '@/shared/components/FormField.tsx'
import {
  assessTransportPlan,
  formatPlanInput,
  loadsNeeded,
  planTransportCapacity,
  splitQuantity,
  suggestTransportPlan,
  suggestionMatches,
  type TransportSuggestion,
} from '@/features/quotations/quoteTransportPlanner.ts'

export interface ExecutionPlanValues {
  truck_count: string
  truck_type: string
  truck_capacity_tons: string
  trip_count: string
  quantity_per_trip: string
  duration_days: string
}

interface QuoteExecutionFieldsProps {
  shipment: Shipment
  trucks: Truck[]
  fleetReady: boolean
  truckTypes: CatalogTruckType[]
  idPrefix: string
  resetKey: string
  disabled?: boolean
  value: ExecutionPlanValues
  onChange: (next: ExecutionPlanValues) => void
  onValidChange?: (valid: boolean) => void
}

const blankLocks = { capacity: false, trucks: false, trips: false, qty: false, duration: false }

function asNumber(value?: string | number | null) {
  if (value == null || value === '') return 0
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function fleetCapacities(trucks: Truck[], type: string) {
  if (!type) return []
  return trucks
    .filter((truck) => truck.type === type && truck.status !== 'maintenance' && truck.status !== 'inactive')
    .map((truck) => asNumber(truck.capacity_tons))
    .filter((capacity) => capacity > 0)
}

function patchUnlocked(
  current: ExecutionPlanValues,
  suggestion: TransportSuggestion,
  locks: typeof blankLocks,
) {
  const next = { ...current }
  let changed = false
  const write = (key: keyof ExecutionPlanValues, formatted: string) => {
    if (next[key] === formatted) return
    next[key] = formatted
    changed = true
  }
  if (!locks.capacity) write('truck_capacity_tons', formatPlanInput(suggestion.capacityTons))
  if (!locks.trucks) write('truck_count', String(suggestion.truckCount))
  if (!locks.trips) write('trip_count', String(suggestion.tripCount))
  if (!locks.qty) write('quantity_per_trip', formatPlanInput(suggestion.quantityPerTrip))
  if (!locks.duration) write('duration_days', String(suggestion.durationDays))
  return changed ? next : null
}

export function QuoteExecutionFields({
  shipment,
  trucks,
  fleetReady,
  truckTypes,
  idPrefix,
  resetKey,
  disabled = false,
  value,
  onChange,
  onValidChange,
}: QuoteExecutionFieldsProps) {
  const { t } = useTranslation()
  const [locks, setLocks] = useState(blankLocks)
  const [manualCapacity, setManualCapacity] = useState<number | null>(null)
  const [seenKey, setSeenKey] = useState(resetKey)
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onValidChangeRef = useRef(onValidChange)
  const locksRef = useRef(locks)
  const capacityTimer = useRef<number | null>(null)
  valueRef.current = value
  onChangeRef.current = onChange
  onValidChangeRef.current = onValidChange
  locksRef.current = locks

  if (seenKey !== resetKey) {
    setSeenKey(resetKey)
    setLocks(blankLocks)
    setManualCapacity(null)
  }

  const quantity = asNumber(shipment.quantity)
  const weightTons = asNumber(shipment.weight_tons)
  const fleet = useMemo(() => fleetCapacities(trucks, value.truck_type), [trucks, value.truck_type])
  const suggestion = useMemo(() => {
    if (!fleetReady || quantity <= 0) return null
    if (locks.capacity) {
      if (manualCapacity == null || manualCapacity <= 0) return null
      return planTransportCapacity({
        quantity,
        weightTons,
        quantityUnit: shipment.quantity_unit,
        capacityTons: manualCapacity,
        fleetCapacities: fleet,
      })
    }
    if (!value.truck_type || fleet.length === 0) return null
    return suggestTransportPlan({
      quantity,
      weightTons,
      quantityUnit: shipment.quantity_unit,
      fleetCapacities: fleet,
    })
  }, [fleet, fleetReady, locks.capacity, manualCapacity, quantity, shipment.quantity_unit, value.truck_type, weightTons])

  useEffect(() => {
    if (!fleetReady || disabled || !suggestion) return
    const patched = patchUnlocked(valueRef.current, suggestion, locksRef.current)
    if (patched) onChangeRef.current(patched)
  }, [disabled, fleetReady, suggestion])

  useEffect(() => {
    return () => {
      if (capacityTimer.current != null) window.clearTimeout(capacityTimer.current)
    }
  }, [])

  const issue = assessTransportPlan({
    quantity,
    weightTons,
    capacityTons: asNumber(value.truck_capacity_tons),
    quantityPerTrip: asNumber(value.quantity_per_trip),
    tripCount: Number.parseInt(value.trip_count, 10) || 0,
  })
  const valid = issue == null
  const showIssue = issue != null && asNumber(value.quantity_per_trip) > 0

  useEffect(() => {
    onValidChangeRef.current?.(valid)
  }, [valid])

  const unit = shipment.quantity_unit
    ? t(`common.quantityUnits.${shipment.quantity_unit}`, { defaultValue: shipment.quantity_unit })
    : t('common.quantityUnits.tons')
  const follows =
    suggestion != null &&
    suggestionMatches(suggestion, {
      truckCount: Number.parseInt(value.truck_count, 10) || 0,
      tripCount: Number.parseInt(value.trip_count, 10) || 0,
      capacityTons: asNumber(value.truck_capacity_tons),
      quantityPerTrip: asNumber(value.quantity_per_trip),
    })
  const largest = fleet.reduce((max, capacity) => (capacity > max ? capacity : max), 0)

  function changeType(type: string) {
    if (capacityTimer.current != null) window.clearTimeout(capacityTimer.current)
    setLocks(blankLocks)
    setManualCapacity(null)
    onChange({ ...value, truck_type: type })
  }

  function changeCapacity(raw: string) {
    setLocks((current) => ({ ...current, capacity: true }))
    onChange({ ...value, truck_capacity_tons: raw })
    if (capacityTimer.current != null) window.clearTimeout(capacityTimer.current)
    capacityTimer.current = window.setTimeout(() => {
      const amount = Number(raw)
      setManualCapacity(Number.isFinite(amount) && amount > 0 ? amount : null)
    }, 300)
  }

  function changeTrucks(raw: string) {
    const parsed = Number.parseInt(raw, 10)
    const next = { ...value, truck_count: raw }
    if (Number.isInteger(parsed) && parsed >= 1 && quantity > 0) {
      const trucksCount = parsed
      const capacity = asNumber(value.truck_capacity_tons)
      const needed =
        capacity > 0
          ? loadsNeeded({
              quantity,
              weightTons,
              quantityUnit: shipment.quantity_unit,
              capacityTons: capacity,
              fleetCapacities: fleet,
            })
          : trucksCount
      if (!locks.trips) {
        const trips = Math.max(trucksCount, needed)
        next.trip_count = String(trips)
        if (!locks.qty) next.quantity_per_trip = formatPlanInput(splitQuantity(quantity, trips))
        if (!locks.duration) next.duration_days = String(Math.max(1, Math.ceil(trips / trucksCount)))
      } else {
        const currentTrips = Number.parseInt(value.trip_count, 10) || 0
        if (trucksCount > currentTrips || currentTrips > Math.max(needed, trucksCount) * 2) {
          next.trip_count = String(trucksCount)
          if (!locks.qty) next.quantity_per_trip = formatPlanInput(splitQuantity(quantity, trucksCount))
          if (!locks.duration) next.duration_days = '1'
        }
      }
    }
    setLocks((current) => ({ ...current, trucks: true }))
    onChange(next)
  }

  function changeTrips(raw: string) {
    const trucksCount = Math.max(1, Number.parseInt(value.truck_count, 10) || 1)
    let trips = Number.parseInt(raw, 10)
    const next = { ...value, trip_count: raw }
    if (Number.isInteger(trips) && quantity > 0) {
      const capacity = asNumber(value.truck_capacity_tons)
      const needed =
        capacity > 0
          ? loadsNeeded({
              quantity,
              weightTons,
              quantityUnit: shipment.quantity_unit,
              capacityTons: capacity,
              fleetCapacities: fleet,
            })
          : trucksCount
      if (trucksCount > trips || trips > Math.max(needed, trucksCount) * 2) {
        trips = trucksCount
        next.trip_count = String(trips)
      }
      if (!locks.qty) next.quantity_per_trip = formatPlanInput(splitQuantity(quantity, Math.max(trips, 1)))
      if (!locks.duration) next.duration_days = String(Math.max(1, Math.ceil(Math.max(trips, trucksCount) / trucksCount)))
    }
    setLocks((current) => ({ ...current, trips: true }))
    onChange(next)
  }

  function applySuggestion() {
    if (!suggestion) return
    if (capacityTimer.current != null) window.clearTimeout(capacityTimer.current)
    const keepCapacity = locks.capacity && manualCapacity != null
    setLocks({ ...blankLocks, capacity: keepCapacity })
    setManualCapacity(keepCapacity ? suggestion.capacityTons : null)
    onChange({
      ...value,
      truck_count: String(suggestion.truckCount),
      truck_capacity_tons: formatPlanInput(suggestion.capacityTons),
      trip_count: String(suggestion.tripCount),
      quantity_per_trip: formatPlanInput(suggestion.quantityPerTrip),
      duration_days: String(suggestion.durationDays),
    })
  }

  const issueText =
    issue === 'short'
      ? t('quotations.coverageShort', {
          planned: formatPlanInput(asNumber(value.quantity_per_trip) * (Number.parseInt(value.trip_count, 10) || 0)),
          required: formatPlanInput(quantity),
          unit,
        })
      : issue === 'overshoot'
        ? t('quotations.overshootShort', {
            planned: formatPlanInput(asNumber(value.quantity_per_trip) * (Number.parseInt(value.trip_count, 10) || 0)),
            required: formatPlanInput(quantity),
            unit,
          })
        : issue === 'capacity'
          ? t('quotations.capacityShort', {
              capacity: formatPlanInput(asNumber(value.truck_capacity_tons)),
              weight: formatPlanInput(
                quantity > 0 && asNumber(value.quantity_per_trip) > 0
                  ? weightTons * (asNumber(value.quantity_per_trip) / quantity)
                  : 0,
              ),
            })
          : null

  const planNote =
    quantity > 0 ? (
      <div className={`mz-offer__plan${showIssue ? ' is-invalid' : ''}`}>
        {!value.truck_type && !suggestion ? <p className="mz-offer__hint">{t('quotations.planPrompt')}</p> : null}
        {value.truck_type ? (
          <p className="mz-offer__hint">
            {fleet.length > 0
              ? t('quotations.fleetHint', { count: fleet.length, capacity: formatPlanInput(largest) })
              : t('quotations.fleetHintNone')}
          </p>
        ) : null}
        {suggestion ? (
          <p>
            {t('quotations.planSuggestion', {
              trucks: suggestion.truckCount,
              trips: suggestion.tripCount,
              qty: formatPlanInput(suggestion.quantityPerTrip),
              unit,
              capacity: formatPlanInput(suggestion.capacityTons),
            })}
          </p>
        ) : null}
        {showIssue && issueText ? <p className="mz-field__error">{issueText}</p> : null}
        {suggestion && !follows && !disabled && (locks.capacity || locks.trucks || locks.trips || locks.qty || locks.duration) ? (
          <button type="button" className="mz-btn mz-btn--ghost" onClick={applySuggestion}>
            {t('quotations.applySuggestion')}
          </button>
        ) : null}
      </div>
    ) : null

  return (
    <>
      <FormField label={t('quotations.truckType')} htmlFor={`${idPrefix}-type`} required>
        <select
          id={`${idPrefix}-type`}
          className="mz-select"
          value={value.truck_type}
          disabled={disabled}
          onChange={(event) => changeType(event.target.value)}
          required
        >
          <option value="">{t('shipments.chooseTruckType')}</option>
          {truckTypes.map((row) => (
            <option key={row.id} value={row.code}>
              {row.name_ar && row.name_ar !== row.name ? `${row.name} / ${row.name_ar}` : row.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('quotations.truckCapacity')} htmlFor={`${idPrefix}-capacity`} required>
        <input
          id={`${idPrefix}-capacity`}
          className="mz-input"
          inputMode="decimal"
          value={value.truck_capacity_tons}
          disabled={disabled}
          onChange={(event) => changeCapacity(event.target.value)}
          required
        />
      </FormField>
      {planNote}
      <FormField label={t('quotations.truckCount')} htmlFor={`${idPrefix}-trucks`} required>
        <input
          id={`${idPrefix}-trucks`}
          className="mz-input"
          inputMode="numeric"
          value={value.truck_count}
          disabled={disabled}
          onChange={(event) => changeTrucks(event.target.value)}
          required
        />
      </FormField>
      <FormField label={t('quotations.tripCount')} htmlFor={`${idPrefix}-trips`} required>
        <input
          id={`${idPrefix}-trips`}
          className="mz-input"
          inputMode="numeric"
          value={value.trip_count}
          disabled={disabled}
          onChange={(event) => changeTrips(event.target.value)}
          required
        />
      </FormField>
      <FormField
        label={unit ? `${t('quotations.quantityPerTrip')} (${unit})` : t('quotations.quantityPerTrip')}
        htmlFor={`${idPrefix}-quantity`}
        required
      >
        <input
          id={`${idPrefix}-quantity`}
          className="mz-input"
          inputMode="decimal"
          value={value.quantity_per_trip}
          disabled={disabled}
          onChange={(event) => {
            setLocks((current) => ({ ...current, qty: true }))
            onChange({ ...value, quantity_per_trip: event.target.value })
          }}
          required
        />
      </FormField>
      <FormField label={t('quotations.duration')} htmlFor={`${idPrefix}-duration`} required>
        <input
          id={`${idPrefix}-duration`}
          className="mz-input"
          inputMode="numeric"
          value={value.duration_days}
          disabled={disabled}
          onChange={(event) => {
            setLocks((current) => ({ ...current, duration: true }))
            onChange({ ...value, duration_days: event.target.value })
          }}
          required
        />
      </FormField>
    </>
  )
}

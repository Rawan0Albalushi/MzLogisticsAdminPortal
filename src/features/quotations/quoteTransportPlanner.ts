/** Same planning rules as the service provider quotation screen. */

const EPSILON = 0.0001

export interface TransportSuggestion {
  truckCount: number
  tripCount: number
  capacityTons: number
  quantityPerTrip: number
  durationDays: number
  availableTrucks: number
}

export interface TransportPlanInput {
  quantity: number
  weightTons?: number
  quantityUnit?: string | null
  fleetCapacities: number[]
  manualCapacityTons?: number | null
}

export type TransportPlanIssue = 'short' | 'overshoot' | 'capacity'

interface CapacityPlanInput {
  quantity: number
  weightTons: number
  quantityUnit?: string | null
  capacityTons: number
  fleetCapacities: number[]
}

export function suggestTransportPlan(input: TransportPlanInput): TransportSuggestion | null {
  const quantity = input.quantity
  const weightTons = input.weightTons ?? 0
  if (quantity <= 0) return null

  const usable = input.fleetCapacities.filter((capacity) => capacity > 0)
  const capacities = new Set<number>()
  if (input.manualCapacityTons != null && input.manualCapacityTons > 0) {
    capacities.add(input.manualCapacityTons)
  }
  for (const capacity of usable) capacities.add(capacity)
  if (capacities.size === 0) return null

  let best: TransportSuggestion | null = null
  for (const capacity of capacities) {
    const candidate = planTransportCapacity({
      quantity,
      weightTons,
      quantityUnit: input.quantityUnit,
      capacityTons: capacity,
      fleetCapacities: usable,
    })
    if (!candidate) continue
    if (!best || isBetter(candidate, best)) best = candidate
  }
  return best
}

export function planTransportCapacity(input: CapacityPlanInput): TransportSuggestion | null {
  const maxQty = maxQuantityPerTrip(input)
  if (input.quantity <= 0 || maxQty <= 0) return null

  const trips = Math.ceil(input.quantity / maxQty - 1e-9)
  const capable = input.fleetCapacities.filter((item) => item + EPSILON >= input.capacityTons).length
  const trucks = capable === 0 ? 1 : Math.min(capable, trips)
  const safeTrucks = Math.max(1, trucks)
  const safeTrips = Math.max(safeTrucks, trips)
  const days = Math.max(1, Math.ceil(safeTrips / safeTrucks))

  return {
    truckCount: safeTrucks,
    tripCount: safeTrips,
    capacityTons: input.capacityTons,
    quantityPerTrip: splitQuantity(input.quantity, safeTrips),
    durationDays: days,
    availableTrucks: capable,
  }
}

export function loadsNeeded(input: CapacityPlanInput): number {
  const maxQty = maxQuantityPerTrip(input)
  if (input.quantity <= 0 || maxQty <= 0) return 1
  return Math.ceil(input.quantity / maxQty - 1e-9)
}

export function maxQuantityPerTrip(input: {
  quantity: number
  weightTons?: number
  quantityUnit?: string | null
  capacityTons: number
}) {
  const capacityTons = input.capacityTons
  const quantity = input.quantity
  const weightTons = input.weightTons ?? 0
  if (capacityTons <= 0) return 0
  if (weightTons > 0 && quantity > 0) return (capacityTons * quantity) / weightTons
  if (quantityIsTons(input.quantityUnit)) return capacityTons
  return quantity
}

export function splitQuantity(quantity: number, trips: number) {
  if (trips <= 0 || quantity <= 0) return 0
  return Math.ceil((quantity / trips) * 100 - 1e-9) / 100
}

export function formatPlanInput(value: number) {
  if (value <= 0) return ''
  const rounded = Math.round(value * 100) / 100
  if (rounded === Math.round(rounded)) return String(Math.round(rounded))
  return rounded.toFixed(2)
}

export function assessTransportPlan(input: {
  quantity: number
  weightTons?: number
  capacityTons: number
  quantityPerTrip: number
  tripCount: number
}): TransportPlanIssue | null {
  const quantity = input.quantity
  if (quantity <= 0) return null
  const tripCount = input.tripCount
  const planned = input.quantityPerTrip * tripCount
  if (planned + EPSILON < quantity) return 'short'
  const perTrip = tripCount <= 0 ? planned : planned / tripCount
  const extra = planned - quantity
  if (extra + EPSILON >= perTrip * 0.5 && planned > quantity * 1.05) return 'overshoot'
  const weightTons = input.weightTons ?? 0
  const weightPerTrip =
    quantity > 0 && input.quantityPerTrip > 0
      ? weightTons * (input.quantityPerTrip / quantity)
      : tripCount === 0
        ? 0
        : weightTons / tripCount
  if (weightPerTrip > 0 && input.capacityTons + EPSILON < weightPerTrip) return 'capacity'
  return null
}

export function suggestionMatches(
  suggestion: TransportSuggestion,
  fields: { truckCount: number; tripCount: number; capacityTons: number; quantityPerTrip: number },
) {
  return (
    suggestion.truckCount === fields.truckCount &&
    suggestion.tripCount === fields.tripCount &&
    Math.abs(suggestion.capacityTons - fields.capacityTons) < 0.01 &&
    Math.abs(suggestion.quantityPerTrip - fields.quantityPerTrip) < 0.01
  )
}

function isBetter(candidate: TransportSuggestion, current: TransportSuggestion) {
  if (candidate.durationDays !== current.durationDays) return candidate.durationDays < current.durationDays
  if (candidate.tripCount !== current.tripCount) return candidate.tripCount < current.tripCount
  if (candidate.truckCount !== current.truckCount) return candidate.truckCount > current.truckCount
  return candidate.capacityTons > current.capacityTons
}

function quantityIsTons(raw?: string | null) {
  const key = (raw ?? '').toLowerCase().trim()
  return key === '' || key === 'ton' || key === 'tons'
}

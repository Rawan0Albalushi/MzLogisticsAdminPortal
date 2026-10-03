export const TRIP_TIMELINE = [
  'unassigned',
  'assigned',
  'arrived_at_pickup',
  'loaded',
  'in_transit',
  'arrived',
  'delivered',
  'completed',
] as const

export type TripTimelineStatus = (typeof TRIP_TIMELINE)[number]

/** Visible trip path. Intermediate statuses stay in the API, but share one step here. */
export const TRIP_STAGES = [
  { id: 'unassigned', statuses: ['unassigned'] },
  { id: 'assigned', statuses: ['assigned', 'arrived_at_pickup'] },
  { id: 'loaded', statuses: ['loaded'] },
  { id: 'in_transit', statuses: ['in_transit', 'arrived'] },
  { id: 'delivered', statuses: ['delivered', 'completed'] },
] as const

export function tripStageId(status: string): string {
  return TRIP_STAGES.find((stage) => (stage.statuses as readonly string[]).includes(status))?.id ?? status
}

/** Next statuses an operator may set. Assignment stays on the assign form, so "assigned" is omitted. */
export const TRIP_STATUS_ACTIONS: Record<string, readonly string[]> = {
  unassigned: ['cancelled'],
  assigned: ['arrived_at_pickup', 'cancelled'],
  arrived_at_pickup: ['loaded', 'cancelled'],
  loaded: ['in_transit', 'cancelled'],
  in_transit: ['arrived', 'cancelled'],
  arrived: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
}

/** Statuses to apply so the trip moves to the next visible stage. */
export function pathToNextTripStage(status: string): string[] {
  const start = tripStageId(status)
  const path: string[] = []
  let cursor = status

  while (true) {
    const next = (TRIP_STATUS_ACTIONS[cursor] ?? []).find((item) => item !== 'cancelled')
    if (!next) {
      break
    }
    path.push(next)
    if (tripStageId(next) !== start) {
      break
    }
    cursor = next
  }

  return path
}

export const ORGANIZATION_VERIFY_STATUSES = ['active', 'suspended', 'rejected'] as const

export const ORGANIZATION_LIST_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const

export const DRIVER_LIST_STATUSES = ['available', 'on_trip', 'inactive'] as const

export const TRUCK_LIST_STATUSES = ['available', 'assigned', 'maintenance', 'inactive'] as const

export const PAYMENT_METHODS = ['thawani', 'cash', 'bank_transfer'] as const

export const INVOICE_TYPES = ['customer', 'provider', 'commission'] as const

export const INVOICE_STATUSES = ['issued', 'paid', 'void'] as const

export const SETTLEMENT_STATUSES = ['pending', 'processing', 'completed'] as const

export const WALLET_TRANSACTION_TYPES = [
  'job_earning',
  'earning_released',
  'payout_reserved',
  'payout_completed',
  'payout_rejected',
  'adjustment',
] as const

export const USER_TYPES = ['platform', 'customer', 'provider', 'driver'] as const

export const ACTIVE_STATUSES = ['active', 'inactive'] as const

export const DEFAULT_CURRENCY = 'OMR'

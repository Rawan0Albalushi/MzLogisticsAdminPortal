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

export const ORGANIZATION_VERIFY_STATUSES = ['active', 'suspended', 'rejected'] as const

export const CUSTOMER_ACCOUNT_TYPES = ['individual', 'company'] as const

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

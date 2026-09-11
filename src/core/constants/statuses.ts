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

export const ORGANIZATION_VERIFY_STATUSES = ['active', 'suspended', 'rejected'] as const

export const CUSTOMER_ACCOUNT_TYPES = ['individual', 'company'] as const

export const ORGANIZATION_LIST_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const

export const DEFAULT_CURRENCY = 'OMR'

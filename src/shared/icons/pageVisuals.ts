import type { IconName } from '@/shared/icons/NavIcons.tsx'

export type IconTone = 'purple' | 'navy' | 'amber' | 'info' | 'success' | 'warning' | 'danger' | 'muted'

export interface PageVisual {
  icon: IconName
  tone: IconTone
}

export const iconTones: Partial<Record<IconName, IconTone>> = {
  dashboard: 'amber',
  shipments: 'purple',
  quotations: 'info',
  jobs: 'warning',
  trips: 'success',
  tracking: 'danger',
  customers: 'info',
  providers: 'purple',
  fleet: 'amber',
  truckTypes: 'muted',
  drivers: 'success',
  payments: 'success',
  paymentMethods: 'info',
  invoices: 'warning',
  wallets: 'amber',
  settlements: 'success',
  reports: 'info',
  users: 'purple',
  roles: 'warning',
  settings: 'muted',
  commission: 'success',
  dispatch: 'warning',
  verify: 'info',
  phone: 'info',
  email: 'purple',
  notes: 'muted',
  clock: 'warning',
  quantity: 'info',
  city: 'purple',
  pickup: 'success',
  delivery: 'danger',
}

const routeVisuals: { prefix: string; icon: IconName }[] = [
  { prefix: '/payment-methods', icon: 'paymentMethods' },
  { prefix: '/truck-types', icon: 'truckTypes' },
  { prefix: '/shipments', icon: 'shipments' },
  { prefix: '/quotations', icon: 'quotations' },
  { prefix: '/jobs', icon: 'jobs' },
  { prefix: '/trips', icon: 'trips' },
  { prefix: '/tracking', icon: 'tracking' },
  { prefix: '/customers', icon: 'customers' },
  { prefix: '/providers', icon: 'providers' },
  { prefix: '/fleet', icon: 'fleet' },
  { prefix: '/drivers', icon: 'drivers' },
  { prefix: '/payments', icon: 'payments' },
  { prefix: '/invoices', icon: 'invoices' },
  { prefix: '/wallets', icon: 'wallets' },
  { prefix: '/settlements', icon: 'settlements' },
  { prefix: '/reports', icon: 'reports' },
  { prefix: '/users', icon: 'users' },
  { prefix: '/roles', icon: 'roles' },
  { prefix: '/settings', icon: 'settings' },
]

export function toneForIcon(icon: IconName): IconTone {
  return iconTones[icon] ?? 'purple'
}

export function visualForPath(pathname: string): PageVisual {
  if (pathname === '/') {
    return { icon: 'dashboard', tone: toneForIcon('dashboard') }
  }
  const match = routeVisuals.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
  const icon = match?.icon ?? 'dashboard'
  return { icon, tone: toneForIcon(icon) }
}

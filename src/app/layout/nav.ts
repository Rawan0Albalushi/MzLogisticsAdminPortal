import { LIVE_TRACKING_ENABLED } from '@/core/constants/features.ts'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import type { IconName } from '@/shared/icons/NavIcons.tsx'

export interface NavItem {
  to: string
  labelKey: string
  permission: string
  icon: IconName
}

export interface NavGroup {
  labelKey: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    labelKey: 'nav.operations',
    items: [
      { to: '/', labelKey: 'nav.dashboard', permission: PERMISSIONS.DASHBOARD_VIEW, icon: 'dashboard' },
      { to: '/shipments', labelKey: 'nav.shipments', permission: PERMISSIONS.SHIPMENTS_VIEW, icon: 'shipments' },
      { to: '/quotations', labelKey: 'nav.quotations', permission: PERMISSIONS.QUOTATIONS_VIEW, icon: 'quotations' },
      { to: '/jobs', labelKey: 'nav.jobs', permission: PERMISSIONS.JOBS_VIEW, icon: 'jobs' },
      { to: '/trips', labelKey: 'nav.trips', permission: PERMISSIONS.TRIPS_VIEW, icon: 'trips' },
      ...(LIVE_TRACKING_ENABLED
        ? [{ to: '/tracking', labelKey: 'nav.tracking', permission: PERMISSIONS.TRACKING_VIEW, icon: 'tracking' as const }]
        : []),
    ],
  },
  {
    labelKey: 'nav.directory',
    items: [
      { to: '/customers', labelKey: 'nav.customers', permission: PERMISSIONS.CUSTOMERS_VIEW, icon: 'customers' },
      { to: '/providers', labelKey: 'nav.providers', permission: PERMISSIONS.PROVIDERS_VIEW, icon: 'providers' },
      { to: '/truck-types', labelKey: 'nav.truckTypes', permission: PERMISSIONS.FLEET_MANAGE, icon: 'truckTypes' },
      { to: '/drivers', labelKey: 'nav.drivers', permission: PERMISSIONS.DRIVERS_VIEW, icon: 'drivers' },
    ],
  },
  {
    labelKey: 'nav.finance',
    items: [
      { to: '/payments', labelKey: 'nav.payments', permission: PERMISSIONS.PAYMENTS_VIEW, icon: 'payments' },
      { to: '/payment-methods', labelKey: 'nav.paymentMethods', permission: PERMISSIONS.PAYMENTS_MANAGE, icon: 'paymentMethods' },
      { to: '/invoices', labelKey: 'nav.invoices', permission: PERMISSIONS.INVOICES_VIEW, icon: 'invoices' },
      { to: '/wallets', labelKey: 'nav.wallets', permission: PERMISSIONS.WALLETS_VIEW, icon: 'wallets' },
      { to: '/settlements', labelKey: 'nav.settlements', permission: PERMISSIONS.SETTLEMENTS_VIEW, icon: 'settlements' },
      { to: '/reports', labelKey: 'nav.reports', permission: PERMISSIONS.REPORTS_VIEW, icon: 'reports' },
    ],
  },
  {
    labelKey: 'nav.admin',
    items: [
      { to: '/users', labelKey: 'nav.users', permission: PERMISSIONS.USERS_MANAGE, icon: 'users' },
      { to: '/roles', labelKey: 'nav.roles', permission: PERMISSIONS.ROLES_MANAGE, icon: 'roles' },
    ],
  },
]

import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { icons } from '@/shared/icons/NavIcons.tsx'
import type { ReactNode } from 'react'

export interface NavItem {
  to: string
  labelKey: string
  permission: string
  icon: ReactNode
}

export interface NavGroup {
  labelKey: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    labelKey: 'nav.operations',
    items: [
      { to: '/', labelKey: 'nav.dashboard', permission: PERMISSIONS.DASHBOARD_VIEW, icon: icons.dashboard },
      { to: '/shipments', labelKey: 'nav.shipments', permission: PERMISSIONS.SHIPMENTS_VIEW, icon: icons.shipments },
      { to: '/quotations', labelKey: 'nav.quotations', permission: PERMISSIONS.QUOTATIONS_VIEW, icon: icons.quotations },
      { to: '/jobs', labelKey: 'nav.jobs', permission: PERMISSIONS.JOBS_VIEW, icon: icons.jobs },
      { to: '/trips', labelKey: 'nav.trips', permission: PERMISSIONS.TRIPS_VIEW, icon: icons.trips },
      { to: '/tracking', labelKey: 'nav.tracking', permission: PERMISSIONS.TRACKING_VIEW, icon: icons.tracking },
    ],
  },
  {
    labelKey: 'nav.directory',
    items: [
      { to: '/customers', labelKey: 'nav.customers', permission: PERMISSIONS.CUSTOMERS_VIEW, icon: icons.customers },
      { to: '/providers', labelKey: 'nav.providers', permission: PERMISSIONS.PROVIDERS_VIEW, icon: icons.providers },
      { to: '/fleet', labelKey: 'nav.fleet', permission: PERMISSIONS.FLEET_VIEW, icon: icons.fleet },
      { to: '/drivers', labelKey: 'nav.drivers', permission: PERMISSIONS.DRIVERS_VIEW, icon: icons.drivers },
    ],
  },
  {
    labelKey: 'nav.finance',
    items: [
      { to: '/payments', labelKey: 'nav.payments', permission: PERMISSIONS.PAYMENTS_VIEW, icon: icons.payments },
      { to: '/invoices', labelKey: 'nav.invoices', permission: PERMISSIONS.INVOICES_VIEW, icon: icons.invoices },
      { to: '/settlements', labelKey: 'nav.settlements', permission: PERMISSIONS.SETTLEMENTS_VIEW, icon: icons.settlements },
      { to: '/reports', labelKey: 'nav.reports', permission: PERMISSIONS.REPORTS_VIEW, icon: icons.reports },
    ],
  },
  {
    labelKey: 'nav.admin',
    items: [
      { to: '/users', labelKey: 'nav.users', permission: PERMISSIONS.USERS_MANAGE, icon: icons.users },
      { to: '/roles', labelKey: 'nav.roles', permission: PERMISSIONS.ROLES_MANAGE, icon: icons.roles },
    ],
  },
]

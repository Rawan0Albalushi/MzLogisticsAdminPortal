import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'dashboard'
  | 'customers'
  | 'providers'
  | 'fleet'
  | 'truckTypes'
  | 'drivers'
  | 'shipments'
  | 'quotations'
  | 'jobs'
  | 'trips'
  | 'tracking'
  | 'payments'
  | 'paymentMethods'
  | 'invoices'
  | 'wallets'
  | 'settlements'
  | 'reports'
  | 'users'
  | 'roles'
  | 'settings'
  | 'commission'
  | 'search'
  | 'menu'
  | 'close'
  | 'refresh'
  | 'empty'
  | 'error'
  | 'calendar'
  | 'logout'
  | 'profile'
  | 'dispatch'
  | 'verify'
  | 'phone'
  | 'email'
  | 'notes'
  | 'clock'
  | 'quantity'
  | 'city'
  | 'pickup'
  | 'delivery'
  | 'download'

function Glyph({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const glyphs: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2" />
      <rect x="13.2" y="3.2" width="7.6" height="4.6" rx="1.8" />
      <rect x="13.2" y="10" width="7.6" height="10.8" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="13.2" y="10" width="7.6" height="10.8" rx="2" />
      <rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2" />
    </>
  ),
  customers: (
    <>
      <circle cx="8.4" cy="8" r="2.8" fill="currentColor" opacity="0.16" />
      <circle cx="8.4" cy="8" r="2.8" />
      <path d="M3.6 19c.5-3.2 2.6-4.8 4.8-4.8S12.7 15.8 13.2 19" />
      <circle cx="16.6" cy="9" r="2.2" />
      <path d="M15.4 19c.3-2.2 1.6-3.5 3.4-3.7" />
    </>
  ),
  providers: (
    <>
      <path d="M4.5 20V8.2L12 3.8l7.5 4.4V20" fill="currentColor" opacity="0.14" />
      <path d="M4.5 20V8.2L12 3.8l7.5 4.4V20" />
      <path d="M9.2 20v-5.2h5.6V20" />
      <path d="M8.4 11h1.4M12 11h1.4M15.6 11H17M8.4 14.2h1.4M15.6 14.2H17" />
    </>
  ),
  fleet: (
    <>
      <path d="M3.4 15.6V8.6h10.4v7" fill="currentColor" opacity="0.16" />
      <path d="M3.4 15.6V8.6h10.4v7" />
      <path d="M13.8 11.2h3.6l3.2 3.6v0.8h-6.8" />
      <circle cx="7.2" cy="17.4" r="1.7" fill="currentColor" opacity="0.18" />
      <circle cx="7.2" cy="17.4" r="1.7" />
      <circle cx="17.2" cy="17.4" r="1.7" />
      <path d="M3.4 15.6h3.8M9 15.6h6.4" />
      <path d="M15.8 11.2v2.4h4.2" />
    </>
  ),
  truckTypes: (
    <>
      <rect x="3.4" y="4.2" width="17.2" height="5" rx="1.6" fill="currentColor" opacity="0.16" />
      <rect x="3.4" y="4.2" width="17.2" height="5" rx="1.6" />
      <rect x="3.4" y="9.6" width="17.2" height="5" rx="1.6" />
      <rect x="3.4" y="15" width="17.2" height="4.8" rx="1.6" />
      <path d="M6.4 6.7h4.2M6.4 12.1h6.2M6.4 17.4h3.4" />
    </>
  ),
  drivers: (
    <>
      <circle cx="12" cy="7.6" r="2.8" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="7.6" r="2.8" />
      <path d="M5.4 19c.9-3.4 3.2-5 6.6-5s5.7 1.6 6.6 5" />
      <circle cx="12" cy="16.4" r="3.2" />
      <path d="M10.6 16.4h2.8M12 14.8v3.2" />
    </>
  ),
  shipments: (
    <>
      <path d="M4 9.2 12 5.2 20 9.2v9.2H4z" fill="currentColor" opacity="0.16" />
      <path d="M4 9.2 12 5.2 20 9.2v9.2H4z" />
      <path d="M4 9.2h16M12 5.2v13.2" />
      <path d="M8.2 12.2h3.2" />
    </>
  ),
  quotations: (
    <>
      <path d="M7 3.6h8.2L19.4 8v12.4H7z" fill="currentColor" opacity="0.14" />
      <path d="M7 3.6h8.2L19.4 8v12.4H7z" />
      <path d="M15.2 3.6V8h4.2" />
      <path d="M10 11.4h5.4M10 14.4h5.4M10 17.4h3.2" />
    </>
  ),
  jobs: (
    <>
      <path d="M4.4 8h15.2v11.4H4.4z" fill="currentColor" opacity="0.14" />
      <path d="M8.2 8V6.2c0-.8.7-1.4 1.5-1.4h4.6c.8 0 1.5.6 1.5 1.4V8" />
      <path d="M4.4 8h15.2v11.4H4.4z" />
      <path d="M4.4 12.2h15.2" />
      <path d="M11 12.2v1.8h2v-1.8" />
    </>
  ),
  trips: (
    <>
      <circle cx="6.2" cy="7.2" r="2.1" fill="currentColor" opacity="0.16" />
      <circle cx="6.2" cy="7.2" r="2.1" />
      <circle cx="17.8" cy="16.8" r="2.1" fill="currentColor" opacity="0.16" />
      <circle cx="17.8" cy="16.8" r="2.1" />
      <path d="M8 8.2c3.4 1.2 4.6 6.8 8 7.8" />
    </>
  ),
  tracking: (
    <>
      <path d="M12 21s7.4-6.2 7.4-11.4a7.4 7.4 0 1 0-14.8 0C4.6 14.8 12 21 12 21z" fill="currentColor" opacity="0.18" />
      <path d="M12 21s7.4-6.2 7.4-11.4a7.4 7.4 0 1 0-14.8 0C4.6 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.6" fill="currentColor" opacity="0.22" />
      <circle cx="12" cy="9.8" r="2.6" />
    </>
  ),
  payments: (
    <>
      <rect x="3.2" y="6.2" width="17.6" height="11.6" rx="2.2" fill="currentColor" opacity="0.14" />
      <rect x="3.2" y="6.2" width="17.6" height="11.6" rx="2.2" />
      <path d="M3.2 10h17.6" />
      <path d="M7 14.6h4.2" />
    </>
  ),
  paymentMethods: (
    <>
      <rect x="4.4" y="4.8" width="15.2" height="9.4" rx="1.8" />
      <rect x="3.4" y="8.4" width="15.2" height="10" rx="1.8" fill="currentColor" opacity="0.14" />
      <rect x="3.4" y="8.4" width="15.2" height="10" rx="1.8" />
      <path d="M3.4 12h15.2M7 15.6h3.6" />
    </>
  ),
  invoices: (
    <>
      <path d="M7.2 3.4h8.2l3.8 3.8v13.4H7.2z" fill="currentColor" opacity="0.14" />
      <path d="M7.2 3.4h8.2l3.8 3.8v13.4H7.2z" />
      <path d="M15.4 3.4v3.8h3.8" />
      <path d="M10 11.2h7M10 14.2h7M10 17.2h4.2" />
    </>
  ),
  wallets: (
    <>
      <path d="M3.6 8.2h16.8v10.6H3.6z" fill="currentColor" opacity="0.14" />
      <rect x="3.6" y="8.2" width="16.8" height="10.6" rx="2" />
      <path d="M3.6 8.6V6.8c0-1 .8-1.6 1.7-1.6h11.4" />
      <path d="M14.2 13.6h6.2v3.4h-6.2a1.7 1.7 0 0 1 0-3.4z" fill="currentColor" opacity="0.18" />
      <path d="M14.2 13.6h6.2v3.4h-6.2a1.7 1.7 0 0 1 0-3.4z" />
    </>
  ),
  settlements: (
    <>
      <circle cx="8.4" cy="12" r="4.4" fill="currentColor" opacity="0.16" />
      <circle cx="8.4" cy="12" r="4.4" />
      <circle cx="15.6" cy="12" r="4.4" />
      <path d="M8.4 10.2v3.6M7.2 11.4h2.4c.8 0 1.4.5 1.4 1.2s-.6 1.2-1.4 1.2H7.4" />
      <path d="M15.6 10.2v3.6M14.4 11.4h2.4c.8 0 1.4.5 1.4 1.2s-.6 1.2-1.4 1.2H14.6" />
    </>
  ),
  reports: (
    <>
      <path d="M4.6 19.2V10" />
      <path d="M9.6 19.2V5.6" />
      <path d="M14.6 19.2v-8.2" />
      <path d="M19.4 19.2v-5.2" />
      <path d="M4.6 10l5-4.4 5 3.2 4.8-4" strokeWidth="1.8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="2.8" fill="currentColor" opacity="0.16" />
      <circle cx="9" cy="8" r="2.8" />
      <path d="M3.6 19c.6-3.2 2.8-5 5.4-5s4.8 1.8 5.4 5" />
      <circle cx="16.8" cy="8.4" r="2.2" />
      <path d="M20.6 19c-.4-2.2-1.8-3.6-3.6-4" />
    </>
  ),
  roles: (
    <>
      <path d="M12 3.4l8 3.6v6c0 4.4-3.3 7.6-8 8.8-4.7-1.2-8-4.4-8-8.8v-6l8-3.6z" fill="currentColor" opacity="0.14" />
      <path d="M12 3.4l8 3.6v6c0 4.4-3.3 7.6-8 8.8-4.7-1.2-8-4.4-8-8.8v-6l8-3.6z" />
      <path d="M9.3 12.2l1.9 1.9 3.8-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.2 6.2l1.5 1.5M16.3 16.3l1.5 1.5M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5" />
    </>
  ),
  commission: (
    <>
      <circle cx="12" cy="12" r="7.4" fill="currentColor" opacity="0.14" />
      <circle cx="12" cy="12" r="7.4" />
      <path d="M12 8.2v7.6M9.6 10.2c.6-1 1.6-1.5 2.4-1.5s2 .6 2 1.8-1 1.6-2.4 1.9c-1.5.3-2.6.8-2.6 2s1.2 1.8 2.6 1.8 2.1-.5 2.6-1.3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M16 16.2 20.2 20.4" />
    </>
  ),
  menu: (
    <>
      <path d="M4.4 7h15.2M4.4 12h15.2M4.4 17h15.2" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.4 12a7.4 7.4 0 1 1-2.1-5.2" />
      <path d="M19.6 4.8v4.4h-4.4" />
    </>
  ),
  empty: (
    <>
      <path d="M4.4 9.2 6.6 4.8h10.8L19.6 9.2v9.6H4.4z" fill="currentColor" opacity="0.12" />
      <path d="M4.4 9.2 6.6 4.8h10.8L19.6 9.2v9.6H4.4z" />
      <path d="M4.4 9.2h15.2" />
      <path d="M9.4 13.6h5.2" />
    </>
  ),
  error: (
    <>
      <path d="M12 4.2 20.6 19H3.4z" fill="currentColor" opacity="0.14" />
      <path d="M12 4.2 20.6 19H3.4z" />
      <path d="M12 10v4.2" />
      <path d="M12 16.6h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.6" y="5.2" width="16.8" height="15" rx="2" fill="currentColor" opacity="0.12" />
      <rect x="3.6" y="5.2" width="16.8" height="15" rx="2" />
      <path d="M3.6 9.4h16.8M8 3.8v3M16 3.8v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 12h9.2" />
      <path d="M16.2 8.4 20 12l-3.8 3.6" />
      <path d="M14 5.2H6.6A1.8 1.8 0 0 0 4.8 7v10a1.8 1.8 0 0 0 1.8 1.8H14" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="8" r="3" />
      <path d="M5.2 19c1-3.6 3.4-5.2 6.8-5.2s5.8 1.6 6.8 5.2" />
    </>
  ),
  dispatch: (
    <>
      <rect x="5.2" y="3.6" width="13.6" height="16.8" rx="2" fill="currentColor" opacity="0.14" />
      <rect x="5.2" y="3.6" width="13.6" height="16.8" rx="2" />
      <path d="M9 3.6h6v2.4H9z" />
      <path d="M8.6 11.2l1.6 1.6 3.4-3.6" />
      <path d="M8.6 15.8h6.8" />
    </>
  ),
  verify: (
    <>
      <path d="M4.6 20V8.4L12 4.2l7.4 4.2V14" fill="currentColor" opacity="0.14" />
      <path d="M4.6 20V8.4L12 4.2l7.4 4.2V14" />
      <path d="M9.2 20v-4.8h5.6V16" />
      <circle cx="17.4" cy="17.2" r="3.4" fill="currentColor" opacity="0.16" />
      <circle cx="17.4" cy="17.2" r="3.4" />
      <path d="M15.8 17.2l1.2 1.2 2.2-2.4" />
    </>
  ),
  phone: (
    <>
      <path
        d="M8.4 3.8h2.8l1.2 3.2-2.1 1.2a11.4 11.4 0 0 0 5.5 5.5l1.2-2.1 3.2 1.2v2.8c0 1.1-1.1 2.3-2.3 2.5-6.2.8-12.8-5.8-12-12 .2-1.2 1.4-2.3 2.5-2.3z"
        fill="currentColor"
        opacity="0.14"
      />
      <path d="M8.4 3.8h2.8l1.2 3.2-2.1 1.2a11.4 11.4 0 0 0 5.5 5.5l1.2-2.1 3.2 1.2v2.8c0 1.1-1.1 2.3-2.3 2.5-6.2.8-12.8-5.8-12-12 .2-1.2 1.4-2.3 2.5-2.3z" />
    </>
  ),
  email: (
    <>
      <rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2" fill="currentColor" opacity="0.14" />
      <rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2" />
      <path d="M4.2 7.2 12 12.4l7.8-5.2" />
    </>
  ),
  notes: (
    <>
      <path d="M7 3.6h8.2L19.4 8v12.4H7z" fill="currentColor" opacity="0.14" />
      <path d="M7 3.6h8.2L19.4 8v12.4H7z" />
      <path d="M15.2 3.6V8h4.2M10 11.6h5.6M10 14.8h5.6M10 18h3.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="7.6" fill="currentColor" opacity="0.14" />
      <circle cx="12" cy="12" r="7.6" />
      <path d="M12 8.2V12l2.8 2" />
    </>
  ),
  quantity: (
    <>
      <rect x="4" y="11.4" width="10.4" height="8" rx="1.6" fill="currentColor" opacity="0.16" />
      <rect x="4" y="11.4" width="10.4" height="8" rx="1.6" />
      <rect x="9.6" y="4.6" width="10.4" height="8" rx="1.6" />
    </>
  ),
  city: (
    <>
      <path d="M4.4 20V9.2h6.2V20" fill="currentColor" opacity="0.14" />
      <path d="M4.4 20V9.2h6.2V20" />
      <path d="M10.6 20V5.2h9V20" />
      <path d="M6.4 12h1.6M6.4 15h1.6M13.2 8.4h1.8M13.2 11.6h1.8M13.2 14.8h1.8" />
    </>
  ),
  pickup: (
    <>
      <path d="M12 21s6.6-5.8 6.6-10.4A6.6 6.6 0 0 0 5.4 10.6C5.4 15.2 12 21 12 21z" fill="currentColor" opacity="0.16" />
      <path d="M12 21s6.6-5.8 6.6-10.4A6.6 6.6 0 0 0 5.4 10.6C5.4 15.2 12 21 12 21z" />
      <path d="M12 13.2V7.8M9.8 9.8 12 7.6 14.2 9.8" />
    </>
  ),
  delivery: (
    <>
      <path d="M12 21s6.6-5.8 6.6-10.4A6.6 6.6 0 0 0 5.4 10.6C5.4 15.2 12 21 12 21z" fill="currentColor" opacity="0.16" />
      <path d="M12 21s6.6-5.8 6.6-10.4A6.6 6.6 0 0 0 5.4 10.6C5.4 15.2 12 21 12 21z" />
      <path d="M12 7.8v5.4M9.8 11.2 12 13.4 14.2 11.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10.4" />
      <path d="m8.4 11.2 3.6 3.6 3.6-3.6" />
      <path d="M5 17.6v1.2A1.2 1.2 0 0 0 6.2 20h11.6A1.2 1.2 0 0 0 19 18.8v-1.2" />
    </>
  ),
}

export function AppIcon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return <Glyph {...props}>{glyphs[name]}</Glyph>
}

export const icons = Object.fromEntries(
  (Object.keys(glyphs) as IconName[]).map((name) => [name, <AppIcon key={name} name={name} />]),
) as Record<IconName, ReactNode>

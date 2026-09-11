import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props} />
  )
}

export const icons = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="8" height="8" rx="1.2" />
      <rect x="13" y="3" width="8" height="5" rx="1.2" />
      <rect x="13" y="10" width="8" height="11" rx="1.2" />
      <rect x="3" y="13" width="8" height="8" rx="1.2" />
    </Icon>
  ),
  customers: (
    <Icon>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19c.6-3 2.6-4.5 5-4.5S13.4 16 14 19" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16 19c.3-2 1.5-3.2 3.2-3.5" />
    </Icon>
  ),
  providers: (
    <Icon>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-6h6v6" />
    </Icon>
  ),
  fleet: (
    <Icon>
      <path d="M3 16V9h11v7" />
      <path d="M14 12h4l3 4v0" />
      <circle cx="7.5" cy="17.5" r="1.7" />
      <circle cx="17" cy="17.5" r="1.7" />
    </Icon>
  ),
  drivers: (
    <Icon>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1-3.4 3.4-5 7-5s6 1.6 7 5" />
    </Icon>
  ),
  shipments: (
    <Icon>
      <path d="M4 7h16v11H4z" />
      <path d="M8 7V5h8v2" />
    </Icon>
  ),
  quotations: (
    <Icon>
      <path d="M7 4h10v16H7z" />
      <path d="M10 8h4M10 12h4M10 16h2" />
    </Icon>
  ),
  jobs: (
    <Icon>
      <path d="M8 7V5h8v2" />
      <path d="M5 7h14v12H5z" />
      <path d="M5 11h14" />
    </Icon>
  ),
  trips: (
    <Icon>
      <path d="M4 12h16" />
      <path d="M14 7l6 5-6 5" />
    </Icon>
  ),
  tracking: (
    <Icon>
      <circle cx="12" cy="11" r="3" />
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
    </Icon>
  ),
  payments: (
    <Icon>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18" />
    </Icon>
  ),
  invoices: (
    <Icon>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4" />
    </Icon>
  ),
  wallets: (
    <Icon>
      <rect x="3" y="7" width="18" height="12" rx="1.5" />
      <path d="M3 11h18" />
      <circle cx="16.5" cy="15" r="1.2" />
    </Icon>
  ),
  settlements: (
    <Icon>
      <path d="M4 18V6h16v12" />
      <path d="M8 14l2.5-3 2 2L16 9" />
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M5 19V9" />
      <path d="M10 19V5" />
      <path d="M15 19v-7" />
      <path d="M20 19v-4" />
    </Icon>
  ),
  users: (
    <Icon>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.7-3.2 3-5 5.5-5s4.8 1.8 5.5 5" />
      <circle cx="17" cy="8" r="2.2" />
      <path d="M21 19c-.4-2.2-1.8-3.6-3.6-4" />
    </Icon>
  ),
  roles: (
    <Icon>
      <path d="M12 3l8 4v6c0 4.2-3.2 7.4-8 8.5C7.2 20.4 4 17.2 4 13V7l8-4z" />
      <path d="M9.5 12.2l1.8 1.8 3.6-3.8" />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
    </Icon>
  ),
}

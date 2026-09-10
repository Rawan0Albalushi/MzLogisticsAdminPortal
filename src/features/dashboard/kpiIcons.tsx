import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" {...props} />
  )
}

export const kpiIcons = {
  shipment: (
    <Icon>
      <path d="M4 8h16v10H4z" />
      <path d="M8 8V6h8v2" />
    </Icon>
  ),
  quotation: (
    <Icon>
      <path d="M7 4h10v16H7z" />
      <path d="M10 8h4M10 12h4M10 16h2" />
    </Icon>
  ),
  job: (
    <Icon>
      <path d="M8 7V5h8v2" />
      <path d="M5 7h14v12H5z" />
      <path d="M5 11h14" />
    </Icon>
  ),
  trip: (
    <Icon>
      <path d="M4 12h16" />
      <path d="M14 7l6 5-6 5" />
    </Icon>
  ),
  payment: (
    <Icon>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M3 10h18" />
    </Icon>
  ),
  commission: (
    <Icon>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.8-1 1.6-2.4 1.9c-1.5.3-2.6.8-2.6 2s1.2 1.8 2.6 1.8 2.1-.5 2.6-1.3" />
    </Icon>
  ),
  settlement: (
    <Icon>
      <path d="M4 18V6h16v12" />
      <path d="M8 14l2.5-3 2 2L16 9" />
    </Icon>
  ),
  invoice: (
    <Icon>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4" />
    </Icon>
  ),
}

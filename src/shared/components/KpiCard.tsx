import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type KpiTone = 'default' | 'warning' | 'info' | 'success' | 'danger'

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  to?: string
  tone?: KpiTone
  icon?: ReactNode
}

export function KpiCard({ label, value, hint, to, tone = 'default', icon }: KpiCardProps) {
  const className = `mz-kpi mz-kpi--${tone}${to ? ' mz-kpi--link' : ''}${icon ? ' mz-kpi--has-icon' : ''}`
  const body = (
    <>
      <div className="mz-kpi__top">
        {icon ? <span className="mz-kpi__icon">{icon}</span> : null}
        <div className="mz-kpi__label">{label}</div>
      </div>
      <div className="mz-kpi__value">{value}</div>
      <div className="mz-kpi__hint">{hint ?? ' '}</div>
    </>
  )

  if (to) {
    return (
      <Link className={className} to={to}>
        {body}
      </Link>
    )
  }

  return <article className={className}>{body}</article>
}

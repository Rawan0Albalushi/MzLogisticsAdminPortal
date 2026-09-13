import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { IconWell } from '@/shared/components/IconWell.tsx'
import type { IconName } from '@/shared/icons/NavIcons.tsx'
import { visualForPath, type IconTone } from '@/shared/icons/pageVisuals.ts'

interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  crumbs?: Crumb[]
  actions?: ReactNode
  icon?: IconName
  tone?: IconTone
  hideIcon?: boolean
}

export function PageHeader({ title, subtitle, crumbs, actions, icon, tone, hideIcon }: PageHeaderProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const visual = visualForPath(location.pathname)

  return (
    <header className="mz-page-header">
      <div className="mz-page-header__lead">
        {hideIcon ? null : <IconWell name={icon ?? visual.icon} tone={tone ?? visual.tone} size="lg" />}
        <div>
          {crumbs && crumbs.length > 0 && (
            <nav className="mz-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">{t('common.breadcrumbHome')}</Link>
              {crumbs.map((crumb) => (
                <span key={`${crumb.label}-${crumb.to ?? 'current'}`}>
                  <span aria-hidden="true"> / </span>
                  {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                </span>
              ))}
            </nav>
          )}
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="mz-page-header__actions">{actions}</div> : null}
    </header>
  )
}

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  crumbs?: Crumb[]
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, crumbs, actions }: PageHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="mz-page-header">
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
      {actions ? <div className="mz-page-header__actions">{actions}</div> : null}
    </header>
  )
}

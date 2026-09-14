import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { navGroups } from '@/app/layout/nav.ts'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { initials } from '@/shared/utils/format.ts'

interface SidebarProps {
  open: boolean
  onNavigate: () => void
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuth()
  const role = user?.roles?.[0]

  return (
    <aside className={`mz-sidebar ${open ? 'is-open' : ''}`}>
      <div className="mz-sidebar__brand">
        <div className="mz-sidebar__brand-row">
          <div className="mz-mark">MZ</div>
          <div className="mz-sidebar__name">{t('app.portal')}</div>
          <button type="button" className="mz-sidebar__close" onClick={onNavigate} aria-label={t('common.closeMenu')}>
            <AppIcon name="close" width={14} height={14} />
          </button>
        </div>
      </div>
      <nav className="mz-sidebar__nav">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => hasPermission(item.permission))
          if (items.length === 0) {
            return null
          }
          return (
            <div key={group.labelKey}>
              <div className="mz-nav-group__label">{t(group.labelKey)}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `mz-nav-link${isActive ? ' is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <IconWell name={item.icon} size="sm" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
        <div>
          <div className="mz-nav-group__label">{t('nav.settings')}</div>
          <NavLink to="/settings" className={({ isActive }) => `mz-nav-link${isActive ? ' is-active' : ''}`} onClick={onNavigate}>
            <IconWell name="settings" size="sm" />
            <span>{t('nav.settings')}</span>
          </NavLink>
        </div>
      </nav>
      <div className="mz-sidebar__foot">
        <span className="mz-avatar">{initials(user?.name)}</span>
        <div>
          <div className="mz-sidebar__foot-name">{user?.name}</div>
          <div className="mz-sidebar__foot-role">{role ? t(`roles.${role}`, { defaultValue: role }) : user?.email}</div>
        </div>
      </div>
    </aside>
  )
}

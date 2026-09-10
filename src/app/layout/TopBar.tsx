import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher.tsx'
import { formatDate, initials } from '@/shared/utils/format.ts'

interface TopBarProps {
  onMenu: () => void
}

export function TopBar({ onMenu }: TopBarProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const role = user?.roles?.[0]
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [])

  return (
    <header className="mz-topbar">
      <div className="mz-topbar__start">
        <button type="button" className="mz-icon-btn" onClick={onMenu} aria-label={t('common.openMenu')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="mz-topbar__clock">
          <strong>{formatDate(new Date().toISOString())}</strong>
          <span>{t('app.portal')}</span>
        </div>
      </div>
      <div className="mz-topbar__end">
        <LanguageSwitcher />
        <div className="mz-user-menu" ref={menuRef}>
          <button
            type="button"
            className="mz-user-menu__trigger"
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="mz-avatar">{initials(user?.name)}</span>
            <span className="mz-userchip">
              <span className="mz-userchip__name">{user?.name}</span>
              <span className="mz-userchip__role">{role ? t(`roles.${role}`, { defaultValue: role }) : user?.email}</span>
            </span>
          </button>
          {open ? (
            <div className="mz-user-menu__panel" role="menu">
              <Link to="/settings" role="menuitem" onClick={() => setOpen(false)}>
                {t('common.profile')}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  void logout()
                }}
              >
                {t('common.logout')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

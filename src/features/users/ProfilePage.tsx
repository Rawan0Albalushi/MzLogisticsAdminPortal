import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { updateMe, updateMyPassword } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { displayValue, formatCommissionRate, organizationName } from '@/shared/utils/format.ts'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, setUser, hasPermission } = useAuth()
  const catalog = useCatalog()
  const canViewCommission =
    hasPermission(PERMISSIONS.PAYMENTS_VIEW) ||
    hasPermission(PERMISSIONS.PROVIDERS_VIEW) ||
    hasPermission(PERMISSIONS.SETTLEMENTS_VIEW)
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  })
  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [profileFeedback, setProfileFeedback] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setProfileFeedback('')
    try {
      const next = await updateMe({ name: profile.name.trim(), phone: profile.phone.trim() || null })
      setUser(next)
      setProfileFeedback(t('settings.profileSuccess'))
    } catch (err) {
      setProfileError(getApiMessage(err, t('settings.profileFailed')))
    } finally {
      setSavingProfile(false)
    }
  }

  async function onSavePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordError('')
    setPasswordFeedback('')
    try {
      await updateMyPassword(passwords)
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      setPasswordFeedback(t('settings.passwordSuccess'))
    } catch (err) {
      setPasswordError(getApiMessage(err, t('settings.passwordFailed')))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {canViewCommission && catalog.data?.commission_rate != null ? (
        <section className="mz-card" style={{ marginBottom: 16 }}>
          <div className="mz-card__body">
            <h2 className="mz-card__title">{t('settings.platformCommission')}</h2>
            <p style={{ color: 'var(--mz-muted)', marginBottom: 12 }}>{t('settings.platformCommissionHint')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
              {formatCommissionRate(catalog.data.commission_rate)}
            </p>
            {hasPermission(PERMISSIONS.PROVIDERS_VIEW) ? (
              <Link className="mz-link" to="/providers">
                {t('settings.platformCommissionProviders')}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasPermission(PERMISSIONS.USERS_MANAGE) || hasPermission(PERMISSIONS.ROLES_MANAGE) ? (
        <section className="mz-quick-links mz-section" style={{ marginTop: 0, marginBottom: 16 }}>
          {hasPermission(PERMISSIONS.USERS_MANAGE) ? (
            <Link className="mz-quick-link" to="/users">
              <strong>{t('users.title')}</strong>
              <span>{t('users.subtitle')}</span>
            </Link>
          ) : null}
          {hasPermission(PERMISSIONS.ROLES_MANAGE) ? (
            <Link className="mz-quick-link" to="/roles">
              <strong>{t('rolesPage.title')}</strong>
              <span>{t('rolesPage.subtitle')}</span>
            </Link>
          ) : null}
        </section>
      ) : null}

      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <h2 className="mz-card__title">{t('settings.profile')}</h2>
            {profileFeedback ? <div className="mz-alert mz-alert--ok">{profileFeedback}</div> : null}
            {profileError ? <div className="mz-alert">{profileError}</div> : null}
            <form className="mz-form" onSubmit={(event) => void onSaveProfile(event)}>
              <FormField label={t('common.name')} htmlFor="me-name" required>
                <input
                  id="me-name"
                  className="mz-input"
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </FormField>
              <FormField label={t('common.email')} htmlFor="me-email">
                <input id="me-email" className="mz-input" value={displayValue(user?.email)} disabled />
              </FormField>
              <FormField label={t('common.phone')} htmlFor="me-phone">
                <input
                  id="me-phone"
                  className="mz-input"
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                />
              </FormField>
              <FormField label={t('settings.role')} htmlFor="me-role">
                <input
                  id="me-role"
                  className="mz-input"
                  value={(user?.roles ?? []).map((role) => t(`roles.${role}`, { defaultValue: role })).join(', ')}
                  disabled
                />
              </FormField>
              <FormField label={t('settings.organization')} htmlFor="me-org">
                <input id="me-org" className="mz-input" value={organizationName(user?.organization)} disabled />
              </FormField>
              <button type="submit" className="mz-btn mz-btn--primary" disabled={savingProfile}>
                {savingProfile ? t('common.saving') : t('common.save')}
              </button>
            </form>
          </div>
        </section>

        <section className="mz-card">
          <div className="mz-card__body">
            <h2 className="mz-card__title">{t('common.language')}</h2>
            <p className="mz-login__hint">{t('settings.languageHint')}</p>
            <LanguageSwitcher />

            <h2 className="mz-card__title" style={{ marginTop: 24 }}>
              {t('settings.changePassword')}
            </h2>
            {passwordFeedback ? <div className="mz-alert mz-alert--ok">{passwordFeedback}</div> : null}
            {passwordError ? <div className="mz-alert">{passwordError}</div> : null}
            <form className="mz-form" onSubmit={(event) => void onSavePassword(event)}>
              <FormField label={t('settings.currentPassword')} htmlFor="current-password" required>
                <input
                  id="current-password"
                  className="mz-input"
                  type="password"
                  value={passwords.current_password}
                  onChange={(event) => setPasswords((current) => ({ ...current, current_password: event.target.value }))}
                  required
                />
              </FormField>
              <FormField label={t('users.newPassword')} htmlFor="new-password" required>
                <input
                  id="new-password"
                  className="mz-input"
                  type="password"
                  value={passwords.password}
                  onChange={(event) => setPasswords((current) => ({ ...current, password: event.target.value }))}
                  required
                  minLength={8}
                />
              </FormField>
              <FormField label={t('users.confirmPassword')} htmlFor="confirm-password" required>
                <input
                  id="confirm-password"
                  className="mz-input"
                  type="password"
                  value={passwords.password_confirmation}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, password_confirmation: event.target.value }))
                  }
                  required
                  minLength={8}
                />
              </FormField>
              <button type="submit" className="mz-btn mz-btn--accent" disabled={savingPassword}>
                {savingPassword ? t('common.saving') : t('settings.changePassword')}
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}

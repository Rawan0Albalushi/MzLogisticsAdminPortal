import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { getApiMessage } from '@/core/api/client.ts'
import { FormField } from '@/shared/components/FormField.tsx'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher.tsx'

const DEMO_ACCOUNTS = [
  'superadmin@mzlogistics.om',
  'operations@mzlogistics.om',
  'finance@mzlogistics.om',
  'support@mzlogistics.om',
]

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [email, setEmail] = useState('superadmin@mzlogistics.om')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(getApiMessage(err, t('auth.failed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mz-login">
      <section className="mz-login__brand">
        <div>
          <div className="mz-mark">MZ</div>
          <p className="mz-hero__kicker">{t('app.portal')}</p>
          <h1>{t('app.name')}</h1>
          <p>{t('app.tagline')}</p>
        </div>
        <ul className="mz-login__points">
          <li>{t('dashboard.shipmentsOpen')}</li>
          <li>{t('nav.tracking')}</li>
          <li>{t('nav.settlements')}</li>
        </ul>
      </section>
      <section className="mz-login__panel">
        <div className="mz-login__card">
          <div className="mz-login__lang">
            <LanguageSwitcher />
          </div>
          <h2>{t('auth.title')}</h2>
          <p className="mz-login__hint">{t('auth.subtitle')}</p>
          <form className="mz-form" onSubmit={(event) => void onSubmit(event)}>
            {error ? <div className="mz-alert">{error}</div> : null}
            <FormField label={t('auth.email')} htmlFor="email" required>
              <input
                id="email"
                className="mz-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </FormField>
            <FormField label={t('auth.password')} htmlFor="password" required>
              <input
                id="password"
                className="mz-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </FormField>
            <button type="submit" className="mz-btn mz-btn--primary" disabled={busy}>
              {busy ? t('auth.submitting') : t('auth.submit')}
            </button>
          </form>
          <div className="mz-demo">
            <strong>{t('auth.demoTitle')}</strong>
            <p style={{ marginTop: 6 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <span key={account}>
                  <code>{account}</code>
                  <br />
                </span>
              ))}
            </p>
            <p style={{ marginTop: 8 }}>
              {t('auth.demoPassword')}: <code>Password123!</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { getApiMessage } from '@/core/api/client.ts'
import { FormField } from '@/shared/components/FormField.tsx'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'

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
        <div className="mz-login__brand-copy">
          <div className="mz-login__brand-head">
            <div className="mz-mark">MZ</div>
            <h1>{t('app.portal')}</h1>
          </div>
          <p>{t('app.tagline')}</p>
        </div>
        <ul className="mz-login__points">
          <li>
            <IconWell name="shipments" size="sm" />
            <span>{t('dashboard.shipmentsOpen')}</span>
          </li>
          <li>
            <IconWell name="trips" size="sm" />
            <span>{t('nav.trips')}</span>
          </li>
          <li>
            <IconWell name="settlements" size="sm" />
            <span>{t('nav.settlements')}</span>
          </li>
        </ul>
      </section>
      <section className="mz-login__panel">
        <div className="mz-login__card">
          <div className="mz-login__card-head">
            <h2>{t('auth.title')}</h2>
            <div className="mz-login__lang">
              <LanguageSwitcher />
            </div>
            <p className="mz-login__hint">{t('auth.subtitle')}</p>
          </div>
          <form className="mz-form mz-login__form" onSubmit={(event) => void onSubmit(event)}>
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
            <button type="submit" className="mz-btn mz-btn--primary mz-login__submit" disabled={busy}>
              {busy ? t('auth.submitting') : t('auth.submit')}
            </button>
          </form>
          <div className="mz-demo">
            <strong>{t('auth.demoTitle')}</strong>
            <ul className="mz-demo__accounts">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account}>
                  <code>{account}</code>
                </li>
              ))}
            </ul>
            <p className="mz-demo__password">
              <span>{t('auth.demoPassword')}</span>
              <code>Password123!</code>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

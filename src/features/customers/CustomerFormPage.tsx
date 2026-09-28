import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createCustomer } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FormField } from '@/shared/components/FormField.tsx'

const emptyForm = {
  account_type: 'company' as 'individual' | 'company',
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  locale: 'ar',
  company_name: '',
  company_name_ar: '',
  city: '',
  country: 'OM',
  address: '',
}

export function CustomerFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const isCompany = form.account_type === 'company'

  const save = useMutation({
    mutationFn: () =>
      createCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
        locale: form.locale,
        account_type: form.account_type,
        company_name: isCompany ? form.company_name.trim() : undefined,
        company_name_ar: isCompany ? form.company_name_ar.trim() || undefined : undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        address: form.address.trim() || undefined,
      }),
    onSuccess: async (organization) => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
      navigate(`/customers/${organization.id}`, { replace: true })
    },
    onError: (err) => setError(getApiMessage(err, t('customers.createFailed'))),
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('customers.create')}
        subtitle={t('customers.createHint')}
        crumbs={[{ label: t('customers.title'), to: '/customers' }, { label: t('customers.create') }]}
      />
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}
      <section className="mz-card">
        <div className="mz-card__body">
          <form className="mz-form" onSubmit={onSubmit}>
            <FormField label={t('customers.accountType')} htmlFor="customer-account-type" required>
              <select
                id="customer-account-type"
                className="mz-select"
                value={form.account_type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    account_type: event.target.value === 'individual' ? 'individual' : 'company',
                  }))
                }
              >
                <option value="company">{t('status.company')}</option>
                <option value="individual">{t('status.individual')}</option>
              </select>
            </FormField>
            <FormField label={t('common.language')} htmlFor="customer-locale">
              <select
                id="customer-locale"
                className="mz-select"
                value={form.locale}
                onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
              >
                <option value="ar">{t('common.arabic')}</option>
                <option value="en">{t('common.english')}</option>
              </select>
            </FormField>
            <FormField label={t('customers.contactName')} htmlFor="customer-name" required>
              <input
                id="customer-name"
                className="mz-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('common.phone')} htmlFor="customer-phone">
              <input
                id="customer-phone"
                className="mz-input"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.email')} htmlFor="customer-email" required hint={t('customers.passwordHint')}>
              <input
                id="customer-email"
                className="mz-input"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                autoComplete="off"
              />
            </FormField>
            <FormField label={t('auth.password')} htmlFor="customer-password" required>
              <input
                id="customer-password"
                className="mz-input"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label={t('users.confirmPassword')} htmlFor="customer-password-confirm" required>
              <input
                id="customer-password-confirm"
                className="mz-input"
                type="password"
                value={form.password_confirmation}
                onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>
            {isCompany ? (
              <>
                <FormField label={t('customers.companyName')} htmlFor="customer-company" required>
                  <input
                    id="customer-company"
                    className="mz-input"
                    value={form.company_name}
                    onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                    required
                  />
                </FormField>
                <FormField label={t('customers.companyNameAr')} htmlFor="customer-company-ar">
                  <input
                    id="customer-company-ar"
                    className="mz-input"
                    value={form.company_name_ar}
                    onChange={(event) => setForm((current) => ({ ...current, company_name_ar: event.target.value }))}
                  />
                </FormField>
              </>
            ) : null}
            <FormField label={t('common.city')} htmlFor="customer-city">
              <input
                id="customer-city"
                className="mz-input"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.country')} htmlFor="customer-country" hint={t('customers.countryHint')}>
              <input
                id="customer-country"
                className="mz-input"
                value={form.country}
                maxLength={2}
                onChange={(event) => setForm((current) => ({ ...current, country: event.target.value.toUpperCase() }))}
              />
            </FormField>
            <FormField label={t('common.address')} htmlFor="customer-address">
              <textarea
                id="customer-address"
                className="mz-input mz-textarea"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                rows={3}
              />
            </FormField>
            <div className="mz-form-actions">
              <button type="submit" className="mz-btn mz-btn--primary" disabled={save.isPending}>
                {save.isPending ? t('common.saving') : t('customers.create')}
              </button>
              <Link className="mz-btn mz-btn--ghost" to="/customers">
                {t('common.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

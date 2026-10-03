import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createProvider } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FormField } from '@/shared/components/FormField.tsx'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  locale: 'ar',
  company_name: '',
  company_name_ar: '',
  commercial_register: '',
  tax_number: '',
  city: '',
  country: 'OM',
  address: '',
}

export function ProviderFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: () =>
      createProvider({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
        locale: form.locale,
        company_name: form.company_name.trim(),
        company_name_ar: form.company_name_ar.trim() || undefined,
        commercial_register: form.commercial_register.trim() || undefined,
        tax_number: form.tax_number.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        address: form.address.trim() || undefined,
      }),
    onSuccess: async (organization) => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] })
      navigate(`/providers/${organization.id}`, { replace: true })
    },
    onError: (err) => setError(getApiMessage(err, t('providers.createFailed'))),
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('providers.create')}
        subtitle={t('providers.createHint')}
        crumbs={[{ label: t('providers.title'), to: '/providers' }, { label: t('providers.create') }]}
      />
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}
      <section className="mz-card">
        <div className="mz-card__body">
          <form className="mz-form" onSubmit={onSubmit}>
            <FormField label={t('customers.companyName')} htmlFor="provider-company" required>
              <input
                id="provider-company"
                className="mz-input"
                value={form.company_name}
                onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('customers.companyNameAr')} htmlFor="provider-company-ar">
              <input
                id="provider-company-ar"
                className="mz-input"
                value={form.company_name_ar}
                onChange={(event) => setForm((current) => ({ ...current, company_name_ar: event.target.value }))}
              />
            </FormField>
            <FormField label={t('customers.commercialRegister')} htmlFor="provider-cr">
              <input
                id="provider-cr"
                className="mz-input"
                value={form.commercial_register}
                onChange={(event) => setForm((current) => ({ ...current, commercial_register: event.target.value }))}
              />
            </FormField>
            <FormField label={t('customers.taxNumber')} htmlFor="provider-tax">
              <input
                id="provider-tax"
                className="mz-input"
                value={form.tax_number}
                onChange={(event) => setForm((current) => ({ ...current, tax_number: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.language')} htmlFor="provider-locale">
              <select
                id="provider-locale"
                className="mz-select"
                value={form.locale}
                onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
              >
                <option value="ar">{t('common.arabic')}</option>
                <option value="en">{t('common.english')}</option>
              </select>
            </FormField>
            <FormField label={t('customers.contactName')} htmlFor="provider-name" required>
              <input
                id="provider-name"
                className="mz-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('common.phone')} htmlFor="provider-phone">
              <input
                id="provider-phone"
                className="mz-input"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.email')} htmlFor="provider-email" required hint={t('providers.passwordHint')}>
              <input
                id="provider-email"
                className="mz-input"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                autoComplete="off"
              />
            </FormField>
            <FormField label={t('auth.password')} htmlFor="provider-password" required>
              <input
                id="provider-password"
                className="mz-input"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label={t('users.confirmPassword')} htmlFor="provider-password-confirm" required>
              <input
                id="provider-password-confirm"
                className="mz-input"
                type="password"
                value={form.password_confirmation}
                onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label={t('common.city')} htmlFor="provider-city">
              <input
                id="provider-city"
                className="mz-input"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.country')} htmlFor="provider-country" hint={t('customers.countryHint')}>
              <input
                id="provider-country"
                className="mz-input"
                value={form.country}
                maxLength={2}
                onChange={(event) => setForm((current) => ({ ...current, country: event.target.value.toUpperCase() }))}
              />
            </FormField>
            <FormField label={t('common.address')} htmlFor="provider-address">
              <textarea
                id="provider-address"
                className="mz-input mz-textarea"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                rows={3}
              />
            </FormField>
            <div className="mz-form-actions">
              <button type="submit" className="mz-btn mz-btn--primary" disabled={save.isPending}>
                {save.isPending ? t('common.saving') : t('providers.create')}
              </button>
              <Link className="mz-btn mz-btn--ghost" to="/providers">
                {t('common.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

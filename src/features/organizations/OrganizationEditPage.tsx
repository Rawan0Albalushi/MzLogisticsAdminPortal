import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchOrganization, updateOrganization } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { UpdateOrganizationInput } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { enumString, isCustomerOrganization, organizationName } from '@/shared/utils/format.ts'

type OrganizationKind = 'customer' | 'provider'

const emptyForm = {
  name: '',
  name_ar: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  commercial_register: '',
  tax_number: '',
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function OrganizationEditPage({ kind }: { kind: OrganizationKind }) {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listPath = kind === 'customer' ? '/customers' : '/providers'
  const query = useQuery({
    queryKey: ['organization', id],
    queryFn: () => fetchOrganization(id),
    enabled: Boolean(id),
  })
  const [form, setForm] = useState(emptyForm)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query.data || ready) {
      return
    }
    const org = query.data
    setForm({
      name: org.name ?? '',
      name_ar: org.name_ar ?? '',
      email: org.email ?? '',
      phone: org.phone ?? '',
      city: org.city ?? '',
      address: org.address ?? '',
      commercial_register: org.commercial_register ?? '',
      tax_number: org.tax_number ?? '',
    })
    setReady(true)
  }, [query.data, ready])

  const save = useMutation({
    mutationFn: () => {
      const payload: UpdateOrganizationInput = {
        name: form.name.trim(),
        name_ar: blankToNull(form.name_ar),
        email: blankToNull(form.email),
        phone: blankToNull(form.phone),
        city: blankToNull(form.city),
        address: blankToNull(form.address),
        commercial_register: blankToNull(form.commercial_register),
        tax_number: blankToNull(form.tax_number),
      }
      return updateOrganization(id, payload)
    },
    onSuccess: async (organization) => {
      await queryClient.invalidateQueries({ queryKey: ['organization', id] })
      await queryClient.invalidateQueries({ queryKey: [kind === 'customer' ? 'customers' : 'providers'] })
      navigate(`${listPath}/${organization.id}`, { replace: true })
    },
    onError: (err) => setError(getApiMessage(err, t(`${kind === 'customer' ? 'customers' : 'providers'}.updateFailed`))),
  })

  if (query.isLoading || (query.data && !ready)) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const org = query.data
  const matchesKind = kind === 'customer' ? isCustomerOrganization(org) || !enumString(org.type) : enumString(org.type) === 'provider'
  if (!matchesKind) {
    const target = enumString(org.type) === 'provider' ? `/providers/${org.id}` : `/customers/${org.id}`
    return <Navigate to={target} replace />
  }

  const titleKey = kind === 'customer' ? 'customers' : 'providers'
  const name = organizationName(org)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    save.mutate()
  }

  return (
    <>
      <PageHeader
        title={t(`${titleKey}.edit`)}
        subtitle={t(`${titleKey}.editHint`)}
        crumbs={[
          { label: t(`${titleKey}.title`), to: listPath },
          { label: name, to: `${listPath}/${org.id}` },
          { label: t('common.edit') },
        ]}
      />
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}
      <section className="mz-card">
        <div className="mz-card__body">
          <form className="mz-form" onSubmit={onSubmit}>
            <FormField label={t('customers.companyName')} htmlFor="org-name" required>
              <input
                id="org-name"
                className="mz-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </FormField>
            <FormField label={t('customers.companyNameAr')} htmlFor="org-name-ar">
              <input
                id="org-name-ar"
                className="mz-input"
                dir="rtl"
                value={form.name_ar}
                onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.email')} htmlFor="org-email">
              <input
                id="org-email"
                className="mz-input"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                autoComplete="off"
              />
            </FormField>
            <FormField label={t('common.phone')} htmlFor="org-phone">
              <input
                id="org-phone"
                className="mz-input"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.city')} htmlFor="org-city">
              <input
                id="org-city"
                className="mz-input"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </FormField>
            <FormField label={t('common.address')} htmlFor="org-address">
              <textarea
                id="org-address"
                className="mz-input mz-textarea"
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                rows={3}
              />
            </FormField>
            <FormField label={t('customers.commercialRegister')} htmlFor="org-cr">
              <input
                id="org-cr"
                className="mz-input"
                value={form.commercial_register}
                onChange={(event) => setForm((current) => ({ ...current, commercial_register: event.target.value }))}
              />
            </FormField>
            <FormField label={t('customers.taxNumber')} htmlFor="org-tax">
              <input
                id="org-tax"
                className="mz-input"
                value={form.tax_number}
                onChange={(event) => setForm((current) => ({ ...current, tax_number: event.target.value }))}
              />
            </FormField>
            <div className="mz-form-actions">
              <button type="submit" className="mz-btn mz-btn--primary" disabled={save.isPending}>
                {save.isPending ? t('common.saving') : t('common.save')}
              </button>
              <Link className="mz-btn mz-btn--ghost" to={`${listPath}/${org.id}`}>
                {t('common.cancel')}
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}

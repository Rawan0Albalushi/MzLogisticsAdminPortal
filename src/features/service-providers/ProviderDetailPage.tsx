import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrganization, verifyOrganization } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { ORGANIZATION_VERIFY_STATUSES } from '@/core/constants/statuses.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'

function ContactValue({ value, href }: { value?: string | null; href: string }) {
  if (!value) {
    return displayValue(null)
  }

  return (
    <a className="mz-link" href={href}>
      {value}
    </a>
  )
}

export function ProviderDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['organization', id], queryFn: () => fetchOrganization(id), enabled: Boolean(id) })
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => verifyOrganization(id, { status, verification_notes: notes }),
    onSuccess: async () => {
      setFeedback(t('providers.verifySuccess'))
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['organization', id] })
      await queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('providers.verifyFailed')))
    },
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const org = query.data
  const primaryName = organizationName(org)
  const secondaryName = i18n.language.startsWith('ar')
    ? org.name && org.name !== primaryName
      ? org.name
      : null
    : org.name_ar && org.name_ar !== primaryName
      ? org.name_ar
      : null

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={primaryName}
        subtitle={t('providers.detailTitle')}
        crumbs={[{ label: t('providers.title'), to: '/providers' }, { label: primaryName }]}
        actions={
          <>
            {hasPermission(PERMISSIONS.PROVIDERS_MANAGE) ? (
              <Link className="mz-btn mz-btn--ghost" to={`/providers/${org.id}/edit`}>
                {t('common.edit')}
              </Link>
            ) : null}
            <StatusBadge status={org.status} />
          </>
        }
      />
      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="providers" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{primaryName}</h2>
                {secondaryName ? <p className="mz-profile__aka">{secondaryName}</p> : null}
                <div className="mz-profile__contacts">
                  <StatusBadge status={org.status} />
                  {org.email ? (
                    <a className="mz-profile__chip" href={`mailto:${org.email}`} dir="ltr">
                      <AppIcon name="email" />
                      {org.email}
                    </a>
                  ) : null}
                  {org.phone ? (
                    <a className="mz-profile__chip" href={`tel:${org.phone}`} dir="ltr">
                      <AppIcon name="phone" />
                      {org.phone}
                    </a>
                  ) : null}
                  {org.city ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="city" />
                      {org.city}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="phone" title={t('customers.contactSection')} />
            <InfoGrid
              variant="contact"
              fields={[
                {
                  icon: 'email',
                  label: t('common.email'),
                  value: org.email ? <ContactValue value={org.email} href={`mailto:${org.email}`} /> : null,
                  dir: 'ltr',
                  singleLine: true,
                },
                {
                  icon: 'phone',
                  label: t('common.phone'),
                  value: org.phone ? <ContactValue value={org.phone} href={`tel:${org.phone}`} /> : null,
                  dir: 'ltr',
                },
                { icon: 'city', label: t('common.city'), value: org.city },
                { icon: 'tracking', label: t('common.country'), value: org.country },
                { icon: 'city', label: t('common.address'), value: org.address, wide: true },
              ]}
            />
          </div>
        </section>
        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="providers" title={t('customers.companySection')} />
              <InfoGrid
                fields={[
                  { icon: 'invoices', label: t('customers.commercialRegister'), value: org.commercial_register, dir: 'ltr' },
                  { icon: 'quotations', label: t('customers.taxNumber'), value: org.tax_number, dir: 'ltr' },
                  { icon: 'calendar', label: t('common.createdAt'), value: formatDate(org.created_at) },
                  { icon: 'notes', label: t('common.notes'), value: org.verification_notes, wide: true },
                ]}
              />
            </div>
          </section>
          {hasPermission(PERMISSIONS.PROVIDERS_VERIFY) ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="verify" title={t('providers.verifyTitle')} />
                <p className="mz-notes" style={{ color: 'var(--mz-muted)', marginBottom: 12 }}>
                  {t('providers.verifyHint')}
                </p>
                <form className="mz-form" onSubmit={onSubmit}>
                  {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
                  {error ? <div className="mz-alert">{error}</div> : null}
                  <FormField label={t('providers.newStatus')} htmlFor="verify-status" required>
                    <select id="verify-status" className="mz-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                      {ORGANIZATION_VERIFY_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {t(`status.${value}`)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label={t('providers.verificationNotes')} htmlFor="verify-notes">
                    <textarea id="verify-notes" className="mz-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
                  </FormField>
                  <button type="submit" className="mz-btn mz-btn--primary" disabled={mutation.isPending}>
                    {mutation.isPending ? t('providers.verifying') : t('providers.submitVerify')}
                  </button>
                </form>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}

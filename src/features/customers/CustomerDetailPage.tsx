import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrganization } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { displayValue, enumString, formatDate, initials, isCustomerOrganization, organizationName } from '@/shared/utils/format.ts'

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

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const query = useQuery({ queryKey: ['organization', id], queryFn: () => fetchOrganization(id), enabled: Boolean(id) })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const org = query.data
  const accountType = enumString(org.account_type)
  const isCompany = accountType === 'company'
  const primaryName = organizationName(org)
  const secondaryName = i18n.language.startsWith('ar')
    ? org.name && org.name !== primaryName
      ? org.name
      : null
    : org.name_ar && org.name_ar !== primaryName
      ? org.name_ar
      : null

  if (enumString(org.type) === 'provider') {
    return <Navigate to={`/providers/${org.id}`} replace />
  }

  if (enumString(org.type) && !isCustomerOrganization(org)) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  return (
    <>
      <PageHeader
        title={primaryName}
        subtitle={t('customers.detailTitle')}
        crumbs={[{ label: t('customers.title'), to: '/customers' }, { label: primaryName }]}
        actions={
          <>
            <StatusBadge status={accountType} />
            <StatusBadge status={org.status} />
          </>
        }
      />
      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <div className="mz-avatar mz-avatar--lg" aria-hidden>
                {initials(primaryName)}
              </div>
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{primaryName}</h2>
                {secondaryName ? <p className="mz-profile__aka">{secondaryName}</p> : null}
                <div className="mz-profile__contacts">
                  {org.email ? (
                    <a className="mz-profile__chip" href={`mailto:${org.email}`} dir="ltr">
                      {org.email}
                    </a>
                  ) : null}
                  {org.phone ? (
                    <a className="mz-profile__chip" href={`tel:${org.phone}`} dir="ltr">
                      {org.phone}
                    </a>
                  ) : null}
                  {org.city ? <span className="mz-profile__chip">{org.city}</span> : null}
                </div>
              </div>
            </div>
            <h2 className="mz-card__title">{t('customers.contactSection')}</h2>
            <InfoGrid
              fields={[
                {
                  label: t('common.email'),
                  value: org.email ? <ContactValue value={org.email} href={`mailto:${org.email}`} /> : null,
                  dir: 'ltr',
                },
                {
                  label: t('common.phone'),
                  value: org.phone ? <ContactValue value={org.phone} href={`tel:${org.phone}`} /> : null,
                  dir: 'ltr',
                },
                { label: t('common.city'), value: org.city },
                { label: t('common.country'), value: org.country },
                { label: t('common.address'), value: org.address, wide: true },
              ]}
            />
          </div>
        </section>
        <div className="mz-stack">
          {isCompany ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <h2 className="mz-card__title">{t('customers.companySection')}</h2>
                <InfoGrid
                  fields={[
                    { label: t('customers.commercialRegister'), value: org.commercial_register, dir: 'ltr' },
                    { label: t('customers.taxNumber'), value: org.tax_number, dir: 'ltr' },
                  ]}
                />
              </div>
            </section>
          ) : null}
          <section className="mz-card">
            <div className="mz-card__body">
              <h2 className="mz-card__title">{t('customers.accountSection')}</h2>
              <InfoGrid
                fields={[
                  { label: t('common.name'), value: org.name, dir: org.name && /[A-Za-z]/.test(org.name) ? 'ltr' : undefined },
                  { label: t('customers.nameAr'), value: org.name_ar },
                  { label: t('customers.accountType'), value: <StatusBadge status={accountType} /> },
                  { label: t('common.status'), value: <StatusBadge status={org.status} /> },
                  { label: t('common.createdAt'), value: formatDate(org.created_at) },
                ]}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

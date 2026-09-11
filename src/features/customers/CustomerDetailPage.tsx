import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrganization } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { displayValue, enumString, formatDate, isCustomerOrganization, organizationName } from '@/shared/utils/format.ts'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
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

  if (enumString(org.type) === 'provider') {
    return <Navigate to={`/providers/${org.id}`} replace />
  }

  if (enumString(org.type) && !isCustomerOrganization(org)) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  return (
    <>
      <PageHeader
        title={organizationName(org)}
        subtitle={t('customers.detailTitle')}
        crumbs={[{ label: t('customers.title'), to: '/customers' }, { label: organizationName(org) }]}
        actions={
          <>
            <StatusBadge status={accountType} />
            <StatusBadge status={org.status} />
          </>
        }
      />
      <section className="mz-card">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('customers.accountType'), value: <StatusBadge status={accountType} /> },
              { label: t('common.status'), value: <StatusBadge status={org.status} /> },
              { label: t('common.email'), value: displayValue(org.email) },
              { label: t('common.phone'), value: displayValue(org.phone) },
              { label: t('common.city'), value: displayValue(org.city) },
              { label: t('common.address'), value: displayValue(org.address) },
              ...(isCompany
                ? [
                    { label: t('customers.commercialRegister'), value: displayValue(org.commercial_register) },
                    { label: t('customers.taxNumber'), value: displayValue(org.tax_number) },
                  ]
                : []),
              { label: t('common.createdAt'), value: formatDate(org.created_at) },
            ]}
          />
        </div>
      </section>
    </>
  )
}

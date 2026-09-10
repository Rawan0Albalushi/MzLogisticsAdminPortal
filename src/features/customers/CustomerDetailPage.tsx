import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrganization } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'

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

  return (
    <>
      <PageHeader
        title={organizationName(org)}
        subtitle={t('customers.detailTitle')}
        crumbs={[{ label: t('customers.title'), to: '/customers' }, { label: organizationName(org) }]}
      />
      <section className="mz-card">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('common.status'), value: <StatusBadge status={org.status} /> },
              { label: t('common.email'), value: displayValue(org.email) },
              { label: t('common.phone'), value: displayValue(org.phone) },
              { label: t('common.city'), value: displayValue(org.city) },
              { label: t('common.address'), value: displayValue(org.address) },
              { label: t('customers.commercialRegister'), value: displayValue(org.commercial_register) },
              { label: t('customers.taxNumber'), value: displayValue(org.tax_number) },
              { label: t('customers.accountType'), value: org.account_type ? t(`status.${org.account_type}`) : t('common.noValue') },
              { label: t('common.createdAt'), value: formatDate(org.created_at) },
            ]}
          />
        </div>
      </section>
    </>
  )
}

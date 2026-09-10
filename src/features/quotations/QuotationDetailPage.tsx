import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchQuotation } from '@/core/api/services.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { displayValue, formatDate, formatMoney, organizationName } from '@/shared/utils/format.ts'

export function QuotationDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ['quotation', id], queryFn: () => fetchQuotation(id), enabled: Boolean(id) })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const quotation = query.data

  return (
    <>
      <PageHeader
        title={quotation.reference}
        subtitle={t('quotations.detailTitle')}
        crumbs={[{ label: t('quotations.title'), to: '/quotations' }, { label: quotation.reference }]}
      />
      <section className="mz-card">
        <div className="mz-card__body">
          <DetailList
            items={[
              { label: t('common.status'), value: <StatusBadge status={quotation.status} /> },
              { label: t('common.provider'), value: organizationName(quotation.provider) },
              {
                label: t('common.shipment'),
                value: quotation.shipment ? (
                  <Link className="mz-link" to={`/shipments/${quotation.shipment.id}`}>
                    {quotation.shipment.reference}
                  </Link>
                ) : (
                  t('common.noValue')
                ),
              },
              { label: t('quotations.price'), value: formatMoney(quotation.total_price, quotation.currency ?? undefined) },
              { label: t('quotations.truckCount'), value: displayValue(quotation.truck_count) },
              { label: t('quotations.truckType'), value: quotation.truck_type ? t(`status.${quotation.truck_type}`, { defaultValue: quotation.truck_type }) : t('common.noValue') },
              { label: t('quotations.truckCapacity'), value: displayValue(quotation.truck_capacity_tons) },
              { label: t('quotations.tripCount'), value: displayValue(quotation.trip_count) },
              { label: t('quotations.quantityPerTrip'), value: displayValue(quotation.quantity_per_trip) },
              { label: t('quotations.duration'), value: displayValue(quotation.duration_days) },
              { label: t('quotations.additionalCosts'), value: formatMoney(quotation.additional_costs, quotation.currency ?? undefined) },
              { label: t('quotations.validUntil'), value: formatDate(quotation.valid_until) },
              { label: t('quotations.conditions'), value: displayValue(quotation.conditions) },
            ]}
          />
        </div>
      </section>
    </>
  )
}

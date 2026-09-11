import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchDashboard, fetchJobs, fetchPayments, fetchShipments } from '@/core/api/services.ts'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { KpiCard } from '@/shared/components/KpiCard.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { formatMoney, formatNumber, organizationName } from '@/shared/utils/format.ts'

export function ReportsPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })
  const shipments = useQuery({
    queryKey: ['reports', 'shipments'],
    queryFn: () => fetchShipments({ page: 1, per_page: 6 }),
    enabled: hasPermission(PERMISSIONS.SHIPMENTS_VIEW),
  })
  const jobs = useQuery({
    queryKey: ['reports', 'jobs'],
    queryFn: () => fetchJobs({ page: 1, per_page: 6 }),
    enabled: hasPermission(PERMISSIONS.JOBS_VIEW),
  })
  const payments = useQuery({
    queryKey: ['reports', 'payments'],
    queryFn: () => fetchPayments({ page: 1, per_page: 6 }),
    enabled: hasPermission(PERMISSIONS.PAYMENTS_VIEW),
  })

  if (dashboard.isLoading) {
    return <LoadingState />
  }

  if (dashboard.isError || !dashboard.data) {
    return <ErrorState onRetry={() => void dashboard.refetch()} />
  }

  const stats = dashboard.data

  return (
    <>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <h2 className="mz-section-label">{t('reports.operations')}</h2>
      <div className="mz-kpi-grid">
        <KpiCard label={t('dashboard.shipmentsOpen')} value={formatNumber(stats.shipments_open)} to="/shipments?status=published" />
        <KpiCard label={t('dashboard.shipmentsTotal')} value={formatNumber(stats.shipments_total)} to="/shipments" />
        <KpiCard label={t('dashboard.quotationsPending')} value={formatNumber(stats.quotations_pending)} to="/quotations?status=submitted" tone="warning" />
        <KpiCard label={t('dashboard.jobsActive')} value={formatNumber(stats.jobs_active)} to="/jobs" />
        <KpiCard label={t('dashboard.tripsInTransit')} value={formatNumber(stats.trips_in_transit)} to="/tracking" tone="info" />
      </div>
      <h2 className="mz-section-label">{t('reports.finance')}</h2>
      <div className="mz-kpi-grid">
        <KpiCard label={t('dashboard.paymentsCompleted')} value={formatMoney(stats.payments_completed_amount)} to="/payments" tone="success" />
        <KpiCard label={t('dashboard.commission')} value={formatMoney(stats.commission_amount)} to="/payments" />
        <KpiCard label={t('dashboard.providerReceivable')} value={formatMoney(stats.provider_receivable)} to="/wallets" />
        <KpiCard label={t('dashboard.walletAvailable')} value={formatMoney(stats.wallet_available ?? 0)} to="/wallets" />
        <KpiCard label={t('dashboard.invoices')} value={formatNumber(stats.invoices_count)} to="/invoices" />
        <KpiCard
          label={t('dashboard.invoicesUnpaid')}
          value={formatNumber(stats.invoices_unpaid ?? 0)}
          to="/invoices?status=issued"
          tone={(stats.invoices_unpaid ?? 0) > 0 ? 'warning' : 'default'}
        />
      </div>

      <section className="mz-queue-grid mz-section">
        {hasPermission(PERMISSIONS.SHIPMENTS_VIEW) ? (
          <article className="mz-card">
            <div className="mz-card__body">
              <div className="mz-card__head">
                <h3 className="mz-card__title">{t('reports.recentShipments')}</h3>
                <Link className="mz-link" to="/shipments">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              {shipments.isError ? (
                <ErrorState onRetry={() => void shipments.refetch()} />
              ) : (
                <ul className="mz-queue-list">
                  {(shipments.data?.items ?? []).map((item) => (
                    <li key={item.id}>
                      <div className="mz-queue-list__meta">
                        <Link className="mz-link" to={`/shipments/${item.id}`}>
                          {item.reference}
                        </Link>
                        <small>{organizationName(item.customer)}</small>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ) : null}
        {hasPermission(PERMISSIONS.JOBS_VIEW) ? (
          <article className="mz-card">
            <div className="mz-card__body">
              <div className="mz-card__head">
                <h3 className="mz-card__title">{t('reports.recentJobs')}</h3>
                <Link className="mz-link" to="/jobs">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              {jobs.isError ? (
                <ErrorState onRetry={() => void jobs.refetch()} />
              ) : (
                <ul className="mz-queue-list">
                  {(jobs.data?.items ?? []).map((item) => (
                    <li key={item.id}>
                      <div className="mz-queue-list__meta">
                        <Link className="mz-link" to={`/jobs/${item.id}`}>
                          {item.reference}
                        </Link>
                        <small>{organizationName(item.customer)}</small>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ) : null}
        {hasPermission(PERMISSIONS.PAYMENTS_VIEW) ? (
          <article className="mz-card">
            <div className="mz-card__body">
              <div className="mz-card__head">
                <h3 className="mz-card__title">{t('reports.recentPayments')}</h3>
                <Link className="mz-link" to="/payments">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              {payments.isError ? (
                <ErrorState onRetry={() => void payments.refetch()} />
              ) : (
                <ul className="mz-queue-list">
                  {(payments.data?.items ?? []).map((item) => (
                    <li key={item.id}>
                      <div className="mz-queue-list__meta">
                        <strong>{item.reference}</strong>
                        <small>{formatMoney(item.amount, item.currency ?? undefined)}</small>
                      </div>
                      <StatusBadge status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ) : null}
      </section>
    </>
  )
}

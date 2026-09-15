import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchDashboard, fetchJobs, fetchProviders, fetchShipments, fetchTrips } from '@/core/api/services.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { LIVE_TRACKING_ENABLED } from '@/core/constants/features.ts'
import type { DashboardStats } from '@/core/api/types.ts'
import { KpiCard } from '@/shared/components/KpiCard.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { formatCommissionRate, formatDateTime, formatMoney, formatNumber, greetingKey, organizationName } from '@/shared/utils/format.ts'
import { WorkQueue } from '@/features/dashboard/WorkQueue.tsx'
import { kpiIcons } from '@/features/dashboard/kpiIcons.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import type { IconName } from '@/shared/icons/NavIcons.tsx'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createReportDocument } from '@/shared/reports/buildReport.ts'

function count(value: number | undefined): number {
  return value ?? 0
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuth()
  const catalog = useCatalog()
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 60_000,
  })
  const canViewShipments = hasPermission(PERMISSIONS.SHIPMENTS_VIEW)
  const canViewJobs = hasPermission(PERMISSIONS.JOBS_VIEW)
  const canViewTrips = hasPermission(PERMISSIONS.TRIPS_VIEW)
  const canViewProviders = hasPermission(PERMISSIONS.PROVIDERS_VIEW)

  const shipments = useQuery({
    queryKey: ['dashboard', 'shipments'],
    queryFn: () => fetchShipments({ status: 'published', page: 1, per_page: 5 }),
    enabled: canViewShipments,
  })
  const jobs = useQuery({
    queryKey: ['dashboard', 'jobs'],
    queryFn: () => fetchJobs({ page: 1, per_page: 15 }),
    enabled: canViewJobs,
  })
  const trips = useQuery({
    queryKey: ['dashboard', 'trips'],
    queryFn: () => fetchTrips({ status: 'in_transit', page: 1, per_page: 5 }),
    enabled: canViewTrips,
  })
  const providers = useQuery({
    queryKey: ['dashboard', 'providers'],
    queryFn: () => fetchProviders({ status: 'pending', page: 1, per_page: 5 }),
    enabled: canViewProviders && count(query.data?.providers_pending) > 0,
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const stats = query.data
  const firstName = user?.name?.split(/\s+/)[0] ?? t('app.name')
  const attention = attentionItems(stats, t, hasPermission)
  const shortcuts = [
    {
      to: '/shipments?status=published',
      title: t('dashboard.shortcutShipments'),
      hint: t('dashboard.shortcutShipmentsHint'),
      permission: PERMISSIONS.SHIPMENTS_VIEW,
      icon: 'shipments' as const,
    },
    {
      to: '/jobs?status=pending_dispatch',
      title: t('dashboard.shortcutJobs'),
      hint: t('dashboard.shortcutJobsHint'),
      permission: PERMISSIONS.JOBS_VIEW,
      icon: 'dispatch' as const,
    },
    ...(LIVE_TRACKING_ENABLED
      ? [
          {
            to: '/tracking',
            title: t('dashboard.shortcutTracking'),
            hint: t('dashboard.shortcutTrackingHint'),
            permission: PERMISSIONS.TRACKING_VIEW,
            icon: 'tracking' as const,
          },
        ]
      : []),
    {
      to: '/settlements?status=pending',
      title: t('dashboard.shortcutSettlements'),
      hint: t('dashboard.shortcutSettlementsHint'),
      permission: PERMISSIONS.SETTLEMENTS_VIEW,
      icon: 'settlements' as const,
    },
    {
      to: '/providers?status=pending',
      title: t('dashboard.shortcutProviders'),
      hint: t('dashboard.shortcutProvidersHint'),
      permission: PERMISSIONS.PROVIDERS_VIEW,
      icon: 'verify' as const,
    },
  ].filter((item) => hasPermission(item.permission))

  const activeJobs = (jobs.data?.items ?? [])
    .filter((job) => job.status === 'pending_dispatch' || job.status === 'in_progress')
    .slice(0, 5)

  return (
    <div className="mz-dash">
      <section className="mz-hero">
        <div>
          <p className="mz-hero__kicker">{t('app.portal')}</p>
          <h1>{t(greetingKey(), { name: firstName })}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
        <div className="mz-hero__meta">
          <span className="mz-live">
            <i />
            {t('dashboard.updatedAt', { time: formatDateTime(new Date(query.dataUpdatedAt).toISOString()) })}
          </span>
          <DownloadReportButton
            build={() =>
              createReportDocument({
                title: t('reports.snapshot'),
                subtitle: t('dashboard.subtitle'),
                sections: [
                  {
                    title: t('dashboard.attention'),
                    metrics: attention.map((item) => ({
                      label: item.label,
                      value: formatNumber(item.count),
                    })),
                  },
                  {
                    title: t('reports.operations'),
                    metrics: [
                      ...(canViewShipments
                        ? [
                            { label: t('dashboard.shipmentsOpen'), value: formatNumber(stats.shipments_open) },
                            { label: t('dashboard.shipmentsTotal'), value: formatNumber(stats.shipments_total) },
                          ]
                        : []),
                      ...(canViewJobs
                        ? [
                            { label: t('dashboard.jobsActive'), value: formatNumber(stats.jobs_active) },
                            { label: t('dashboard.jobsCompleted'), value: formatNumber(stats.jobs_completed) },
                            { label: t('dashboard.jobsPendingDispatch'), value: formatNumber(stats.jobs_pending_dispatch) },
                          ]
                        : []),
                      ...(canViewTrips
                        ? [
                            { label: t('dashboard.tripsInTransit'), value: formatNumber(stats.trips_in_transit) },
                            { label: t('dashboard.tripsUnassigned'), value: formatNumber(stats.trips_unassigned) },
                          ]
                        : []),
                    ],
                  },
                  {
                    title: t('reports.finance'),
                    metrics: [
                      ...(hasPermission(PERMISSIONS.PAYMENTS_VIEW)
                        ? [
                            { label: t('dashboard.paymentsCompleted'), value: formatMoney(stats.payments_completed_amount) },
                            { label: t('dashboard.commission'), value: formatMoney(stats.commission_amount) },
                            { label: t('dashboard.paymentsPending'), value: formatNumber(stats.payments_pending) },
                          ]
                        : []),
                      ...(hasPermission(PERMISSIONS.WALLETS_VIEW)
                        ? [{ label: t('dashboard.providerReceivable'), value: formatMoney(stats.provider_receivable) }]
                        : []),
                      ...(hasPermission(PERMISSIONS.SETTLEMENTS_VIEW)
                        ? [{ label: t('dashboard.settlementsPending'), value: formatNumber(stats.settlements_pending) }]
                        : []),
                      ...(hasPermission(PERMISSIONS.INVOICES_VIEW)
                        ? [{ label: t('dashboard.invoicesUnpaid'), value: formatNumber(count(stats.invoices_unpaid)) }]
                        : []),
                    ],
                  },
                ],
              })
            }
          />
          <button
            type="button"
            className="mz-btn mz-btn--ghost"
            onClick={() => {
              void query.refetch()
              void shipments.refetch()
              void jobs.refetch()
              void trips.refetch()
              void providers.refetch()
            }}
          >
            <AppIcon name="refresh" width={15} height={15} />
            {t('common.refresh')}
          </button>
        </div>
      </section>

      {attention.length > 0 ? (
        <section className="mz-panel" aria-label={t('dashboard.attention')}>
          <div className="mz-panel__head">
            <h2>{t('dashboard.attention')}</h2>
          </div>
          <div className="mz-attention">
            {attention.map((item) => (
              <Link key={item.to} className={`mz-attention__item mz-attention__item--${item.tone}`} to={item.to}>
                <IconWell name={item.icon} size="md" />
                <div className="mz-attention__copy">
                  <strong>{item.label}</strong>
                  <span>{t('dashboard.viewAll')}</span>
                </div>
                <span className="mz-attention__count">{formatNumber(item.count)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mz-panel">
        <div className="mz-panel__head">
          <h2>{t('dashboard.operations')}</h2>
        </div>
        <div className="mz-kpi-grid">
        {canViewShipments ? (
          <KpiCard
            icon={kpiIcons.shipment}
            label={t('dashboard.shipmentsOpen')}
            value={formatNumber(stats.shipments_open)}
            hint={t('dashboard.shipmentsOpenHint')}
            to="/shipments?status=published"
            tone={stats.shipments_open > 0 ? 'info' : 'default'}
          />
        ) : null}
        {hasPermission(PERMISSIONS.QUOTATIONS_VIEW) ? (
          <KpiCard
            icon={kpiIcons.quotation}
            label={t('dashboard.quotationsPending')}
            value={formatNumber(stats.quotations_pending)}
            hint={t('dashboard.quotationsPendingHint')}
            to="/quotations?status=submitted"
            tone={stats.quotations_pending > 0 ? 'warning' : 'default'}
          />
        ) : null}
        {canViewJobs ? (
          <KpiCard
            icon={kpiIcons.job}
            label={t('dashboard.jobsActive')}
            value={formatNumber(stats.jobs_active)}
            hint={t('dashboard.jobsActiveHint')}
            to="/jobs?status=in_progress"
            tone={count(stats.jobs_pending_dispatch) > 0 ? 'warning' : 'info'}
          />
        ) : null}
        {canViewTrips ? (
          <KpiCard
            icon={kpiIcons.trip}
            label={t('dashboard.tripsInTransit')}
            value={formatNumber(stats.trips_in_transit)}
            hint={t('dashboard.tripsInTransitHint')}
            to={LIVE_TRACKING_ENABLED ? '/tracking' : '/trips?status=in_transit'}
            tone={stats.trips_in_transit > 0 ? 'info' : 'default'}
          />
        ) : null}
        </div>
      </section>

      {hasPermission(PERMISSIONS.PAYMENTS_VIEW) || hasPermission(PERMISSIONS.INVOICES_VIEW) || hasPermission(PERMISSIONS.SETTLEMENTS_VIEW) || hasPermission(PERMISSIONS.WALLETS_VIEW) ? (
        <section className="mz-panel">
          <div className="mz-panel__head">
            <h2>{t('dashboard.finance')}</h2>
            {catalog.data?.commission_rate != null ? (
              <span style={{ color: 'var(--mz-muted)', fontSize: 15 }}>
                {t('dashboard.defaultCommissionRate', { rate: formatCommissionRate(catalog.data.commission_rate) })}
              </span>
            ) : null}
          </div>
          <div className="mz-kpi-grid">
            {hasPermission(PERMISSIONS.PAYMENTS_VIEW) ? (
              <KpiCard
                icon={kpiIcons.payment}
                label={t('dashboard.paymentsCompleted')}
                value={formatMoney(stats.payments_completed_amount)}
                hint={t('dashboard.paymentsCompletedHint')}
                to="/payments"
                tone="success"
              />
            ) : null}
            {hasPermission(PERMISSIONS.PAYMENTS_VIEW) ? (
              <KpiCard
                icon={kpiIcons.commission}
                label={t('dashboard.commission')}
                value={formatMoney(stats.commission_amount)}
                hint={t('dashboard.commissionHint')}
                to="/payments"
              />
            ) : null}
            {hasPermission(PERMISSIONS.WALLETS_VIEW) ? (
              <KpiCard
                icon={kpiIcons.settlement}
                label={t('dashboard.providerReceivable')}
                value={formatMoney(stats.provider_receivable)}
                hint={t('dashboard.providerReceivableHint')}
                to="/wallets"
              />
            ) : null}
            {hasPermission(PERMISSIONS.WALLETS_VIEW) ? (
              <KpiCard
                icon={kpiIcons.settlement}
                label={t('dashboard.walletAvailable')}
                value={formatMoney(stats.wallet_available ?? 0)}
                hint={t('dashboard.walletAvailableHint')}
                to="/wallets"
                tone={(stats.wallet_available ?? 0) > 0 ? 'success' : 'default'}
              />
            ) : null}
            {hasPermission(PERMISSIONS.INVOICES_VIEW) ? (
              <KpiCard
                icon={kpiIcons.invoice}
                label={t('dashboard.invoicesUnpaid')}
                value={formatNumber(count(stats.invoices_unpaid))}
                hint={t('dashboard.invoices')}
                to="/invoices?status=issued"
                tone={count(stats.invoices_unpaid) > 0 ? 'warning' : 'default'}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {canViewShipments || canViewJobs || canViewTrips ? (
        <section className="mz-queue-grid">
          {canViewShipments ? (
            <WorkQueue
              title={t('dashboard.openQueue')}
              icon="shipments"
              viewAllTo="/shipments?status=published"
              isLoading={shipments.isLoading}
              isError={shipments.isError}
              onRetry={() => void shipments.refetch()}
              items={(shipments.data?.items ?? []).map((item) => ({
                id: item.id,
                title: item.reference,
                meta: `${organizationName(item.customer)} · ${item.pickup_city ?? '—'} → ${item.delivery_city ?? '—'}`,
                status: item.status,
                to: `/shipments/${item.id}`,
              }))}
            />
          ) : null}
          {canViewJobs ? (
            <WorkQueue
              title={t('dashboard.activeJobsQueue')}
              icon="jobs"
              viewAllTo="/jobs"
              isLoading={jobs.isLoading}
              isError={jobs.isError}
              onRetry={() => void jobs.refetch()}
              items={activeJobs.map((item) => ({
                id: item.id,
                title: item.reference,
                meta: `${organizationName(item.customer)} · ${organizationName(item.provider)}`,
                status: item.status,
                to: `/jobs/${item.id}`,
              }))}
            />
          ) : null}
          {canViewTrips ? (
            <WorkQueue
              title={t(LIVE_TRACKING_ENABLED ? 'dashboard.liveTripsQueue' : 'dashboard.tripsInTransit')}
              icon="trips"
              viewAllTo={LIVE_TRACKING_ENABLED ? '/tracking' : '/trips?status=in_transit'}
              isLoading={trips.isLoading}
              isError={trips.isError}
              onRetry={() => void trips.refetch()}
              items={(trips.data?.items ?? []).map((item) => ({
                id: item.id,
                title: item.reference,
                meta: `${item.driver?.name ?? t('common.noValue')} · ${item.pickup_city ?? '—'} → ${item.delivery_city ?? '—'}`,
                status: item.status,
                to: `/trips/${item.id}`,
              }))}
            />
          ) : null}
        </section>
      ) : null}

      {canViewProviders && count(stats.providers_pending) > 0 ? (
        <section>
          <WorkQueue
            title={t('dashboard.providersPending')}
            icon="providers"
            viewAllTo="/providers?status=pending"
            isLoading={providers.isLoading}
            isError={providers.isError}
            onRetry={() => void providers.refetch()}
            items={(providers.data?.items ?? []).map((item) => ({
              id: item.id,
              title: organizationName(item),
              meta: item.city ?? item.commercial_register ?? t('common.noValue'),
              status: item.status,
              to: `/providers/${item.id}`,
            }))}
          />
        </section>
      ) : null}

      {shortcuts.length > 0 ? (
        <section className="mz-panel">
          <div className="mz-panel__head">
            <h2>{t('dashboard.quickLinks')}</h2>
          </div>
          <div className="mz-quick-links">
            {shortcuts.map((item) => (
              <Link key={item.to} className="mz-quick-link" to={item.to}>
                <IconWell name={item.icon} size="lg" />
                <span className="mz-quick-link__copy">
                  <strong>{item.title}</strong>
                  <span>{item.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function attentionItems(
  stats: DashboardStats,
  t: (key: string) => string,
  hasPermission: (permission: string) => boolean,
) {
  return [
    {
      to: '/quotations?status=submitted',
      label: t('dashboard.quotationsPending'),
      count: count(stats.quotations_pending),
      permission: PERMISSIONS.QUOTATIONS_VIEW,
      tone: 'warning' as const,
      icon: 'quotations' as IconName,
    },
    {
      to: '/jobs?status=pending_dispatch',
      label: t('dashboard.jobsPendingDispatch'),
      count: count(stats.jobs_pending_dispatch),
      permission: PERMISSIONS.JOBS_VIEW,
      tone: 'warning' as const,
      icon: 'jobs' as IconName,
    },
    {
      to: '/trips?status=unassigned',
      label: t('dashboard.tripsUnassigned'),
      count: count(stats.trips_unassigned),
      permission: PERMISSIONS.TRIPS_VIEW,
      tone: 'danger' as const,
      icon: 'trips' as IconName,
    },
    {
      to: '/providers?status=pending',
      label: t('dashboard.providersPending'),
      count: count(stats.providers_pending),
      permission: PERMISSIONS.PROVIDERS_VIEW,
      tone: 'warning' as const,
      icon: 'providers' as IconName,
    },
    {
      to: '/customers?status=pending',
      label: t('dashboard.customersPending'),
      count: count(stats.customers_pending),
      permission: PERMISSIONS.CUSTOMERS_VIEW,
      tone: 'info' as const,
      icon: 'customers' as IconName,
    },
    {
      to: '/payments?status=pending',
      label: t('dashboard.paymentsPending'),
      count: count(stats.payments_pending),
      permission: PERMISSIONS.PAYMENTS_VIEW,
      tone: 'warning' as const,
      icon: 'payments' as IconName,
    },
    {
      to: '/settlements?status=pending',
      label: t('dashboard.settlementsPending'),
      count: count(stats.settlements_pending),
      permission: PERMISSIONS.SETTLEMENTS_VIEW,
      tone: 'info' as const,
      icon: 'settlements' as IconName,
    },
  ].filter((item) => item.count > 0 && hasPermission(item.permission))
}

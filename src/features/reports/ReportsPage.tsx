import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchDashboard, fetchJobs, fetchPayments, fetchShipments } from '@/core/api/services.ts'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import type { Payment, Shipment, TransportJob } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { KpiCard } from '@/shared/components/KpiCard.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DateRangeFilter, FilterBar } from '@/shared/components/FilterBar.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { useCatalog } from '@/shared/hooks/useCatalog.ts'
import { displayValue, formatCommissionRate, formatDate, formatMoney, formatNumber, formatPercent, organizationName } from '@/shared/utils/format.ts'
import { kpiIcons } from '@/features/dashboard/kpiIcons.tsx'
import { MixBar } from '@/features/reports/MixBar.tsx'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createReportDocument, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

function count(value: number | undefined): number {
  return value ?? 0
}

function share(part: number, whole: number): number | null {
  if (whole <= 0) {
    return null
  }
  return Math.round((part / whole) * 100)
}

export function ReportsPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const catalog = useCatalog()
  const list = useListQuery()
  const canViewShipments = hasPermission(PERMISSIONS.SHIPMENTS_VIEW)
  const canViewJobs = hasPermission(PERMISSIONS.JOBS_VIEW)
  const canViewPayments = hasPermission(PERMISSIONS.PAYMENTS_VIEW)
  const canViewWallets = hasPermission(PERMISSIONS.WALLETS_VIEW)
  const canViewInvoices = hasPermission(PERMISSIONS.INVOICES_VIEW)
  const canViewSettlements = hasPermission(PERMISSIONS.SETTLEMENTS_VIEW)
  const canViewQuotations = hasPermission(PERMISSIONS.QUOTATIONS_VIEW)
  const canViewTrips = hasPermission(PERMISSIONS.TRIPS_VIEW)
  const canViewProviders = hasPermission(PERMISSIONS.PROVIDERS_VIEW)
  const canViewCustomers = hasPermission(PERMISSIONS.CUSTOMERS_VIEW)

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })
  const shipments = useQuery({
    queryKey: ['reports', 'shipments', list.dateFrom, list.dateTo],
    queryFn: () => fetchShipments({ page: 1, per_page: 8, date_from: list.dateFrom, date_to: list.dateTo }),
    enabled: canViewShipments,
  })
  const jobs = useQuery({
    queryKey: ['reports', 'jobs', list.dateFrom, list.dateTo],
    queryFn: () => fetchJobs({ page: 1, per_page: 8, date_from: list.dateFrom, date_to: list.dateTo }),
    enabled: canViewJobs,
  })
  const payments = useQuery({
    queryKey: ['reports', 'payments', list.dateFrom, list.dateTo],
    queryFn: () => fetchPayments({ page: 1, per_page: 8, date_from: list.dateFrom, date_to: list.dateTo }),
    enabled: canViewPayments,
  })

  if (dashboard.isLoading) {
    return <LoadingState />
  }

  if (dashboard.isError || !dashboard.data) {
    return <ErrorState onRetry={() => void dashboard.refetch()} />
  }

  const stats = dashboard.data
  const jobsInProgress = Math.max(0, count(stats.jobs_active) - count(stats.jobs_pending_dispatch))
  const shipmentsClosed = Math.max(0, count(stats.shipments_total) - count(stats.shipments_open))
  const openShare = share(count(stats.shipments_open), count(stats.shipments_total))
  const completionShare = share(count(stats.jobs_completed), count(stats.jobs_active) + count(stats.jobs_completed))
  const commissionShare = share(count(stats.commission_amount), count(stats.payments_completed_amount))
  const availableShare = share(count(stats.wallet_available), count(stats.provider_receivable))

  const shipmentColumns: Column<Shipment>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/shipments/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'customer', header: t('common.customer'), cell: (row) => organizationName(row.customer) },
    { id: 'cargo', header: t('shipments.cargoType'), cell: (row) => displayValue(row.cargo_type) },
    {
      id: 'route',
      header: t('shipments.routeSection'),
      cell: (row) => `${displayValue(row.pickup_city)} → ${displayValue(row.delivery_city)}`,
    },
    { id: 'date', header: t('shipments.requiredDate'), cell: (row) => formatDate(row.required_date) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  const jobColumns: Column<TransportJob>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/jobs/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    { id: 'customer', header: t('common.customer'), cell: (row) => organizationName(row.customer) },
    { id: 'provider', header: t('common.provider'), cell: (row) => organizationName(row.provider) },
    { id: 'price', header: t('quotations.price'), cell: (row) => formatMoney(row.total_price, row.currency ?? undefined) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  const paymentColumns: Column<Payment>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    { id: 'commission', header: t('common.commission'), cell: (row) => formatMoney(row.commission_amount, row.currency ?? undefined) },
    { id: 'method', header: t('payments.method'), cell: (row) => displayValue(row.method) },
    { id: 'paid', header: t('payments.paidAt'), cell: (row) => formatDate(row.paid_at) },
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="mz-dash">
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        actions={
          <>
            <DownloadReportButton
              build={async () => {
                const [shipmentRows, jobRows, paymentRows] = await Promise.all([
                  canViewShipments
                    ? fetchAllPages((page, perPage) =>
                        fetchShipments({ page, per_page: perPage, date_from: list.dateFrom, date_to: list.dateTo }),
                      )
                    : Promise.resolve([]),
                  canViewJobs
                    ? fetchAllPages((page, perPage) =>
                        fetchJobs({ page, per_page: perPage, date_from: list.dateFrom, date_to: list.dateTo }),
                      )
                    : Promise.resolve([]),
                  canViewPayments
                    ? fetchAllPages((page, perPage) =>
                        fetchPayments({ page, per_page: perPage, date_from: list.dateFrom, date_to: list.dateTo }),
                      )
                    : Promise.resolve([]),
                ])

                return createReportDocument({
                  title: t('reports.title'),
                  subtitle: t('reports.subtitle'),
                  filters: listReportFilters(t, { dateFrom: list.dateFrom, dateTo: list.dateTo }),
                  sections: [
                    {
                      title: t('reports.operations'),
                      metrics: [
                        ...(canViewShipments
                          ? [
                              { label: t('dashboard.shipmentsOpen'), value: formatNumber(stats.shipments_open) },
                              { label: t('dashboard.shipmentsTotal'), value: formatNumber(stats.shipments_total) },
                              { label: t('reports.openShare'), value: formatPercent(openShare) },
                            ]
                          : []),
                        ...(canViewQuotations
                          ? [{ label: t('dashboard.quotationsPending'), value: formatNumber(stats.quotations_pending) }]
                          : []),
                        ...(canViewJobs
                          ? [
                              { label: t('dashboard.jobsActive'), value: formatNumber(stats.jobs_active) },
                              { label: t('dashboard.jobsCompleted'), value: formatNumber(stats.jobs_completed) },
                              { label: t('reports.completionShare'), value: formatPercent(completionShare) },
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
                        ...(canViewPayments
                          ? [
                              { label: t('dashboard.paymentsCompleted'), value: formatMoney(stats.payments_completed_amount) },
                              { label: t('dashboard.commission'), value: formatMoney(stats.commission_amount) },
                              { label: t('reports.commissionShare'), value: formatPercent(commissionShare) },
                              { label: t('dashboard.paymentsPending'), value: formatNumber(stats.payments_pending) },
                            ]
                          : []),
                        ...(canViewWallets
                          ? [
                              { label: t('dashboard.providerReceivable'), value: formatMoney(stats.provider_receivable) },
                              { label: t('dashboard.walletAvailable'), value: formatMoney(stats.wallet_available ?? 0) },
                              { label: t('reports.availableShare'), value: formatPercent(availableShare) },
                            ]
                          : []),
                        ...(canViewSettlements
                          ? [{ label: t('dashboard.settlementsPending'), value: formatNumber(stats.settlements_pending) }]
                          : []),
                        ...(canViewInvoices
                          ? [{ label: t('dashboard.invoicesUnpaid'), value: formatNumber(count(stats.invoices_unpaid)) }]
                          : []),
                      ],
                    },
                    ...(canViewProviders || canViewCustomers
                      ? [
                          {
                            title: t('reports.directory'),
                            metrics: [
                              ...(canViewProviders
                                ? [{ label: t('dashboard.providersPending'), value: formatNumber(stats.providers_pending) }]
                                : []),
                              ...(canViewCustomers
                                ? [{ label: t('dashboard.customersPending'), value: formatNumber(stats.customers_pending) }]
                                : []),
                            ],
                          },
                        ]
                      : []),
                    ...(canViewShipments
                      ? [
                          {
                            title: t('reports.recentShipments'),
                            table: {
                              columns: [
                                t('common.reference'),
                                t('common.customer'),
                                t('shipments.cargoType'),
                                t('shipments.routeSection'),
                                t('shipments.requiredDate'),
                                t('common.status'),
                              ],
                              rows: shipmentRows.map((row) => [
                                row.reference,
                                organizationName(row.customer),
                                displayValue(row.cargo_type),
                                `${displayValue(row.pickup_city)} → ${displayValue(row.delivery_city)}`,
                                formatDate(row.required_date),
                                reportStatus(t, row.status),
                              ]),
                            },
                          },
                        ]
                      : []),
                    ...(canViewJobs
                      ? [
                          {
                            title: t('reports.recentJobs'),
                            table: {
                              columns: [
                                t('common.reference'),
                                t('common.customer'),
                                t('common.provider'),
                                t('quotations.price'),
                                t('common.status'),
                              ],
                              rows: jobRows.map((row) => [
                                row.reference,
                                organizationName(row.customer),
                                organizationName(row.provider),
                                formatMoney(row.total_price, row.currency ?? undefined),
                                reportStatus(t, row.status),
                              ]),
                            },
                          },
                        ]
                      : []),
                    ...(canViewPayments
                      ? [
                          {
                            title: t('reports.recentPayments'),
                            table: {
                              columns: [
                                t('common.reference'),
                                t('common.amount'),
                                t('common.commission'),
                                t('payments.method'),
                                t('payments.paidAt'),
                                t('common.status'),
                              ],
                              rows: paymentRows.map((row) => [
                                row.reference,
                                formatMoney(row.amount, row.currency ?? undefined),
                                formatMoney(row.commission_amount, row.currency ?? undefined),
                                displayValue(row.method),
                                formatDate(row.paid_at),
                                reportStatus(t, row.status),
                              ]),
                            },
                          },
                        ]
                      : []),
                  ],
                })
              }}
            />
            <button
              type="button"
              className="mz-btn mz-btn--ghost"
              onClick={() => {
                void dashboard.refetch()
                void shipments.refetch()
                void jobs.refetch()
                void payments.refetch()
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M19.4 12a7.4 7.4 0 1 1-2.1-5.2" />
                <path d="M19.6 4.8v4.4h-4.4" />
              </svg>
              {t('common.refresh')}
            </button>
          </>
        }
      />

      <section className="mz-panel">
        <div className="mz-panel__head">
          <h2>{t('reports.operations')}</h2>
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
          {canViewShipments ? (
            <KpiCard
              icon={kpiIcons.shipment}
              label={t('dashboard.shipmentsTotal')}
              value={formatNumber(stats.shipments_total)}
              hint={t('reports.openShareHint')}
              to="/shipments"
            />
          ) : null}
          {canViewQuotations ? (
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
              to="/jobs"
              tone={count(stats.jobs_pending_dispatch) > 0 ? 'warning' : 'info'}
            />
          ) : null}
          {canViewJobs ? (
            <KpiCard
              icon={kpiIcons.job}
              label={t('dashboard.jobsCompleted')}
              value={formatNumber(stats.jobs_completed)}
              hint={t('reports.completionShareHint')}
              to="/jobs?status=completed"
              tone="success"
            />
          ) : null}
          {canViewTrips ? (
            <KpiCard
              icon={kpiIcons.trip}
              label={t('dashboard.tripsInTransit')}
              value={formatNumber(stats.trips_in_transit)}
              hint={t('dashboard.tripsInTransitHint')}
              to="/tracking"
              tone={stats.trips_in_transit > 0 ? 'info' : 'default'}
            />
          ) : null}
          {canViewTrips ? (
            <KpiCard
              icon={kpiIcons.trip}
              label={t('dashboard.tripsUnassigned')}
              value={formatNumber(stats.trips_unassigned)}
              hint={t('dashboard.shortcutJobsHint')}
              to="/trips?status=unassigned"
              tone={count(stats.trips_unassigned) > 0 ? 'warning' : 'default'}
            />
          ) : null}
        </div>
      </section>

      {canViewShipments || canViewJobs || canViewWallets ? (
        <section className="mz-panel">
          <div className="mz-panel__head">
            <h2>{t('reports.mix')}</h2>
          </div>
          <div className="mz-mix-grid">
            {canViewShipments ? (
              <MixBar
                title={t('reports.shipmentMix')}
                segments={[
                  { label: t('dashboard.shipmentsOpen'), value: count(stats.shipments_open), tone: 'info' },
                  { label: t('reports.shipmentsClosed'), value: shipmentsClosed, tone: 'neutral' },
                ]}
              />
            ) : null}
            {canViewJobs ? (
              <MixBar
                title={t('reports.jobMix')}
                segments={[
                  { label: t('dashboard.jobsPendingDispatch'), value: count(stats.jobs_pending_dispatch), tone: 'warning' },
                  { label: t('reports.jobsInProgress'), value: jobsInProgress, tone: 'info' },
                  { label: t('dashboard.jobsCompleted'), value: count(stats.jobs_completed), tone: 'success' },
                ]}
              />
            ) : null}
            {canViewWallets ? (
              <MixBar
                title={t('reports.walletMix')}
                formatValue={(value) => formatMoney(value)}
                segments={[
                  { label: t('wallets.pending'), value: count(stats.wallet_pending), tone: 'warning' },
                  { label: t('wallets.available'), value: count(stats.wallet_available), tone: 'success' },
                  { label: t('wallets.reserved'), value: count(stats.wallet_reserved), tone: 'neutral' },
                ]}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {canViewPayments || canViewInvoices || canViewSettlements || canViewWallets ? (
        <section className="mz-panel">
          <div className="mz-panel__head">
            <h2>{t('reports.finance')}</h2>
            {catalog.data?.commission_rate != null ? (
              <span style={{ color: 'var(--mz-muted)', fontSize: 15 }}>
                {t('dashboard.defaultCommissionRate', { rate: formatCommissionRate(catalog.data.commission_rate) })}
              </span>
            ) : null}
          </div>
          <div className="mz-kpi-grid">
            {canViewPayments ? (
              <KpiCard
                icon={kpiIcons.payment}
                label={t('dashboard.paymentsCompleted')}
                value={formatMoney(stats.payments_completed_amount)}
                hint={t('dashboard.paymentsCompletedHint')}
                to="/payments"
                tone="success"
              />
            ) : null}
            {canViewPayments ? (
              <KpiCard
                icon={kpiIcons.commission}
                label={t('dashboard.commission')}
                value={formatMoney(stats.commission_amount)}
                hint={commissionShare == null ? t('dashboard.commissionHint') : t('reports.commissionShareHint')}
                to="/payments"
              />
            ) : null}
            {canViewPayments ? (
              <KpiCard
                icon={kpiIcons.payment}
                label={t('dashboard.paymentsPending')}
                value={formatNumber(stats.payments_pending)}
                hint={t('dashboard.paymentsPending')}
                to="/payments?status=pending"
                tone={count(stats.payments_pending) > 0 ? 'warning' : 'default'}
              />
            ) : null}
            {canViewWallets ? (
              <KpiCard
                icon={kpiIcons.settlement}
                label={t('dashboard.providerReceivable')}
                value={formatMoney(stats.provider_receivable)}
                hint={t('dashboard.providerReceivableHint')}
                to="/wallets"
              />
            ) : null}
            {canViewWallets ? (
              <KpiCard
                icon={kpiIcons.settlement}
                label={t('dashboard.walletAvailable')}
                value={formatMoney(stats.wallet_available ?? 0)}
                hint={t('dashboard.walletAvailableHint')}
                to="/wallets"
                tone={(stats.wallet_available ?? 0) > 0 ? 'success' : 'default'}
              />
            ) : null}
            {canViewSettlements ? (
              <KpiCard
                icon={kpiIcons.settlement}
                label={t('dashboard.settlementsPending')}
                value={formatNumber(stats.settlements_pending)}
                hint={t('dashboard.shortcutSettlementsHint')}
                to="/settlements?status=pending"
                tone={count(stats.settlements_pending) > 0 ? 'warning' : 'default'}
              />
            ) : null}
            {canViewInvoices ? (
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

      <section className="mz-panel">
        <div className="mz-panel__head">
          <h2>{t('common.overview')}</h2>
        </div>
        <div className="mz-kpi-grid">
          {canViewShipments ? (
            <KpiCard
              label={t('reports.openShare')}
              value={formatPercent(openShare)}
              hint={t('reports.openShareHint')}
              to="/shipments?status=published"
              tone={count(stats.shipments_open) > 0 ? 'info' : 'default'}
            />
          ) : null}
          {canViewJobs ? (
            <KpiCard
              label={t('reports.completionShare')}
              value={formatPercent(completionShare)}
              hint={t('reports.completionShareHint')}
              to="/jobs?status=completed"
              tone="success"
            />
          ) : null}
          {canViewPayments ? (
            <KpiCard
              label={t('reports.commissionShare')}
              value={formatPercent(commissionShare)}
              hint={t('reports.commissionShareHint')}
              to="/payments"
            />
          ) : null}
          {canViewWallets ? (
            <KpiCard
              label={t('reports.availableShare')}
              value={formatPercent(availableShare)}
              hint={t('reports.availableShareHint')}
              to="/wallets"
              tone={(stats.wallet_available ?? 0) > 0 ? 'success' : 'default'}
            />
          ) : null}
        </div>
      </section>

      {canViewProviders || canViewCustomers ? (
        <section className="mz-panel">
          <div className="mz-panel__head">
            <h2>{t('reports.directory')}</h2>
          </div>
          <div className="mz-kpi-grid">
            {canViewProviders ? (
              <KpiCard
                icon={kpiIcons.settlement}
                label={t('dashboard.providersPending')}
                value={formatNumber(stats.providers_pending)}
                hint={t('dashboard.shortcutProvidersHint')}
                to="/providers?status=pending"
                tone={count(stats.providers_pending) > 0 ? 'warning' : 'default'}
              />
            ) : null}
            {canViewCustomers ? (
              <KpiCard
                label={t('dashboard.customersPending')}
                value={formatNumber(stats.customers_pending)}
                hint={t('dashboard.customersPending')}
                to="/customers?status=pending"
                tone={count(stats.customers_pending) > 0 ? 'warning' : 'default'}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {canViewShipments || canViewJobs || canViewPayments ? (
        <section>
          <div className="mz-panel__head">
            <div>
              <h2>{t('reports.activity')}</h2>
              <p className="mz-notes" style={{ color: 'var(--mz-muted)', marginTop: 4 }}>
                {t('reports.activityHint')}
              </p>
            </div>
          </div>
          <FilterBar>
            <DateRangeFilter
              from={list.dateFrom}
              to={list.dateTo}
              onChange={(nextFrom, nextTo) => list.setFilters({ date_from: nextFrom, date_to: nextTo })}
            />
          </FilterBar>

          {canViewShipments ? (
            <div className="mz-section">
              <div className="mz-card__head">
                <h3 className="mz-card__title">{t('reports.recentShipments')}</h3>
                <Link className="mz-link" to="/shipments">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <DataTable
                columns={shipmentColumns}
                rows={shipments.data?.items ?? []}
                rowKey={(row) => row.id}
                isLoading={shipments.isLoading}
                isError={shipments.isError}
                onRetry={() => void shipments.refetch()}
                rowTo={(row) => `/shipments/${row.id}`}
              />
            </div>
          ) : null}

          {canViewJobs ? (
            <div className="mz-section">
              <div className="mz-card__head">
                <h3 className="mz-card__title">{t('reports.recentJobs')}</h3>
                <Link className="mz-link" to="/jobs">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <DataTable
                columns={jobColumns}
                rows={jobs.data?.items ?? []}
                rowKey={(row) => row.id}
                isLoading={jobs.isLoading}
                isError={jobs.isError}
                onRetry={() => void jobs.refetch()}
                rowTo={(row) => `/jobs/${row.id}`}
              />
            </div>
          ) : null}

          {canViewPayments ? (
            <div className="mz-section">
              <div className="mz-card__head">
                <h3 className="mz-card__title">{t('reports.recentPayments')}</h3>
                <Link className="mz-link" to="/payments">
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <DataTable
                columns={paymentColumns}
                rows={payments.data?.items ?? []}
                rowKey={(row) => row.id}
                isLoading={payments.isLoading}
                isError={payments.isError}
                onRetry={() => void payments.refetch()}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

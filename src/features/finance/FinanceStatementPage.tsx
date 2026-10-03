import type { TFunction } from 'i18next'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchFinanceStatement } from '@/core/api/services.ts'
import type { FinanceStatement, FinanceStatementJob, FinanceStatementProject } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { DateRangeFilter, FilterBar } from '@/shared/components/FilterBar.tsx'
import { JobProjectFilters, useRecordScopeLabels } from '@/shared/components/JobProjectFilters.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { KpiCard } from '@/shared/components/KpiCard.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { formatMoney, organizationName, projectName } from '@/shared/utils/format.ts'
import { kpiIcons } from '@/features/dashboard/kpiIcons.tsx'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createReportDocument, listReportFilters } from '@/shared/reports/buildReport.ts'
import type { ReportDocument, ReportFilter } from '@/shared/reports/types.ts'

function money(value: number, currency?: string | null) {
  return formatMoney(value, currency ?? undefined)
}

function projectLabel(
  row: Pick<FinanceStatementProject, 'id' | 'unassigned' | 'name_en' | 'name_ar' | 'project_id'>,
  unnamed: string,
) {
  if (row.unassigned) {
    return unnamed
  }
  return projectName({
    id: row.id ?? 0,
    project_id: row.project_id ?? '',
    name_en: row.name_en ?? '',
    name_ar: row.name_ar ?? '',
  })
}

function customerLabel(customer: FinanceStatementJob['customer']) {
  if (!customer) {
    return organizationName(null)
  }
  return organizationName({ ...customer, type: 'customer', status: 'active' })
}

function financeStatementDocument(t: TFunction, statement: FinanceStatement, filters: ReportFilter[]): ReportDocument {
  const currency = statement.currency
  const summary = statement.summary
  const projects = statement.projects ?? []
  const rows = statement.jobs ?? []

  return createReportDocument({
    title: t('financeStatement.title'),
    subtitle: t('financeStatement.subtitle'),
    filters,
    sections: [
      {
        title: t('financeStatement.title'),
        metrics: [
          { label: t('financeStatement.collected'), value: money(summary.collected, currency) },
          { label: t('financeStatement.platformRevenue'), value: money(summary.platform_revenue, currency) },
          { label: t('financeStatement.driverExpense'), value: money(summary.driver_expense, currency) },
          { label: t('financeStatement.netProfit'), value: money(summary.net_profit, currency) },
          { label: t('financeStatement.customerOutstanding'), value: money(summary.customer_outstanding, currency) },
          { label: t('financeStatement.driverOutstanding'), value: money(summary.driver_outstanding, currency) },
        ],
      },
      {
        title: t('financeStatement.byProject'),
        table: {
          columns: [
            t('jobs.project'),
            t('financeStatement.jobsCount'),
            t('financeStatement.platformRevenue'),
            t('financeStatement.driverExpense'),
            t('financeStatement.netProfit'),
            t('financeStatement.customerOutstanding'),
          ],
          rows: projects.map((row) => [
            projectLabel(row, t('financeStatement.unassigned')),
            String(row.jobs_count),
            money(row.platform_revenue, currency),
            money(row.driver_expense, currency),
            money(row.net_profit, currency),
            money(row.customer_outstanding, currency),
          ]),
        },
      },
      {
        title: t('financeStatement.byJob'),
        table: {
          columns: [
            t('common.reference'),
            t('jobs.project'),
            t('common.customer'),
            t('financeStatement.execution'),
            t('financeStatement.collected'),
            t('financeStatement.platformRevenue'),
            t('financeStatement.providerShare'),
            t('financeStatement.driverExpense'),
            t('financeStatement.netProfit'),
            t('financeStatement.customerOutstanding'),
          ],
          rows: rows.map((row) => [
            row.reference,
            row.project
              ? projectLabel({ ...row.project, unassigned: false }, t('financeStatement.unassigned'))
              : t('financeStatement.unassigned'),
            customerLabel(row.customer),
            t(row.execution === 'fleet' ? 'financeStatement.fleet' : 'financeStatement.marketplace'),
            money(row.collected, row.currency),
            money(row.platform_revenue, row.currency),
            money(row.provider_share, row.currency),
            money(row.driver_expense, row.currency),
            money(row.net_profit, row.currency),
            money(row.customer_outstanding, row.currency),
          ]),
        },
      },
    ],
  })
}

export function FinanceStatementPage() {
  const { t } = useTranslation()
  const list = useListQuery()
  const [params] = useSearchParams()
  const projectId = list.project || params.get('project_id') || ''
  const scope = useRecordScopeLabels(list.jobId, projectId)
  const unassigned = params.get('unassigned') === '1'
  const view = params.get('view') === 'jobs' ? 'jobs' : 'projects'
  const query = useQuery({
    queryKey: ['finance-statement', list.search, list.dateFrom, list.dateTo, projectId, list.jobId, unassigned],
    queryFn: () =>
      fetchFinanceStatement({
        search: list.search,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        project_id: projectId,
        job_id: list.jobId,
        unassigned,
      }),
  })

  const statement = query.data
  const currency = statement?.currency
  const summary = statement?.summary
  const activeProject = projectId ? statement?.projects.find((row) => String(row.id) === projectId) : null
  const filterName = unassigned
    ? t('financeStatement.unassigned')
    : activeProject
      ? projectLabel(activeProject, t('financeStatement.unassigned'))
      : scope.projectLabel

  const projectColumns: Column<FinanceStatementProject>[] = [
    {
      id: 'name',
      header: t('jobs.project'),
      cell: (row) => (
        <button
          type="button"
          className="mz-link"
          onClick={() =>
            list.setFilters({
              project: row.unassigned || row.id == null ? '' : String(row.id),
              project_id: '',
              job_id: '',
              unassigned: row.unassigned ? '1' : '',
              view: 'jobs',
            })
          }
        >
          {projectLabel(row, t('financeStatement.unassigned'))}
        </button>
      ),
    },
    { id: 'jobs', header: t('financeStatement.jobsCount'), cell: (row) => String(row.jobs_count) },
    { id: 'revenue', header: t('financeStatement.platformRevenue'), cell: (row) => money(row.platform_revenue, currency) },
    { id: 'expense', header: t('financeStatement.driverExpense'), cell: (row) => money(row.driver_expense, currency) },
    { id: 'net', header: t('financeStatement.netProfit'), cell: (row) => money(row.net_profit, currency) },
    {
      id: 'open',
      header: t('financeStatement.customerOutstanding'),
      cell: (row) => money(row.customer_outstanding, currency),
    },
  ]

  const jobColumns: Column<FinanceStatementJob>[] = [
    {
      id: 'ref',
      header: t('common.reference'),
      cell: (row) => (
        <Link className="mz-link" to={`/jobs/${row.id}`}>
          {row.reference}
        </Link>
      ),
    },
    {
      id: 'project',
      header: t('jobs.project'),
      cell: (row) =>
        row.project ? projectLabel({ ...row.project, unassigned: false }, t('financeStatement.unassigned')) : t('financeStatement.unassigned'),
    },
    { id: 'customer', header: t('common.customer'), cell: (row) => customerLabel(row.customer) },
    {
      id: 'execution',
      header: t('financeStatement.execution'),
      cell: (row) => t(row.execution === 'fleet' ? 'financeStatement.fleet' : 'financeStatement.marketplace'),
    },
    { id: 'collected', header: t('financeStatement.collected'), cell: (row) => money(row.collected, row.currency) },
    { id: 'revenue', header: t('financeStatement.platformRevenue'), cell: (row) => money(row.platform_revenue, row.currency) },
    { id: 'provider', header: t('financeStatement.providerShare'), cell: (row) => money(row.provider_share, row.currency) },
    { id: 'expense', header: t('financeStatement.driverExpense'), cell: (row) => money(row.driver_expense, row.currency) },
    { id: 'net', header: t('financeStatement.netProfit'), cell: (row) => money(row.net_profit, row.currency) },
    {
      id: 'open',
      header: t('financeStatement.customerOutstanding'),
      cell: (row) => money(row.customer_outstanding, row.currency),
    },
  ]

  return (
    <div className="mz-dash">
      <PageHeader
        title={t('financeStatement.title')}
        subtitle={t('financeStatement.subtitle')}
        actions={
          <DownloadReportButton
            build={async () => {
              const exported = await fetchFinanceStatement({
                search: list.search,
                date_from: list.dateFrom,
                date_to: list.dateTo,
                project_id: projectId,
                job_id: list.jobId,
                unassigned,
              })
              const matchedProject = projectId
                ? (exported.projects ?? []).find((row) => String(row.id) === projectId)
                : null
              const projectFilter = unassigned
                ? t('financeStatement.unassigned')
                : matchedProject
                  ? projectLabel(matchedProject, t('financeStatement.unassigned'))
                  : filterName

              return financeStatementDocument(
                t,
                exported,
                listReportFilters(t, {
                  search: list.search,
                  dateFrom: list.dateFrom,
                  dateTo: list.dateTo,
                  job: list.jobId ? scope.jobLabel : '',
                  project: projectFilter,
                }),
              )
            }}
          />
        }
      />

      <section className="mz-panel">
        <div className="mz-kpi-grid">
          <KpiCard
            icon={kpiIcons.payment}
            label={t('financeStatement.collected')}
            value={summary ? money(summary.collected, currency) : t('common.noValue')}
            hint={t('financeStatement.collectedHint')}
            tone="success"
          />
          <KpiCard
            icon={kpiIcons.commission}
            label={t('financeStatement.platformRevenue')}
            value={summary ? money(summary.platform_revenue, currency) : t('common.noValue')}
            hint={t('financeStatement.platformRevenueHint')}
          />
          <KpiCard
            icon={kpiIcons.settlement}
            label={t('financeStatement.driverExpense')}
            value={summary ? money(summary.driver_expense, currency) : t('common.noValue')}
            hint={t('financeStatement.driverExpenseHint')}
          />
          <KpiCard
            icon={kpiIcons.commission}
            label={t('financeStatement.netProfit')}
            value={summary ? money(summary.net_profit, currency) : t('common.noValue')}
            hint={t('financeStatement.netProfitHint')}
            tone={!summary ? 'default' : summary.net_profit < 0 ? 'danger' : 'success'}
          />
          <KpiCard
            icon={kpiIcons.invoice}
            label={t('financeStatement.customerOutstanding')}
            value={summary ? money(summary.customer_outstanding, currency) : t('common.noValue')}
            hint={t('financeStatement.customerOutstandingHint')}
            tone={summary && summary.customer_outstanding > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            icon={kpiIcons.settlement}
            label={t('financeStatement.driverOutstanding')}
            value={summary ? money(summary.driver_outstanding, currency) : t('common.noValue')}
            hint={t('financeStatement.driverOutstandingHint')}
            tone={summary && summary.driver_outstanding > 0 ? 'warning' : 'default'}
          />
        </div>
      </section>

      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <DateRangeFilter from={list.dateFrom} to={list.dateTo} onChange={(from, to) => list.setFilters({ date_from: from, date_to: to })} />
        <JobProjectFilters
          jobId={list.jobId}
          projectId={projectId}
          onProjectChange={(value) => list.setFilters({ project: value, project_id: '', job_id: '', unassigned: '' })}
          onJobChange={(value) => list.setFilter('job_id', value)}
        />
        <div className="mz-segment" role="radiogroup" aria-label={t('financeStatement.title')}>
          <label className={view === 'projects' ? 'is-active' : undefined}>
            <input
              type="radio"
              name="statement-view"
              checked={view === 'projects'}
              onChange={() => list.setFilter('view', '')}
            />
            {t('financeStatement.byProject')}
          </label>
          <label className={view === 'jobs' ? 'is-active' : undefined}>
            <input
              type="radio"
              name="statement-view"
              checked={view === 'jobs'}
              onChange={() => list.setFilter('view', 'jobs')}
            />
            {t('financeStatement.byJob')}
          </label>
        </div>
        {projectId || unassigned ? (
          <>
            <span>{t('financeStatement.filteredProject', { name: filterName || projectId })}</span>
            <button type="button" className="mz-link" onClick={() => list.setFilters({ project: '', project_id: '', job_id: '', unassigned: '', view: '' })}>
              {t('financeStatement.showAll')}
            </button>
          </>
        ) : null}
      </FilterBar>

      {view === 'projects' ? (
        <DataTable
          columns={projectColumns}
          rows={statement?.projects ?? []}
          rowKey={(row) => row.id ?? 'unassigned'}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <DataTable
          columns={jobColumns}
          rows={statement?.jobs ?? []}
          rowKey={(row) => row.id}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          rowTo={(row) => `/jobs/${row.id}`}
        />
      )}
    </div>
  )
}

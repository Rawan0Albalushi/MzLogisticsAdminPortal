import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchWallet, fetchWalletTransactions } from '@/core/api/services.ts'
import type { WalletTransaction } from '@/core/api/types.ts'
import { DateRangeFilter, FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { WALLET_TRANSACTION_TYPES } from '@/core/constants/statuses.ts'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { displayValue, formatCommissionRate, formatDateTime, formatMoney, organizationName } from '@/shared/utils/format.ts'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createReportDocument, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

export function WalletDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const list = useListQuery()
  const walletQuery = useQuery({
    queryKey: ['wallet', id],
    queryFn: () => fetchWallet(id),
    enabled: Boolean(id),
  })
  const ledgerQuery = useQuery({
    queryKey: ['wallet', id, 'transactions', list.search, list.type, list.dateFrom, list.dateTo, list.page],
    queryFn: () =>
      fetchWalletTransactions(id, {
        search: list.search,
        type: list.type,
        date_from: list.dateFrom,
        date_to: list.dateTo,
        page: list.page,
      }),
    enabled: Boolean(id),
  })

  if (walletQuery.isLoading) {
    return <LoadingState />
  }

  if (walletQuery.isError || !walletQuery.data) {
    return <ErrorState onRetry={() => void walletQuery.refetch()} />
  }

  const wallet = walletQuery.data
  const providerName = organizationName(wallet.organization)
  const currency = wallet.currency ?? undefined
  const providerLink = wallet.organization ? (
    <Link className="mz-link" to={`/providers/${wallet.organization.id}`}>
      {providerName}
    </Link>
  ) : null

  const columns: Column<WalletTransaction>[] = [
    { id: 'ref', header: t('common.reference'), cell: (row) => row.reference },
    {
      id: 'type',
      header: t('common.type'),
      cell: (row) => <StatusBadge status={row.type} />,
    },
    { id: 'amount', header: t('common.amount'), cell: (row) => formatMoney(row.amount, row.currency ?? undefined) },
    {
      id: 'job',
      header: t('nav.jobs'),
      cell: (row) =>
        row.job ? (
          <Link className="mz-link" to={`/jobs/${row.job.id}`}>
            {row.job.reference}
          </Link>
        ) : (
          displayValue(null)
        ),
    },
    {
      id: 'payment',
      header: t('nav.payments'),
      cell: (row) =>
        row.payment ? (
          <Link className="mz-link" to="/payments">
            {row.payment.reference}
          </Link>
        ) : (
          displayValue(null)
        ),
    },
    { id: 'created', header: t('common.createdAt'), cell: (row) => formatDateTime(row.created_at) },
  ]

  return (
    <>
      <PageHeader
        title={t('wallets.detailTitle', { name: providerName })}
        subtitle={t('wallets.detailSubtitle')}
        crumbs={[{ label: t('wallets.title'), to: '/wallets' }, { label: providerName }]}
        actions={
          <DownloadReportButton
            build={async () => {
              const items = await fetchAllPages((page, perPage) =>
                fetchWalletTransactions(id, {
                  search: list.search,
                  type: list.type,
                  date_from: list.dateFrom,
                  date_to: list.dateTo,
                  page,
                  per_page: perPage,
                }),
              )
              return createReportDocument({
                title: t('wallets.detailTitle', { name: providerName }),
                subtitle: t('wallets.detailSubtitle'),
                filters: listReportFilters(t, list),
                sections: [
                  {
                    title: t('wallets.balancesSection'),
                    metrics: [
                      { label: t('wallets.pending'), value: formatMoney(wallet.pending_balance, currency) },
                      { label: t('wallets.available'), value: formatMoney(wallet.available_balance, currency) },
                      { label: t('wallets.reserved'), value: formatMoney(wallet.reserved_balance, currency) },
                      { label: t('wallets.outstanding'), value: formatMoney(wallet.outstanding_balance, currency) },
                      { label: t('wallets.lifetimeEarned'), value: formatMoney(wallet.lifetime_earned, currency) },
                      { label: t('wallets.lifetimeWithdrawn'), value: formatMoney(wallet.lifetime_withdrawn, currency) },
                    ],
                  },
                  {
                    title: t('wallets.ledger'),
                    table: {
                      columns: [
                        t('common.reference'),
                        t('common.type'),
                        t('common.amount'),
                        t('nav.jobs'),
                        t('nav.payments'),
                        t('common.createdAt'),
                      ],
                      rows: items.map((row) => [
                        row.reference,
                        reportStatus(t, row.type),
                        formatMoney(row.amount, row.currency ?? undefined),
                        displayValue(row.job?.reference),
                        displayValue(row.payment?.reference),
                        formatDateTime(row.created_at),
                      ]),
                    },
                  },
                ],
              })
            }}
          />
        }
      />

      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="wallets" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{providerName}</h2>
                <p className="mz-profile__aka">{formatMoney(wallet.available_balance, currency)}</p>
                <div className="mz-profile__contacts">
                  {wallet.organization ? (
                    <Link className="mz-profile__chip" to={`/providers/${wallet.organization.id}`}>
                      <AppIcon name="providers" />
                      {providerName}
                    </Link>
                  ) : null}
                  {wallet.organization?.city ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="city" />
                      {wallet.organization.city}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="wallets" title={t('wallets.balancesSection')} />
            <InfoGrid
              fields={[
                { icon: 'clock', label: t('wallets.pending'), value: formatMoney(wallet.pending_balance, currency) },
                { icon: 'payments', label: t('wallets.available'), value: formatMoney(wallet.available_balance, currency) },
                { icon: 'roles', label: t('wallets.reserved'), value: formatMoney(wallet.reserved_balance, currency) },
                { icon: 'settlements', label: t('wallets.outstanding'), value: formatMoney(wallet.outstanding_balance, currency) },
              ]}
            />
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="reports" title={t('wallets.lifetimeSection')} />
              <InfoGrid
                fields={[
                  { icon: 'commission', label: t('wallets.lifetimeEarned'), value: formatMoney(wallet.lifetime_earned, currency) },
                  { icon: 'settlements', label: t('wallets.lifetimeWithdrawn'), value: formatMoney(wallet.lifetime_withdrawn, currency) },
                ]}
              />
            </div>
          </section>
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="providers" title={t('customers.accountSection')} />
              <InfoGrid
                fields={[
                  { icon: 'providers', label: t('common.provider'), value: providerLink },
                  {
                    icon: 'commission',
                    label: t('providers.commissionRate'),
                    value: formatCommissionRate(
                      wallet.organization?.effective_commission_rate ?? wallet.organization?.commission_rate,
                    ),
                  },
                  { icon: 'payments', label: t('common.currency'), value: wallet.currency },
                ]}
              />
            </div>
          </section>
        </div>
      </div>

      <SectionTitle icon="invoices" title={t('wallets.ledger')} />
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
        />
        <StatusFilter
          value={list.type}
          options={[...WALLET_TRANSACTION_TYPES]}
          onChange={(value) => list.setFilter('type', value)}
          allLabel={t('common.allTypes')}
          label={(type) => t(`status.${type}`, { defaultValue: type })}
        />
        <DateRangeFilter
          from={list.dateFrom}
          to={list.dateTo}
          onChange={(nextFrom, nextTo) => list.setFilters({ date_from: nextFrom, date_to: nextTo })}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={ledgerQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={ledgerQuery.isLoading}
        isError={ledgerQuery.isError}
        onRetry={() => void ledgerQuery.refetch()}
        meta={ledgerQuery.data?.meta}
        onPageChange={list.setPage}
      />
    </>
  )
}

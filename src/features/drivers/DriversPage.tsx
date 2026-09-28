import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createDriver, fetchDrivers, updateDriver, type SpreadsheetImportError } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { DRIVER_LIST_STATUSES } from '@/core/constants/statuses.ts'
import type { AuthUser } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { displayValue, formatDate, formatDateTime, formatMoney, organizationName } from '@/shared/utils/format.ts'
import { ExcelImportDialog } from '@/shared/components/ExcelImportDialog.tsx'
import { DownloadReportButton } from '@/shared/reports/DownloadReportButton.tsx'
import { createListReport, listReportFilters, reportStatus } from '@/shared/reports/buildReport.ts'
import { fetchAllPages } from '@/shared/reports/fetchAllPages.ts'

type Owner = 'platform' | 'provider'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  license_number: '',
  license_expires_at: '',
  trip_rate: '',
  status: 'available',
}

export function DriversPage() {
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const list = useListQuery()
  const queryClient = useQueryClient()
  const canManage = hasPermission(PERMISSIONS.DRIVERS_MANAGE)
  const [owner, setOwner] = useState<Owner>('platform')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AuthUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const query = useQuery({
    queryKey: ['drivers', owner, list.search, list.status, list.page],
    queryFn: () => fetchDrivers({ search: list.search, status: list.status, page: list.page, owner }),
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        license_number: form.license_number.trim() || undefined,
        license_expires_at: form.license_expires_at || undefined,
        ...(owner === 'platform' ? { trip_rate: form.trip_rate === '' ? null : Number(form.trip_rate) } : {}),
        ...(editing ? { status: form.status } : {}),
      }
      if (editing) {
        return updateDriver(editing.id, payload)
      }
      return createDriver(payload)
    },
    onSuccess: async () => {
      setFormOpen(false)
      setError('')
      setFeedback(t('drivers.saved'))
      await queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
    onError: (err) => setError(getApiMessage(err, t('drivers.saveFailed'))),
  })

  function switchOwner(next: Owner) {
    setOwner(next)
    setFeedback('')
    list.setPage(1)
  }

  function openForm(row?: AuthUser) {
    setEditing(row ?? null)
    setError('')
    setForm(
      row
        ? {
            name: row.name,
            phone: row.phone ?? '',
            email: row.email ?? '',
            license_number: row.driver_profile?.license_number ?? '',
            license_expires_at: row.driver_profile?.license_expires_at?.slice(0, 10) ?? '',
            trip_rate: row.driver_profile?.trip_rate != null ? String(row.driver_profile.trip_rate) : '',
            status: row.driver_profile?.status ?? 'available',
          }
        : emptyForm,
    )
    setFormOpen(true)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  const subtitle = owner === 'platform' ? t('drivers.platformSubtitle') : t('drivers.providerSubtitle')
  const columns: Column<AuthUser>[] = [
    { id: 'name', header: t('common.name'), cell: (row) => row.name },
    { id: 'phone', header: t('common.phone'), cell: (row) => displayValue(row.phone) },
    { id: 'license', header: t('drivers.license'), cell: (row) => displayValue(row.driver_profile?.license_number) },
    { id: 'expiry', header: t('drivers.licenseExpiry'), cell: (row) => formatDate(row.driver_profile?.license_expires_at) },
    ...(owner === 'platform'
      ? [{ id: 'rate', header: t('drivers.tripRate'), cell: (row: AuthUser) => formatMoney(row.driver_profile?.trip_rate) }]
      : []),
    ...(owner === 'provider'
      ? [{ id: 'company', header: t('drivers.company'), cell: (row: AuthUser) => organizationName(row.organization) }]
      : []),
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.driver_profile?.status} /> },
    { id: 'login', header: t('drivers.lastLogin'), cell: (row) => formatDateTime(row.last_login_at) },
    ...(owner === 'platform' && canManage
      ? [
          {
            id: 'actions',
            header: t('common.actions'),
            cell: (row: AuthUser) => (
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => openForm(row)}>
                {t('common.edit')}
              </button>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader
        title={t('drivers.title')}
        subtitle={subtitle}
        actions={
          <>
            {owner === 'platform' && canManage ? (
              <>
                <button type="button" className="mz-btn mz-btn--primary" onClick={() => openForm()}>
                  {t('drivers.add')}
                </button>
                <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setImportOpen(true)}>
                  {t('drivers.import')}
                </button>
              </>
            ) : null}
            <DownloadReportButton
              build={async () => {
                const items = await fetchAllPages((page, perPage) =>
                  fetchDrivers({ search: list.search, status: list.status, page, per_page: perPage, owner }),
                )
                return createListReport({
                  title: t('drivers.title'),
                  subtitle,
                  filters: listReportFilters(t, list),
                  columns: [
                    t('common.name'),
                    t('common.phone'),
                    t('drivers.license'),
                    t('drivers.licenseExpiry'),
                    ...(owner === 'platform' ? [t('drivers.tripRate')] : []),
                    t('common.status'),
                    t('drivers.lastLogin'),
                  ],
                  rows: items.map((row) => [
                    row.name,
                    displayValue(row.phone),
                    displayValue(row.driver_profile?.license_number),
                    formatDate(row.driver_profile?.license_expires_at),
                    ...(owner === 'platform' ? [formatMoney(row.driver_profile?.trip_rate)] : []),
                    reportStatus(t, row.driver_profile?.status),
                    formatDateTime(row.last_login_at),
                  ]),
                })
              }}
            />
          </>
        }
      />
      <div className="mz-owner-switch">
      <div className="mz-segment" role="radiogroup" aria-label={t('drivers.title')}>
        <label className={owner === 'platform' ? 'is-active' : undefined}>
          <input type="radio" name="driver-owner" checked={owner === 'platform'} onChange={() => switchOwner('platform')} />
          {t('drivers.platformTab')}
        </label>
        <label className={owner === 'provider' ? 'is-active' : undefined}>
          <input type="radio" name="driver-owner" checked={owner === 'provider'} onChange={() => switchOwner('provider')} />
          {t('drivers.providerTab')}
        </label>
      </div>
      </div>
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <StatusFilter
          value={list.status}
          options={[...DRIVER_LIST_STATUSES]}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        meta={query.data?.meta}
        onPageChange={list.setPage}
      />
      <ConfirmDialog
        open={formOpen}
        title={editing ? t('drivers.edit') : t('drivers.add')}
        confirmLabel={save.isPending ? t('common.saving') : t('common.save')}
        busy={save.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('driver-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setFormOpen(false)}
      >
        <form id="driver-form" className="mz-form" onSubmit={onSubmit}>
          {error ? <div className="mz-alert">{error}</div> : null}
          <FormField label={t('common.name')} htmlFor="driver-name" required>
            <input id="driver-name" className="mz-input" value={form.name} required maxLength={120} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </FormField>
          <FormField label={t('common.phone')} htmlFor="driver-phone" required>
            <input id="driver-phone" className="mz-input" value={form.phone} required maxLength={32} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </FormField>
          <FormField label={t('common.email')} htmlFor="driver-email">
            <input id="driver-email" className="mz-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </FormField>
          <FormField label={t('drivers.license')} htmlFor="driver-license">
            <input id="driver-license" className="mz-input" value={form.license_number} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, license_number: event.target.value }))} />
          </FormField>
          <FormField label={t('drivers.licenseExpiry')} htmlFor="driver-expiry">
            <input id="driver-expiry" className="mz-input" type="date" value={form.license_expires_at} onChange={(event) => setForm((current) => ({ ...current, license_expires_at: event.target.value }))} />
          </FormField>
          {owner === 'platform' ? (
            <FormField label={t('drivers.tripRate')} htmlFor="driver-rate" hint={t('drivers.tripRateHint')}>
              <input id="driver-rate" className="mz-input" type="number" min="0" step="0.001" value={form.trip_rate} onChange={(event) => setForm((current) => ({ ...current, trip_rate: event.target.value }))} />
            </FormField>
          ) : null}
          {editing ? (
            <FormField label={t('common.status')} htmlFor="driver-status">
              <select id="driver-status" className="mz-select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                {DRIVER_LIST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}
        </form>
      </ConfirmDialog>
      <ExcelImportDialog
        open={importOpen}
        title={t('drivers.importTitle')}
        hint={t('drivers.importHint')}
        templatePath="/drivers/import-template"
        templateFilename="drivers-import-template.xlsx"
        importPath="/drivers/import"
        detailKeys={['name', 'phone', 'email', 'license_number']}
        localizeError={(rowError) => localizeDriverImportError(t, rowError)}
        onImported={async (imported) => {
          if (imported.created > 0) {
            setFeedback(t('import.summary', { created: imported.created, failed: imported.failed }))
            await queryClient.invalidateQueries({ queryKey: ['drivers'] })
          }
        }}
        onClose={() => setImportOpen(false)}
      />
    </>
  )
}

function localizeDriverImportError(t: (key: string) => string, error: SpreadsheetImportError): string {
  const message = error.message.toLowerCase()
  if (error.field === 'phone' && message.includes('already exists')) {
    return t('drivers.importPhoneTaken')
  }
  if (error.field === 'phone' && (message.includes('valid') || message.includes('required'))) {
    return t('drivers.importPhoneInvalid')
  }
  if (error.field === 'email' && message.includes('taken')) {
    return t('drivers.importEmailTaken')
  }
  return error.message
}

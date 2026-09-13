import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createTruckType, deleteTruckType, fetchTruckTypes, updateTruckType } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { CatalogTruckType } from '@/core/api/types.ts'
import { ACTIVE_STATUSES } from '@/core/constants/statuses.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar, StatusFilter } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { displayValue } from '@/shared/utils/format.ts'

const emptyForm = {
  code: '',
  name: '',
  name_ar: '',
  is_active: true,
  sort_order: '10',
}

export function TruckTypesPage() {
  const { t, i18n } = useTranslation()
  const list = useListQuery()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['truck-types'],
    queryFn: fetchTruckTypes,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogTruckType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CatalogTruckType | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const filteredRows = useMemo(() => {
    const items = query.data ?? []
    const term = list.search.trim().toLowerCase()
    return items.filter((row) => {
      if (term) {
        const haystack = `${row.name} ${row.name_ar} ${row.code}`.toLowerCase()
        if (!haystack.includes(term)) {
          return false
        }
      }
      if (list.status === 'active' && !row.is_active) {
        return false
      }
      if (list.status === 'inactive' && row.is_active) {
        return false
      }
      if (list.type === 'platform' && !row.is_platform) {
        return false
      }
      if (list.type === 'provider' && row.is_platform) {
        return false
      }
      return true
    })
  }, [list.search, list.status, list.type, query.data])

  function typeName(row: CatalogTruckType) {
    return i18n.language.startsWith('ar') && row.name_ar ? row.name_ar : row.name
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEdit(row: CatalogTruckType) {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      name_ar: row.name_ar,
      is_active: row.is_active,
      sort_order: String(row.sort_order),
    })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        name_ar: form.name_ar.trim(),
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        ...(editing ? {} : { code: form.code.trim() }),
      }
      return editing ? updateTruckType(editing.id, payload) : createTruckType({ ...payload, code: form.code.trim() })
    },
    onSuccess: async () => {
      setFeedback(editing ? t('truckTypes.updateSuccess') : t('truckTypes.createSuccess'))
      setError('')
      setFormOpen(false)
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['truck-types'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, editing ? t('truckTypes.updateFailed') : t('truckTypes.createFailed')))
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (row: CatalogTruckType) => updateTruckType(row.id, { is_active: !row.is_active }),
    onSuccess: async () => {
      setFeedback(t('truckTypes.updateSuccess'))
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['truck-types'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('truckTypes.updateFailed')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (row: CatalogTruckType) => deleteTruckType(row.id),
    onSuccess: async () => {
      setFeedback(t('truckTypes.deleteSuccess'))
      setError('')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['truck-types'] })
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setError(getApiMessage(err, t('truckTypes.deleteFailed')))
    },
  })

  const columns: Column<CatalogTruckType>[] = [
    { id: 'name', header: t('common.name'), cell: (row) => typeName(row) },
    { id: 'name_ar', header: t('truckTypes.nameAr'), cell: (row) => displayValue(row.name_ar) },
    { id: 'code', header: t('truckTypes.code'), cell: (row) => row.code },
    {
      id: 'source',
      header: t('truckTypes.source'),
      cell: (row) => (row.is_platform ? t('truckTypes.platform') : t('truckTypes.providerOwned')),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) =>
        row.can_manage ? (
          <div className="mz-table-actions">
            <button type="button" className="mz-btn mz-btn--ghost" onClick={() => openEdit(row)}>
              {t('truckTypes.edit')}
            </button>
            <button
              type="button"
              className="mz-btn mz-btn--ghost"
              onClick={() => toggleMutation.mutate(row)}
              disabled={toggleMutation.isPending}
            >
              {row.is_active ? t('truckTypes.disable') : t('truckTypes.enable')}
            </button>
            {!row.is_system ? (
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setDeleteTarget(row)}>
                {t('truckTypes.delete')}
              </button>
            ) : null}
          </div>
        ) : (
          <span style={{ color: 'var(--mz-muted)' }}>{t('truckTypes.readOnly')}</span>
        ),
    },
  ]

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('truckTypes.title')}
        subtitle={t('truckTypes.subtitle')}
        actions={
          <button type="button" className="mz-btn mz-btn--primary" onClick={openCreate}>
            {t('truckTypes.create')}
          </button>
        }
      />
      {feedback ? <div className="mz-alert mz-alert--ok" style={{ marginBottom: 12 }}>{feedback}</div> : null}
      {error ? <div className="mz-alert" style={{ marginBottom: 12 }}>{error}</div> : null}
      <FilterBar>
        <SearchInput value={list.search} onChange={(value) => list.setFilter('search', value)} />
        <StatusFilter
          value={list.status}
          options={[...ACTIVE_STATUSES]}
          onChange={(value) => list.setFilter('status', value)}
          allLabel={t('common.allStatuses')}
          label={(status) => t(`status.${status}`)}
        />
        <StatusFilter
          value={list.type}
          options={['platform', 'provider']}
          onChange={(value) => list.setFilter('type', value)}
          allLabel={t('common.allSources')}
          label={(value) => (value === 'platform' ? t('truckTypes.platform') : t('truckTypes.providerOwned'))}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={filteredRows}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={() => void query.refetch()}
      />

      <ConfirmDialog
        open={formOpen}
        title={editing ? t('truckTypes.editTitle') : t('truckTypes.createTitle')}
        confirmLabel={saveMutation.isPending ? t('common.saving') : t('common.save')}
        busy={saveMutation.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('truck-type-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setFormOpen(false)}
      >
        <form id="truck-type-form" className="mz-form" onSubmit={onSubmit}>
          <FormField label={t('truckTypes.code')} htmlFor="truck-type-code" required hint={t('truckTypes.codeHint')}>
            <input
              id="truck-type-code"
              className="mz-input"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              required
              disabled={Boolean(editing)}
            />
          </FormField>
          <FormField label={t('truckTypes.nameEn')} htmlFor="truck-type-name" required>
            <input
              id="truck-type-name"
              className="mz-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('truckTypes.nameAr')} htmlFor="truck-type-name-ar" required>
            <input
              id="truck-type-name-ar"
              className="mz-input"
              value={form.name_ar}
              onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))}
              required
            />
          </FormField>
          <FormField label={t('truckTypes.sortOrder')} htmlFor="truck-type-sort">
            <input
              id="truck-type-sort"
              className="mz-input"
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
            />
          </FormField>
          <label className="mz-check">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            {t('truckTypes.active')}
          </label>
        </form>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('truckTypes.deleteTitle')}
        confirmLabel={t('truckTypes.delete')}
        danger
        busy={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      >
        <p>{t('truckTypes.deleteBody')}</p>
      </ConfirmDialog>
    </>
  )
}

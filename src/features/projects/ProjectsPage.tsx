import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createProject, fetchProjects } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import type { Project } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { useListQuery } from '@/shared/hooks/useListQuery.ts'

const emptyForm = { project_id: '', name_en: '', name_ar: '' }

export function ProjectsPage() {
  const { t } = useTranslation()
  const { user, hasPermission } = useAuth()
  const canManage = user?.user_type === 'platform' && hasPermission(PERMISSIONS.JOBS_MANAGE)
  const list = useListQuery()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['projects', list.search, list.page],
    queryFn: () => fetchProjects({ search: list.search, page: list.page }),
  })
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const saveMutation = useMutation({
    mutationFn: () =>
      createProject({
        project_id: form.project_id.trim(),
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
      }),
    onSuccess: async () => {
      setFormOpen(false)
      setForm(emptyForm)
      setError('')
      setFeedback(t('projects.saved'))
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (reason) => setError(getApiMessage(reason, t('common.error'))),
  })

  const columns: Column<Project>[] = [
    {
      id: 'id',
      header: t('projects.projectId'),
      cell: (row) => (
        <Link className="mz-link" to={`/projects/${row.id}`}>
          {row.project_id}
        </Link>
      ),
    },
    { id: 'nameEn', header: t('projects.nameEn'), cell: (row) => row.name_en },
    { id: 'nameAr', header: t('projects.nameAr'), cell: (row) => row.name_ar },
    { id: 'jobs', header: t('projects.jobsCount'), cell: (row) => row.jobs_count ?? 0 },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <Link className="mz-link" to={`/projects/${row.id}`}>
          {t('common.view')}
        </Link>
      ),
    },
  ]

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    saveMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
        actions={
          canManage ? (
            <button
              type="button"
              className="mz-btn mz-btn--primary"
              onClick={() => {
                setForm(emptyForm)
                setError('')
                setFormOpen(true)
              }}
            >
              {t('projects.create')}
            </button>
          ) : null
        }
      />
      {feedback ? (
        <div className="mz-alert mz-alert--ok" style={{ marginBottom: 12 }}>
          {feedback}
        </div>
      ) : null}
      <FilterBar>
        <SearchInput
          value={list.search}
          onChange={(value) => list.setFilter('search', value)}
          placeholder={t('common.searchReference')}
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
        rowTo={(row) => `/projects/${row.id}`}
      />
      <ConfirmDialog
        open={formOpen}
        title={t('projects.create')}
        confirmLabel={saveMutation.isPending ? t('common.saving') : t('common.save')}
        busy={saveMutation.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('project-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setFormOpen(false)}
      >
        <form id="project-form" className="mz-form" onSubmit={onSubmit}>
          {error ? <div className="mz-alert">{error}</div> : null}
          <FormField label={t('projects.projectId')} htmlFor="project-id" required>
            <input
              id="project-id"
              className="mz-input"
              value={form.project_id}
              onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
              required
              maxLength={64}
            />
          </FormField>
          <FormField label={t('projects.nameEn')} htmlFor="project-name-en" required>
            <input
              id="project-name-en"
              className="mz-input"
              value={form.name_en}
              onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value }))}
              required
              maxLength={120}
            />
          </FormField>
          <FormField label={t('projects.nameAr')} htmlFor="project-name-ar" required>
            <input
              id="project-name-ar"
              className="mz-input"
              dir="rtl"
              value={form.name_ar}
              onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))}
              required
              maxLength={120}
            />
          </FormField>
        </form>
      </ConfirmDialog>
    </>
  )
}

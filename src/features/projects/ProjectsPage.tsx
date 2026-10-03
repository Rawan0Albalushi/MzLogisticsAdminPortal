import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createProject, fetchProjects, updateProject } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import type { Project } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FilterBar } from '@/shared/components/FilterBar.tsx'
import { SearchInput } from '@/shared/components/SearchInput.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { TableIconButton } from '@/shared/components/TableIconButton.tsx'
import { ProjectFormDialog } from '@/features/projects/ProjectFormDialog.tsx'
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
  const [editing, setEditing] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        project_id: form.project_id.trim(),
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
      }
      return editing ? updateProject(editing.id, payload) : createProject(payload)
    },
    onSuccess: async () => {
      setFormOpen(false)
      setEditing(null)
      setForm(emptyForm)
      setError('')
      setFeedback(t('projects.saved'))
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (editing) {
        await queryClient.invalidateQueries({ queryKey: ['project', String(editing.id)] })
      }
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
        <div className="mz-table-actions">
          <TableIconButton icon="view" label={t('common.view')} to={`/projects/${row.id}`} />
          {canManage ? (
            <TableIconButton
              icon="edit"
              label={t('common.edit')}
              onClick={() => {
                setEditing(row)
                setForm({ project_id: row.project_id, name_en: row.name_en, name_ar: row.name_ar })
                setError('')
                setFormOpen(true)
              }}
            />
          ) : null}
        </div>
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
                setEditing(null)
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
      <ProjectFormDialog
        open={formOpen}
        title={editing ? t('projects.edit') : t('projects.create')}
        formId="project-form"
        form={form}
        error={error}
        busy={saveMutation.isPending}
        onChange={setForm}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={onSubmit}
      />
    </>
  )
}

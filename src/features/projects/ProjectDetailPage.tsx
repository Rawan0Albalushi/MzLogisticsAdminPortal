import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { attachProjectJob, detachProjectJob, fetchJobs, fetchProject, updateProject } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import type { TransportJob } from '@/core/api/types.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { EmptyState } from '@/shared/components/EmptyState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { DataTable, type Column } from '@/shared/components/DataTable.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { organizationName, projectName } from '@/shared/utils/format.ts'

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { user, hasPermission } = useAuth()
  const canManage = user?.user_type === 'platform' && hasPermission(PERMISSIONS.JOBS_MANAGE)
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['project', id], queryFn: () => fetchProject(id), enabled: Boolean(id) })
  const unassigned = useQuery({
    queryKey: ['jobs', 'without-project'],
    queryFn: () => fetchJobs({ without_project: true, per_page: 50, page: 1 }),
    enabled: canManage,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ project_id: '', name_en: '', name_ar: '' })
  const [jobId, setJobId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project', id] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['jobs'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProject(id, {
        project_id: form.project_id.trim(),
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim(),
      }),
    onSuccess: async () => {
      setFormOpen(false)
      setError('')
      setFeedback(t('projects.saved'))
      await refresh()
    },
    onError: (reason) => setError(getApiMessage(reason, t('common.error'))),
  })

  const attachMutation = useMutation({
    mutationFn: () => attachProjectJob(id, Number(jobId)),
    onSuccess: async () => {
      setJobId('')
      setError('')
      setFeedback(t('projects.attached'))
      await refresh()
    },
    onError: (reason) => setError(getApiMessage(reason, t('common.error'))),
  })

  const detachMutation = useMutation({
    mutationFn: (targetId: number) => detachProjectJob(id, targetId),
    onSuccess: async () => {
      setError('')
      setFeedback(t('projects.detached'))
      await refresh()
    },
    onError: (reason) => setError(getApiMessage(reason, t('common.error'))),
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const project = query.data
  const jobs = project.jobs ?? []
  const unassignedJobs = unassigned.data?.items ?? []

  const columns: Column<TransportJob>[] = [
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
    { id: 'status', header: t('common.status'), cell: (row) => <StatusBadge status={row.status} /> },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: (row) => (
        <span style={{ display: 'inline-flex', gap: 12 }}>
          <Link className="mz-link" to={`/jobs/${row.id}`}>
            {t('common.view')}
          </Link>
          {canManage ? (
            <button
              type="button"
              className="mz-link"
              style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
              disabled={detachMutation.isPending}
              onClick={() => detachMutation.mutate(row.id)}
            >
              {t('projects.detach')}
            </button>
          ) : null}
        </span>
      ),
    },
  ]

  function openEdit() {
    setForm({
      project_id: project.project_id,
      name_en: project.name_en,
      name_ar: project.name_ar,
    })
    setError('')
    setFormOpen(true)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={projectName(project)}
        subtitle={project.project_id}
        crumbs={[{ label: t('projects.title'), to: '/projects' }, { label: project.project_id }]}
        actions={
          canManage ? (
            <button type="button" className="mz-btn mz-btn--ghost" onClick={openEdit}>
              {t('projects.edit')}
            </button>
          ) : null
        }
      />
      {feedback ? (
        <div className="mz-alert mz-alert--ok" style={{ marginBottom: 12 }}>
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="mz-alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}
      <section className="mz-card" style={{ marginBottom: 16 }}>
        <div className="mz-card__body">
          <InfoGrid
            fields={[
              { icon: 'projects', label: t('projects.projectId'), value: project.project_id },
              { icon: 'projects', label: t('projects.nameEn'), value: project.name_en },
              { icon: 'projects', label: t('projects.nameAr'), value: project.name_ar },
              { icon: 'jobs', label: t('projects.jobsCount'), value: String(project.jobs_count ?? jobs.length) },
            ]}
          />
        </div>
      </section>
      <section className="mz-card">
        <div className="mz-card__body">
          <SectionTitle icon="jobs" title={t('projects.jobs')} />
          {canManage ? (
            <form
              className="mz-form"
              style={{ maxWidth: 520, marginBottom: 16 }}
              onSubmit={(event) => {
                event.preventDefault()
                if (jobId) {
                  attachMutation.mutate()
                }
              }}
            >
              <FormField label={t('projects.unassigned')} htmlFor="project-job">
                <select
                  id="project-job"
                  className="mz-input"
                  value={jobId}
                  onChange={(event) => setJobId(event.target.value)}
                >
                  <option value="">{t('projects.unassigned')}</option>
                  {unassignedJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.reference}
                      {job.customer ? ` · ${organizationName(job.customer)}` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
              <button type="submit" className="mz-btn mz-btn--primary" disabled={!jobId || attachMutation.isPending}>
                {t('projects.attach')}
              </button>
            </form>
          ) : null}
          {canManage && !unassigned.isLoading && unassignedJobs.length === 0 ? (
            <p style={{ color: 'var(--mz-muted)', marginTop: 0 }}>{t('projects.noUnassigned')}</p>
          ) : null}
          {jobs.length === 0 ? (
            <EmptyState title={t('projects.noJobs')} hint={t('projects.subtitle')} />
          ) : (
            <DataTable columns={columns} rows={jobs} rowKey={(row) => row.id} rowTo={(row) => `/jobs/${row.id}`} />
          )}
        </div>
      </section>
      <ConfirmDialog
        open={formOpen}
        title={t('projects.edit')}
        confirmLabel={saveMutation.isPending ? t('common.saving') : t('common.save')}
        busy={saveMutation.isPending}
        onConfirm={() => {
          const formEl = document.getElementById('project-edit-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setFormOpen(false)}
      >
        <form id="project-edit-form" className="mz-form" onSubmit={onSubmit}>
          <FormField label={t('projects.projectId')} htmlFor="edit-project-id" required>
            <input
              id="edit-project-id"
              className="mz-input"
              value={form.project_id}
              onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
              required
              maxLength={64}
            />
          </FormField>
          <FormField label={t('projects.nameEn')} htmlFor="edit-project-name-en" required>
            <input
              id="edit-project-name-en"
              className="mz-input"
              value={form.name_en}
              onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value }))}
              required
              maxLength={120}
            />
          </FormField>
          <FormField label={t('projects.nameAr')} htmlFor="edit-project-name-ar" required>
            <input
              id="edit-project-name-ar"
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

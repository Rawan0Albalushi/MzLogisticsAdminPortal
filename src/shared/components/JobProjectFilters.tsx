import { useQuery } from '@tanstack/react-query'
import { fetchJob, fetchProject } from '@/core/api/services.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { JobFilter } from '@/shared/components/JobFilter.tsx'
import { ProjectFilter } from '@/shared/components/ProjectFilter.tsx'
import { projectName } from '@/shared/utils/format.ts'

export function useRecordScopeLabels(jobId: string, projectId: string) {
  const { user, hasPermission } = useAuth()
  const canJob = hasPermission(PERMISSIONS.JOBS_VIEW)
  const canProject = canJob && user?.user_type !== 'customer'
  const job = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId),
    enabled: canJob && Boolean(jobId),
  })
  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: canProject && Boolean(projectId),
  })

  return {
    jobLabel: job.data?.reference || jobId,
    projectLabel: project.data ? projectName(project.data) : projectId,
  }
}

interface JobProjectFiltersProps {
  jobId: string
  projectId: string
  onJobChange: (value: string) => void
  onProjectChange: (value: string) => void
  showJob?: boolean
}

export function JobProjectFilters({ jobId, projectId, onJobChange, onProjectChange, showJob = true }: JobProjectFiltersProps) {
  const { user, hasPermission } = useAuth()
  const canFilterByJob = showJob && hasPermission(PERMISSIONS.JOBS_VIEW)
  const canFilterByProject = hasPermission(PERMISSIONS.JOBS_VIEW) && user?.user_type !== 'customer'
  const labels = useRecordScopeLabels(canFilterByJob ? jobId : '', canFilterByProject ? projectId : '')

  return (
    <>
      {canFilterByProject ? (
        <ProjectFilter value={projectId} label={labels.projectLabel || undefined} onChange={onProjectChange} />
      ) : null}
      {canFilterByJob ? (
        <JobFilter value={jobId} label={labels.jobLabel || undefined} projectId={projectId} onChange={onJobChange} />
      ) : null}
    </>
  )
}

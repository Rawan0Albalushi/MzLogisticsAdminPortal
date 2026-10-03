import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectInput } from '@/core/api/types.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'

interface ProjectFormDialogProps {
  open: boolean
  title: string
  formId: string
  form: ProjectInput
  error: string
  busy: boolean
  onChange: (form: ProjectInput) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ProjectFormDialog({
  open,
  title,
  formId,
  form,
  error,
  busy,
  onChange,
  onClose,
  onSubmit,
}: ProjectFormDialogProps) {
  const { t } = useTranslation()

  return (
    <ConfirmDialog
      open={open}
      title={title}
      confirmLabel={busy ? t('common.saving') : t('common.save')}
      busy={busy}
      onConfirm={() => {
        const formEl = document.getElementById(formId) as HTMLFormElement | null
        formEl?.requestSubmit()
      }}
      onClose={onClose}
    >
      <form id={formId} className="mz-form" onSubmit={onSubmit}>
        {error ? <div className="mz-alert">{error}</div> : null}
        <FormField label={t('projects.projectId')} htmlFor={`${formId}-id`} required>
          <input
            id={`${formId}-id`}
            className="mz-input"
            value={form.project_id}
            onChange={(event) => onChange({ ...form, project_id: event.target.value })}
            required
            maxLength={64}
          />
        </FormField>
        <FormField label={t('projects.nameEn')} htmlFor={`${formId}-name-en`} required>
          <input
            id={`${formId}-name-en`}
            className="mz-input"
            value={form.name_en}
            onChange={(event) => onChange({ ...form, name_en: event.target.value })}
            required
            maxLength={120}
          />
        </FormField>
        <FormField label={t('projects.nameAr')} htmlFor={`${formId}-name-ar`} required>
          <input
            id={`${formId}-name-ar`}
            className="mz-input"
            dir="rtl"
            value={form.name_ar}
            onChange={(event) => onChange({ ...form, name_ar: event.target.value })}
            required
            maxLength={120}
          />
        </FormField>
      </form>
    </ConfirmDialog>
  )
}

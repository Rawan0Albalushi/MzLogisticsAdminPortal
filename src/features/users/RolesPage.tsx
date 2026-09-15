import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createRole, deleteRole, fetchAccessCatalog, updateRolePermissions } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { LIVE_TRACKING_ENABLED } from '@/core/constants/features.ts'
import { PERMISSION_GROUPS, PERMISSIONS } from '@/core/constants/permissions.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { roleLabel } from '@/features/users/roleLabel.ts'

export function RolesPage() {
  const { t } = useTranslation()
  const { refreshUser, hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['access-catalog'], queryFn: fetchAccessCatalog })
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createChecked, setCreateChecked] = useState<string[]>([PERMISSIONS.DASHBOARD_VIEW])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const canCreate = hasPermission('roles.manage')

  useEffect(() => {
    if (!query.data || selected) {
      return
    }
    setSelected(query.data.platform_roles[0] ?? query.data.roles[0]?.name ?? '')
  }, [query.data, selected])

  const current = useMemo(
    () => query.data?.roles.find((role) => role.name === selected),
    [query.data, selected],
  )
  const canEdit = Boolean(current?.can_manage)
  const permissionGroups = useMemo(() => {
    const available = new Set(query.data?.permissions ?? [])
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      keys: group.keys.filter(
        (key) => available.has(key) && (LIVE_TRACKING_ENABLED || key !== PERMISSIONS.TRACKING_VIEW),
      ),
    })).filter((group) => group.keys.length > 0)
  }, [query.data?.permissions])

  useEffect(() => {
    setChecked(current?.permissions ?? [])
  }, [current])

  const saveMutation = useMutation({
    mutationFn: () => updateRolePermissions(selected, checked),
    onSuccess: async () => {
      setError('')
      setFeedback(t('rolesPage.saveSuccess'))
      await queryClient.invalidateQueries({ queryKey: ['access-catalog'] })
      await refreshUser()
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('rolesPage.saveFailed')))
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createRole({ name: createName.trim(), permissions: createChecked }),
    onSuccess: async (role) => {
      setError('')
      setFeedback(t('rolesPage.createSuccess'))
      setCreateOpen(false)
      setCreateName('')
      setCreateChecked([PERMISSIONS.DASHBOARD_VIEW])
      setSelected(role.name)
      await queryClient.invalidateQueries({ queryKey: ['access-catalog'] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('rolesPage.createFailed')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRole(selected),
    onSuccess: async () => {
      setError('')
      setFeedback(t('rolesPage.deleteSuccess'))
      setDeleteOpen(false)
      setSelected('')
      await queryClient.invalidateQueries({ queryKey: ['access-catalog'] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('rolesPage.deleteFailed')))
    },
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  function toggle(list: string[], permission: string) {
    return list.includes(permission) ? list.filter((item) => item !== permission) : [...list, permission]
  }

  function toggleGroup(list: string[], keys: readonly string[]) {
    const allOn = keys.every((key) => list.includes(key))
    if (allOn) {
      return list.filter((item) => !keys.includes(item))
    }
    return [...new Set([...list, ...keys])]
  }

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={t('rolesPage.title')}
        subtitle={t('rolesPage.subtitle')}
        actions={
          canCreate ? (
            <button type="button" className="mz-btn mz-btn--primary" onClick={() => setCreateOpen(true)}>
              {t('rolesPage.create')}
            </button>
          ) : null
        }
      />
      {feedback ? <div className="mz-alert mz-alert--ok mz-section-alert">{feedback}</div> : null}
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}

      <div className="mz-role-layout">
        <aside className="mz-card">
          <div className="mz-card__body">
            <h2 className="mz-card__title">{t('rolesPage.list')}</h2>
            <div className="mz-role-list">
              {query.data.roles.map((role) => (
                <button
                  key={role.name}
                  type="button"
                  className={`mz-role-list__item${selected === role.name ? ' is-active' : ''}`}
                  onClick={() => setSelected(role.name)}
                >
                  <strong>{roleLabel(role.name, query.data.roles, t)}</strong>
                  <span className="mz-role-list__meta">
                    <span>
                      {role.users_count} {t('rolesPage.users')}
                    </span>
                    <span className={`mz-role-badge${role.is_system ? '' : ' mz-role-badge--custom'}`}>
                      {role.is_system ? t('rolesPage.system') : t('rolesPage.custom')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-card__head">
              <h2 className="mz-card__title">{roleLabel(selected, query.data.roles, t)}</h2>
              <div className="mz-role-actions">
                {current?.can_delete ? (
                  <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setDeleteOpen(true)}>
                    {t('common.delete')}
                  </button>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    className="mz-btn mz-btn--primary"
                    disabled={saveMutation.isPending || checked.length === 0}
                    onClick={() => saveMutation.mutate()}
                  >
                    {saveMutation.isPending ? t('common.saving') : t('common.save')}
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mz-login__hint">{canEdit ? t('rolesPage.hint') : t('rolesPage.readOnly')}</p>
            {permissionGroups.map((group) => (
              <fieldset key={group.id} className="mz-perm-group">
                <legend>
                  <label className="mz-check">
                    <input
                      type="checkbox"
                      checked={group.keys.every((key) => checked.includes(key))}
                      onChange={() => setChecked((currentChecked) => toggleGroup(currentChecked, group.keys))}
                      disabled={!canEdit}
                    />
                    {t(`rolesPage.groups.${group.id}`)}
                  </label>
                </legend>
                <div className="mz-perm-grid">
                  {group.keys.map((permission) => (
                    <label key={permission} className="mz-check">
                      <input
                        type="checkbox"
                        checked={checked.includes(permission)}
                        onChange={() => setChecked((currentChecked) => toggle(currentChecked, permission))}
                        disabled={!canEdit}
                      />
                      {t(`permissions.${permission}`, { defaultValue: permission })}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={createOpen}
        title={t('rolesPage.createTitle')}
        wide
        confirmLabel={createMutation.isPending ? t('common.saving') : t('common.create')}
        busy={createMutation.isPending}
        disabled={createName.trim() === '' || createChecked.length === 0}
        onConfirm={() => {
          const formEl = document.getElementById('create-role-form') as HTMLFormElement | null
          formEl?.requestSubmit()
        }}
        onClose={() => setCreateOpen(false)}
      >
        <form id="create-role-form" className="mz-form" onSubmit={onCreate}>
          <p className="mz-login__hint">{t('rolesPage.createHint')}</p>
          <FormField label={t('rolesPage.name')} htmlFor="role-name" required hint={t('rolesPage.nameHint')}>
            <input
              id="role-name"
              className="mz-input"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              required
              maxLength={80}
            />
          </FormField>
          {permissionGroups.map((group) => (
            <fieldset key={group.id} className="mz-perm-group">
              <legend>
                <label className="mz-check">
                  <input
                    type="checkbox"
                    checked={group.keys.every((key) => createChecked.includes(key))}
                    onChange={() => setCreateChecked((currentChecked) => toggleGroup(currentChecked, group.keys))}
                  />
                  {t(`rolesPage.groups.${group.id}`)}
                </label>
              </legend>
              <div className="mz-perm-grid">
                {group.keys.map((permission) => (
                  <label key={permission} className="mz-check">
                    <input
                      type="checkbox"
                      checked={createChecked.includes(permission)}
                      onChange={() => setCreateChecked((currentChecked) => toggle(currentChecked, permission))}
                    />
                    {t(`permissions.${permission}`, { defaultValue: permission })}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </form>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        title={t('rolesPage.deleteTitle')}
        confirmLabel={t('common.delete')}
        danger
        busy={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setDeleteOpen(false)}
      >
        <p>{t('rolesPage.deleteBody')}</p>
      </ConfirmDialog>
    </>
  )
}

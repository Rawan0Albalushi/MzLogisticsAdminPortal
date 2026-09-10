import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchAccessCatalog, updateRolePermissions } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { PERMISSION_GROUPS } from '@/core/constants/permissions.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'

export function RolesPage() {
  const { t } = useTranslation()
  const { refreshUser, hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['access-catalog'], queryFn: fetchAccessCatalog })
  const [selected, setSelected] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const canEdit = hasPermission('roles.manage')

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

  useEffect(() => {
    setChecked(current?.permissions ?? [])
  }, [current])

  const mutation = useMutation({
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

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  function toggle(permission: string) {
    setChecked((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    )
  }

  function toggleGroup(keys: readonly string[]) {
    const allOn = keys.every((key) => checked.includes(key))
    setChecked((current) => {
      if (allOn) {
        return current.filter((item) => !keys.includes(item))
      }
      return [...new Set([...current, ...keys])]
    })
  }

  return (
    <>
      <PageHeader title={t('rolesPage.title')} subtitle={t('rolesPage.subtitle')} />
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
                  <strong>{t(`roles.${role.name}`, { defaultValue: role.name })}</strong>
                  <span>
                    {role.users_count} {t('rolesPage.users')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-card__head">
              <h2 className="mz-card__title">{t(`roles.${selected}`, { defaultValue: selected })}</h2>
              {canEdit ? (
                <button
                  type="button"
                  className="mz-btn mz-btn--primary"
                  disabled={mutation.isPending || checked.length === 0}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? t('common.saving') : t('common.save')}
                </button>
              ) : null}
            </div>
            <p className="mz-login__hint">{t('rolesPage.hint')}</p>
            {PERMISSION_GROUPS.map((group) => (
              <fieldset key={group.id} className="mz-perm-group">
                <legend>
                  <label className="mz-check">
                    <input
                      type="checkbox"
                      checked={group.keys.every((key) => checked.includes(key))}
                      onChange={() => toggleGroup(group.keys)}
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
                        onChange={() => toggle(permission)}
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
    </>
  )
}

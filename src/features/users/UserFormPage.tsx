import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { createStaffUser, fetchAccessCatalog, fetchUser, resetStaffPassword, updateStaffUser } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { roleLabel } from '@/features/users/roleLabel.ts'

const emptyCreate = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  role: 'Operations Staff',
  locale: 'ar',
  is_active: true,
}

export function UserFormPage() {
  const { id = '' } = useParams()
  const isCreate = id === 'new' || !id
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser, refreshUser } = useAuth()
  const access = useQuery({ queryKey: ['access-catalog'], queryFn: fetchAccessCatalog })
  const existing = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    enabled: !isCreate,
  })
  const [form, setForm] = useState(emptyCreate)
  const [passwordForm, setPasswordForm] = useState({ password: '', password_confirmation: '' })
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!existing.data || isCreate) {
      return
    }
    setForm((current) => ({
      ...current,
      name: existing.data.name,
      email: existing.data.email,
      phone: existing.data.phone ?? '',
      role: existing.data.roles?.[0] ?? current.role,
      locale: existing.data.locale ?? 'ar',
      is_active: existing.data.is_active,
    }))
  }, [existing.data, isCreate])

  const canChangeRole = isCreate || existing.data?.user_type === 'platform'
  const roles = canChangeRole
    ? (access.data?.assignable_roles ?? access.data?.platform_roles ?? [])
    : [form.role].filter(Boolean)
  const selectedRole = useMemo(
    () => access.data?.roles.find((role) => role.name === form.role),
    [access.data, form.role],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isCreate) {
        return createStaffUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
          password_confirmation: form.password_confirmation,
          role: form.role,
          locale: form.locale,
          is_active: form.is_active,
        })
      }
      return updateStaffUser(id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        locale: form.locale,
        is_active: form.is_active,
        role: form.role,
      })
    },
    onSuccess: async (user) => {
      setError('')
      setFeedback(isCreate ? t('users.createSuccess') : t('users.updateSuccess'))
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      if (currentUser?.id === user.id) {
        await refreshUser()
      }
      if (isCreate) {
        navigate(`/users/${user.id}`, { replace: true })
      }
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, isCreate ? t('users.createFailed') : t('users.updateFailed')))
    },
  })

  const passwordMutation = useMutation({
    mutationFn: () => resetStaffPassword(id, passwordForm),
    onSuccess: () => {
      setPasswordForm({ password: '', password_confirmation: '' })
      setError('')
      setFeedback(t('users.passwordSuccess'))
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('users.passwordFailed')))
    },
  })

  if (!isCreate && existing.isLoading) {
    return <LoadingState />
  }

  if (!isCreate && (existing.isError || !existing.data)) {
    return <ErrorState onRetry={() => void existing.refetch()} />
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveMutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={isCreate ? t('users.create') : form.name || t('users.detailTitle')}
        subtitle={isCreate ? t('users.createHint') : t('users.detailHint')}
        crumbs={[{ label: t('users.title'), to: '/users' }, { label: isCreate ? t('users.create') : form.name }]}
      />
      {feedback ? <div className="mz-alert mz-alert--ok mz-section-alert">{feedback}</div> : null}
      {error ? <div className="mz-alert mz-section-alert">{error}</div> : null}

      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <form className="mz-form" onSubmit={onSubmit}>
              <FormField label={t('common.name')} htmlFor="user-name" required>
                <input
                  id="user-name"
                  className="mz-input"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </FormField>
              <FormField label={t('common.email')} htmlFor="user-email" required>
                <input
                  id="user-email"
                  className="mz-input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  disabled={!isCreate}
                />
              </FormField>
              <FormField label={t('common.phone')} htmlFor="user-phone">
                <input
                  id="user-phone"
                  className="mz-input"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </FormField>
              <FormField label={t('users.role')} htmlFor="user-role" required hint={t('users.roleHint')}>
                <select
                  id="user-role"
                  className="mz-select"
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  disabled={!canChangeRole}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role, access.data?.roles, t)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('common.language')} htmlFor="user-locale">
                <select
                  id="user-locale"
                  className="mz-select"
                  value={form.locale}
                  onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
                >
                  <option value="ar">{t('common.arabic')}</option>
                  <option value="en">{t('common.english')}</option>
                </select>
              </FormField>
              {isCreate ? (
                <>
                  <FormField label={t('auth.password')} htmlFor="user-password" required>
                    <input
                      id="user-password"
                      className="mz-input"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      minLength={8}
                    />
                  </FormField>
                  <FormField label={t('users.confirmPassword')} htmlFor="user-password-confirm" required>
                    <input
                      id="user-password-confirm"
                      className="mz-input"
                      type="password"
                      value={form.password_confirmation}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, password_confirmation: event.target.value }))
                      }
                      required
                      minLength={8}
                    />
                  </FormField>
                </>
              ) : (
                <label className="mz-check">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  />
                  {t('users.activeAccount')}
                </label>
              )}
              <div className="mz-form-actions">
                <button type="submit" className="mz-btn mz-btn--primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? t('common.saving') : isCreate ? t('users.create') : t('common.save')}
                </button>
                <Link className="mz-btn mz-btn--ghost" to="/users">
                  {t('common.cancel')}
                </Link>
              </div>
            </form>
          </div>
        </section>

        <section className="mz-card">
          <div className="mz-card__body">
            <h2 className="mz-card__title">{t('users.rolePermissions')}</h2>
            <p className="mz-login__hint">{t('users.rolePermissionsHint')}</p>
            {selectedRole ? (
              <div className="mz-perm-chips">
                {selectedRole.permissions.map((permission) => (
                  <span key={permission}>{t(`permissions.${permission}`, { defaultValue: permission })}</span>
                ))}
              </div>
            ) : (
              <p className="mz-login__hint">{t('common.noValue')}</p>
            )}
            {existing.data ? (
              <p className="mz-login__hint" style={{ marginTop: 16 }}>
                <StatusBadge status={existing.data.is_active ? 'active' : 'inactive'} />
              </p>
            ) : null}
            <p style={{ marginTop: 16 }}>
              <Link className="mz-link" to="/roles">
                {t('users.manageRoles')}
              </Link>
            </p>
          </div>
        </section>
      </div>

      {!isCreate ? (
        <section className="mz-card mz-section">
          <div className="mz-card__body">
            <h2 className="mz-card__title">{t('users.resetPassword')}</h2>
            <form
              className="mz-form"
              onSubmit={(event) => {
                event.preventDefault()
                passwordMutation.mutate()
              }}
            >
              <div className="mz-grid-2">
                <FormField label={t('users.newPassword')} htmlFor="reset-password" required>
                  <input
                    id="reset-password"
                    className="mz-input"
                    type="password"
                    value={passwordForm.password}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                    required
                    minLength={8}
                  />
                </FormField>
                <FormField label={t('users.confirmPassword')} htmlFor="reset-password-confirm" required>
                  <input
                    id="reset-password-confirm"
                    className="mz-input"
                    type="password"
                    value={passwordForm.password_confirmation}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))
                    }
                    required
                    minLength={8}
                  />
                </FormField>
              </div>
              <button type="submit" className="mz-btn mz-btn--accent" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? t('common.saving') : t('users.resetPassword')}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  )
}

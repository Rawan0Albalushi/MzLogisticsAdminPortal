import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrganization, verifyOrganization } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { ORGANIZATION_VERIFY_STATUSES } from '@/core/constants/statuses.ts'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { displayValue, formatDate, organizationName } from '@/shared/utils/format.ts'

export function ProviderDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['organization', id], queryFn: () => fetchOrganization(id), enabled: Boolean(id) })
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => verifyOrganization(id, { status, verification_notes: notes }),
    onSuccess: async () => {
      setFeedback(t('providers.verifySuccess'))
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['organization', id] })
      await queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('providers.verifyFailed')))
    },
  })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const org = query.data

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <PageHeader
        title={organizationName(org)}
        subtitle={t('providers.detailTitle')}
        crumbs={[{ label: t('providers.title'), to: '/providers' }, { label: organizationName(org) }]}
      />
      <div className="mz-grid-2">
        <section className="mz-card">
          <div className="mz-card__body">
            <DetailList
              items={[
                { label: t('common.status'), value: <StatusBadge status={org.status} /> },
                { label: t('common.email'), value: displayValue(org.email) },
                { label: t('common.phone'), value: displayValue(org.phone) },
                { label: t('common.city'), value: displayValue(org.city) },
                { label: t('common.address'), value: displayValue(org.address) },
                { label: t('customers.commercialRegister'), value: displayValue(org.commercial_register) },
                { label: t('customers.taxNumber'), value: displayValue(org.tax_number) },
                { label: t('common.notes'), value: displayValue(org.verification_notes) },
                { label: t('common.createdAt'), value: formatDate(org.created_at) },
              ]}
            />
          </div>
        </section>
        {hasPermission(PERMISSIONS.PROVIDERS_VERIFY) ? (
          <section className="mz-card">
            <div className="mz-card__body">
              <h2 className="mz-card__title">{t('providers.verifyTitle')}</h2>
              <p style={{ color: 'var(--mz-muted)', marginBottom: 12 }}>{t('providers.verifyHint')}</p>
              <form className="mz-form" onSubmit={onSubmit}>
                {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
                {error ? <div className="mz-alert">{error}</div> : null}
                <FormField label={t('providers.newStatus')} htmlFor="verify-status" required>
                  <select id="verify-status" className="mz-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                    {ORGANIZATION_VERIFY_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {t(`status.${value}`)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={t('providers.verificationNotes')} htmlFor="verify-notes">
                  <textarea id="verify-notes" className="mz-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
                </FormField>
                <button type="submit" className="mz-btn mz-btn--primary" disabled={mutation.isPending}>
                  {mutation.isPending ? t('providers.verifying') : t('providers.submitVerify')}
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}

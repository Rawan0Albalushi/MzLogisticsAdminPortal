import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, getApiMessage } from '@/core/api/client.ts'
import { fetchTrip, submitTripPod, updateTripOperations, updateTripStatus, uploadTripPodDocuments } from '@/core/api/services.ts'
import type { Trip } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { TripAssignForm } from '@/features/trips/TripAssignForm.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { TripTimeline } from '@/features/trips/TripTimeline.tsx'
import { LocationMap } from '@/shared/components/LocationMap.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { RouteLabel } from '@/shared/components/RouteLabel.tsx'
import { DetailList } from '@/shared/components/DetailList.tsx'
import { LIVE_TRACKING_ENABLED } from '@/core/constants/features.ts'
import { TRIP_STATUS_ACTIONS, pathToNextTripStage, tripStageId } from '@/core/constants/statuses.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { displayValue, formatCoords, formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format.ts'

function PodDocumentPreview({ path, label }: { path: string; label: string }) {
  const { t } = useTranslation()
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    setFailed(false)
    setSrc(null)
    void api
      .get<Blob>(path, { responseType: 'blob' })
      .then((response) => {
        if (!active) {
          return
        }
        objectUrl = URL.createObjectURL(response.data)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (active) {
          setFailed(true)
        }
      })

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [path])

  return (
    <figure className="mz-pod-doc">
      <figcaption>{label}</figcaption>
      {src ? <img src={src} alt={label} /> : <span>{failed ? t('common.error') : t('common.loading')}</span>}
    </figure>
  )
}

function documentPath(tripId: number, kind: 'invoice' | 'weight-ticket', revision?: string) {
  const base = `/trips/${tripId}/pod/${kind}`
  return revision ? `${base}?v=${encodeURIComponent(revision)}` : base
}

function PodDocumentsForm({ tripId }: { tripId: number }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [invoice, setInvoice] = useState<File | null>(null)
  const [weightTicket, setWeightTicket] = useState<File | null>(null)
  const [formKey, setFormKey] = useState(0)

  const save = useMutation({
    mutationFn: () => uploadTripPodDocuments(tripId, { invoice, weightTicket }),
    onSuccess: async () => {
      setInvoice(null)
      setWeightTicket(null)
      setFormKey((current) => current + 1)
      setError('')
      setFeedback(t('trips.documentsSaved'))
      await queryClient.invalidateQueries({ queryKey: ['trip', String(tripId)] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('trips.documentsFailed')))
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!invoice && !weightTicket) {
      return
    }
    save.mutate()
  }

  return (
    <form className="mz-form mz-pod-upload" onSubmit={onSubmit}>
      <p className="mz-pod-upload__title">{t('trips.uploadOnBehalf')}</p>
      <p className="mz-field__hint">{t('trips.uploadOnBehalfHint')}</p>
      {error ? <div className="mz-alert">{error}</div> : null}
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <div className="mz-grid-2">
        <FormField label={t('trips.invoice')} htmlFor="pod-invoice">
          <input
            key={`pod-invoice-${formKey}`}
            id="pod-invoice"
            className="mz-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setInvoice(event.target.files?.[0] ?? null)}
          />
        </FormField>
        <FormField label={t('trips.weightTicket')} htmlFor="pod-weight-ticket">
          <input
            key={`pod-weight-ticket-${formKey}`}
            id="pod-weight-ticket"
            className="mz-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setWeightTicket(event.target.files?.[0] ?? null)}
          />
        </FormField>
      </div>
      <button type="submit" className="mz-btn mz-btn--primary" disabled={save.isPending || (!invoice && !weightTicket)}>
        {save.isPending ? t('common.saving') : t('trips.saveDocuments')}
      </button>
    </form>
  )
}

function TripOperationsForm({ trip }: { trip: Trip }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState({
    trailer_plate: trip.trailer_plate ?? '',
    delivery_note_number: trip.delivery_note_number ?? '',
    operations_notes: trip.operations_notes ?? '',
  })

  const save = useMutation({
    mutationFn: () =>
      updateTripOperations(trip.id, {
        trailer_plate: form.trailer_plate.trim() || null,
        delivery_note_number: form.delivery_note_number.trim() || null,
        operations_notes: form.operations_notes.trim() || null,
      }),
    onSuccess: async () => {
      setError('')
      setFeedback(t('trips.operationsSaved'))
      await queryClient.invalidateQueries({ queryKey: ['trip', String(trip.id)] })
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('trips.operationsFailed')))
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form className="mz-form" onSubmit={onSubmit}>
      <SectionTitle icon="dispatch" title={t('trips.operationsSection')} />
      {error ? <div className="mz-alert">{error}</div> : null}
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <div className="mz-grid-2">
        <FormField label={t('trips.trailerPlate')} htmlFor="trip-trailer">
          <input
            id="trip-trailer"
            className="mz-input"
            dir="ltr"
            maxLength={32}
            value={form.trailer_plate}
            onChange={(event) => setForm((current) => ({ ...current, trailer_plate: event.target.value }))}
          />
        </FormField>
        <FormField label={t('trips.deliveryNote')} htmlFor="trip-dn">
          <input
            id="trip-dn"
            className="mz-input"
            dir="ltr"
            maxLength={40}
            value={form.delivery_note_number}
            onChange={(event) => setForm((current) => ({ ...current, delivery_note_number: event.target.value }))}
          />
        </FormField>
      </div>
      <FormField label={t('trips.operationsNotes')} htmlFor="trip-ops-notes" hint={t('trips.operationsNotesHint')}>
        <textarea
          id="trip-ops-notes"
          className="mz-textarea"
          maxLength={1000}
          rows={3}
          value={form.operations_notes}
          onChange={(event) => setForm((current) => ({ ...current, operations_notes: event.target.value }))}
        />
      </FormField>
      <button type="submit" className="mz-btn mz-btn--primary" disabled={save.isPending}>
        {save.isPending ? t('common.saving') : t('common.save')}
      </button>
    </form>
  )
}

function plannedQuantityInput(trip: Trip) {
  const value = trip.planned_quantity
  if (value == null || value === '') {
    return ''
  }
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return ''
  }
  return String(value)
}

function TripStatusActions({ trip }: { trip: Trip }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [pendingStatus, setPendingStatus] = useState<'advance' | 'cancelled' | null>(null)
  const [error, setError] = useState('')
  const [proofError, setProofError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [proof, setProof] = useState({ otp: '', quantity: plannedQuantityInput(trip), notes: '' })
  const [photos, setPhotos] = useState<File[]>([])
  const [invoice, setInvoice] = useState<File | null>(null)
  const [weightTicket, setWeightTicket] = useState<File | null>(null)
  const options = TRIP_STATUS_ACTIONS[trip.status] ?? []
  const advancePath = pathToNextTripStage(trip.status)
  const advanceTarget = advancePath.at(-1)
  const advanceLabel = advanceTarget
    ? tripStageId(advanceTarget) === tripStageId(trip.status)
      ? advanceTarget
      : tripStageId(advanceTarget)
    : null
  const needsDeliveryProof = advanceLabel === 'delivered'
  const canCancel = options.includes('cancelled')
  const quantityText = proof.quantity.trim()
  const quantity = quantityText === '' ? undefined : Number(quantityText)
  const hasDeliveryDetails =
    proof.otp.trim() !== '' ||
    quantityText !== '' ||
    proof.notes.trim() !== '' ||
    photos.length > 0 ||
    invoice != null ||
    weightTicket != null

  function resetProof() {
    setProofError('')
    setProof({ otp: '', quantity: plannedQuantityInput(trip), notes: '' })
    setPhotos([])
    setInvoice(null)
    setWeightTicket(null)
  }

  const save = useMutation({
    mutationFn: async (action: 'advance' | 'cancelled') => {
      if (action === 'cancelled') {
        return updateTripStatus(trip.id, 'cancelled')
      }
      if (needsDeliveryProof && hasDeliveryDetails) {
        for (const status of advancePath) {
          if (status === 'delivered' || status === 'completed') {
            break
          }
          await updateTripStatus(trip.id, status)
        }
        await submitTripPod(trip.id, {
          otp: proof.otp.trim() || undefined,
          receivedQuantity: quantity,
          notes: proof.notes.trim(),
          photos,
          invoice,
          weightTicket,
        })
        return trip
      }
      const steps = needsDeliveryProof && advancePath.at(-1) === 'delivered' ? [...advancePath, 'completed'] : advancePath
      let latest = trip
      for (const status of steps) {
        latest = await updateTripStatus(trip.id, status)
      }
      return latest
    },
    onSuccess: async () => {
      setPendingStatus(null)
      resetProof()
      setError('')
      setFeedback(t('trips.statusSaved'))
      await queryClient.invalidateQueries({ queryKey: ['trip', String(trip.id)] })
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      if (trip.job?.id) {
        await queryClient.invalidateQueries({ queryKey: ['job', String(trip.job.id)] })
      }
    },
    onError: async (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('trips.statusFailed')))
      await queryClient.invalidateQueries({ queryKey: ['trip', String(trip.id)] })
    },
  })

  if (!advanceLabel && !canCancel) {
    return null
  }

  const confirming = pendingStatus != null
  const cancelling = pendingStatus === 'cancelled'
  const pendingLabel = cancelling ? 'cancelled' : advanceLabel

  return (
      <div className="mz-trip-status">
      {error ? <div className="mz-alert">{error}</div> : null}
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <div className="mz-trip-status__bar">
        <p className="mz-field__hint">{t('trips.updateStatusHint')}</p>
        <div className="mz-trip-status__actions">
        {advanceLabel ? (
          <button type="button" className="mz-btn mz-btn--primary" onClick={() => setPendingStatus('advance')}>
            {t('trips.markStatus', { status: t(`status.${advanceLabel}`) })}
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" className="mz-btn mz-btn--danger" onClick={() => setPendingStatus('cancelled')}>
            {t('trips.cancelTrip')}
          </button>
        ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        wide={needsDeliveryProof && !cancelling}
        title={t('trips.confirmStatusTitle')}
        danger={cancelling}
        busy={save.isPending}
        confirmLabel={pendingLabel ? t('trips.markStatus', { status: t(`status.${pendingLabel}`) }) : undefined}
        onClose={() => {
          if (!save.isPending) {
            setPendingStatus(null)
            resetProof()
          }
        }}
        onConfirm={() => {
          if (!pendingStatus) {
            return
          }
          if (pendingStatus === 'advance' && needsDeliveryProof) {
            if (proof.otp.trim() !== '' && !/^\d{6}$/.test(proof.otp.trim())) {
              setProofError(t('trips.otpHint'))
              return
            }
            if (quantityText !== '' && (quantity == null || !Number.isFinite(quantity) || quantity < 0.1)) {
              setProofError(t('trips.quantityInvalid'))
              return
            }
          }
          setProofError('')
          save.mutate(pendingStatus)
        }}
      >
        <p>{cancelling ? t('trips.confirmCancelBody') : t('trips.confirmStatusBody', { status: t(`status.${pendingLabel ?? ''}`) })}</p>
        {needsDeliveryProof && !cancelling ? (
          <div className="mz-delivery-proof">
            <p className="mz-delivery-proof__intro">{t('trips.deliveryProofHint')}</p>
            {proofError ? <div className="mz-alert">{proofError}</div> : null}
            <div className={trip.otp_required ? 'mz-delivery-proof__row' : undefined}>
              {trip.otp_required ? (
                <FormField label={t('trips.otp')} htmlFor="delivery-otp" hint={t('trips.otpHint')}>
                  <input
                    id="delivery-otp"
                    className="mz-input"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={6}
                    value={proof.otp}
                    onChange={(event) => setProof((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  />
                </FormField>
              ) : null}
              <FormField label={t('trips.receivedQuantity')} htmlFor="delivery-qty">
                <input
                  id="delivery-qty"
                  className="mz-input"
                  dir="ltr"
                  inputMode="decimal"
                  value={proof.quantity}
                  onChange={(event) => setProof((current) => ({ ...current, quantity: event.target.value }))}
                />
              </FormField>
            </div>
            <FormField label={t('common.notes')} htmlFor="delivery-notes">
              <textarea
                id="delivery-notes"
                className="mz-textarea"
                rows={3}
                maxLength={1000}
                value={proof.notes}
                onChange={(event) => setProof((current) => ({ ...current, notes: event.target.value }))}
              />
            </FormField>
            <FormField label={t('trips.deliveryPhotos')} htmlFor="delivery-photos" hint={t('trips.deliveryPhotosHint')}>
              <div className="mz-file-picker">
                <span className="mz-file-picker__name">{photos.length > 0 ? photos.map((file) => file.name).join('، ') : t('trips.noFile')}</span>
                <button type="button" className="mz-btn mz-btn--ghost" onClick={() => document.getElementById('delivery-photos')?.click()}>
                  {t('trips.choosePhotos')}
                </button>
                <input
                  id="delivery-photos"
                  className="mz-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => {
                    const next = [...photos, ...Array.from(event.target.files ?? [])].slice(0, 6)
                    setPhotos(next)
                    event.target.value = ''
                  }}
                />
              </div>
              {photos.length > 0 ? (
                <ul className="mz-pod-files">
                  {photos.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <span>{file.name}</span>
                      <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setPhotos((current) => current.filter((_, item) => item !== index))}>
                        {t('trips.removeFile')}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </FormField>
            <div className="mz-delivery-proof__row">
              <FormField label={t('trips.invoice')} htmlFor="delivery-invoice">
                <div className="mz-file-picker">
                  <span className="mz-file-picker__name">{invoice?.name ?? t('trips.noFile')}</span>
                  {invoice ? (
                    <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setInvoice(null)}>
                      {t('trips.removeFile')}
                    </button>
                  ) : null}
                  <button type="button" className="mz-btn mz-btn--ghost" onClick={() => document.getElementById('delivery-invoice')?.click()}>
                    {t('trips.chooseFile')}
                  </button>
                  <input
                    id="delivery-invoice"
                    className="mz-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setInvoice(event.target.files?.[0] ?? null)}
                  />
                </div>
              </FormField>
              <FormField label={t('trips.weightTicket')} htmlFor="delivery-weight">
                <div className="mz-file-picker">
                  <span className="mz-file-picker__name">{weightTicket?.name ?? t('trips.noFile')}</span>
                  {weightTicket ? (
                    <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setWeightTicket(null)}>
                      {t('trips.removeFile')}
                    </button>
                  ) : null}
                  <button type="button" className="mz-btn mz-btn--ghost" onClick={() => document.getElementById('delivery-weight')?.click()}>
                    {t('trips.chooseFile')}
                  </button>
                  <input
                    id="delivery-weight"
                    className="mz-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setWeightTicket(event.target.files?.[0] ?? null)}
                  />
                </div>
              </FormField>
            </div>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

function numericValue(value?: string | number | null) {
  if (value == null || value === '') {
    return null
  }
  return formatNumber(value)
}

function presentItems(items: Array<{ label: string; value?: ReactNode } | null>) {
  return items.flatMap((item) => (item && item.value != null && item.value !== '' ? [item as { label: string; value: ReactNode }] : []))
}

function ltr(value?: string | null) {
  if (!value) {
    return null
  }
  return <span dir="ltr">{value}</span>
}

export function TripDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const query = useQuery({ queryKey: ['trip', id], queryFn: () => fetchTrip(id), enabled: Boolean(id) })

  if (query.isLoading) {
    return <LoadingState />
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />
  }

  const trip = query.data
  const pod = trip.proof_of_delivery
  const platformJob = trip.job?.provider?.type === 'platform'
  const canAssign = platformJob && hasPermission(PERMISSIONS.TRIPS_ASSIGN) && (trip.status === 'unassigned' || trip.status === 'assigned')
  const canEditOperations = trip.status !== 'cancelled' && (hasPermission(PERMISSIONS.TRIPS_UPDATE) || hasPermission(PERMISSIONS.TRIPS_ASSIGN))
  const canUploadPodDocuments = hasPermission(PERMISSIONS.TRIPS_UPDATE)
  const canUpdateStatus = hasPermission(PERMISSIONS.TRIPS_UPDATE)
  const routeLabel =
    trip.pickup_city || trip.delivery_city ? (
      <RouteLabel from={displayValue(trip.pickup_city)} to={displayValue(trip.delivery_city)} />
    ) : null

  const jobLink = trip.job ? (
    <Link className="mz-link" to={`/jobs/${trip.job.id}`}>
      {trip.job.reference}
    </Link>
  ) : null

  const currency = trip.job?.currency ?? undefined
  const assignment = presentItems([
    { label: t('common.job'), value: jobLink },
    { label: t('trips.sequence'), value: numericValue(trip.sequence) },
    { label: t('common.driver'), value: trip.driver?.name },
    { label: t('common.truck'), value: ltr(trip.truck?.plate_number) },
    canEditOperations ? null : { label: t('trips.trailerPlate'), value: ltr(trip.trailer_plate) },
    canEditOperations ? null : { label: t('trips.deliveryNote'), value: ltr(trip.delivery_note_number) },
    { label: t('drivers.civilId'), value: ltr(trip.driver?.driver_profile?.civil_id) },
    canEditOperations ? null : { label: t('trips.operationsNotes'), value: trip.operations_notes },
    trip.driver_pay_amount != null
      ? { label: t('trips.driverPay'), value: formatMoney(trip.driver_pay_amount, currency) }
      : null,
    trip.driver_pay_amount != null
      ? {
          label: t('trips.payableStatus'),
          value: trip.driver_payable?.status ? <StatusBadge status={trip.driver_payable.status} /> : t('trips.payablePendingCompletion'),
        }
      : null,
    !LIVE_TRACKING_ENABLED
      ? { label: t('trips.otp'), value: trip.otp_required ? t('trips.otpRequired') : t('trips.otpNotRequired') }
      : null,
  ])

  const schedule = presentItems([
    { label: t('trips.scheduledDeparture'), value: trip.scheduled_departure_at ? formatDateTime(trip.scheduled_departure_at) : null },
    { label: t('trips.assignedAt'), value: trip.assigned_at ? formatDateTime(trip.assigned_at) : null },
    { label: t('trips.arrivedPickupAt'), value: trip.arrived_pickup_at ? formatDateTime(trip.arrived_pickup_at) : null },
    { label: t('trips.loadedAt'), value: trip.loaded_at ? formatDateTime(trip.loaded_at) : null },
    { label: t('trips.inTransitAt'), value: trip.in_transit_at ? formatDateTime(trip.in_transit_at) : null },
    { label: t('trips.arrivedAt'), value: trip.arrived_at ? formatDateTime(trip.arrived_at) : null },
    { label: t('trips.deliveredAt'), value: trip.delivered_at ? formatDateTime(trip.delivered_at) : null },
    { label: t('trips.completedAt'), value: trip.completed_at ? formatDateTime(trip.completed_at) : null },
    !LIVE_TRACKING_ENABLED ? { label: t('common.eta'), value: trip.eta_at ? formatDateTime(trip.eta_at) : null } : null,
  ])
  if (schedule.length === 0 && trip.created_at) {
    assignment.push({ label: t('common.createdAt'), value: formatDateTime(trip.created_at) })
  } else if (trip.created_at) {
    schedule.push({ label: t('common.createdAt'), value: formatDateTime(trip.created_at) })
  }

  const podItems = presentItems([
    { label: t('trips.receiverName'), value: pod?.receiver_name },
    { label: t('common.notes'), value: pod?.notes },
  ])

  const plannedQuantity = numericValue(trip.planned_quantity)
  const deliveredQuantity = numericValue(trip.delivered_quantity)

  return (
    <>
      <PageHeader
        title={trip.reference}
        subtitle={routeLabel ?? t('trips.detailTitle')}
        crumbs={[{ label: t('trips.title'), to: '/trips' }, { label: trip.reference }]}
        actions={<StatusBadge status={tripStageId(trip.status)} />}
      />

      <section className="mz-card">
        <div className="mz-card__body">
          <SectionTitle icon="trips" title={t('trips.timeline')} />
          <TripTimeline status={trip.status} />
          {canUpdateStatus ? <TripStatusActions trip={trip} /> : null}
        </div>
      </section>

      <div className="mz-grid-2 mz-trip-layout mz-section">
        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="dispatch" title={t('trips.assignmentSection')} />
              {assignment.length > 0 ? <DetailList items={assignment} /> : null}
              {canAssign ? <TripAssignForm key={trip.id} trip={trip} /> : null}
            </div>
          </section>

          {canEditOperations ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <TripOperationsForm
                  key={`${trip.id}-${trip.trailer_plate ?? ''}-${trip.delivery_note_number ?? ''}-${trip.operations_notes ?? ''}`}
                  trip={trip}
                />
              </div>
            </section>
          ) : null}

          {pod ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="verify" title={t('trips.pod')} />
                {podItems.length > 0 ? <DetailList items={podItems} /> : null}
                {pod.invoice_path || pod.weight_ticket_path ? (
                  <div className="mz-pod-docs">
                    {pod.invoice_path ? (
                      <PodDocumentPreview path={documentPath(trip.id, 'invoice', pod.updated_at)} label={t('trips.invoice')} />
                    ) : null}
                    {pod.weight_ticket_path ? (
                      <PodDocumentPreview path={documentPath(trip.id, 'weight-ticket', pod.updated_at)} label={t('trips.weightTicket')} />
                    ) : null}
                  </div>
                ) : null}
                {canUploadPodDocuments ? <PodDocumentsForm tripId={trip.id} /> : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="quantity" title={t('trips.quantitiesSection')} />
              <div className="mz-trip-qty">
                <div>
                  <span>{t('trips.plannedQuantity')}</span>
                  <strong className={plannedQuantity ? undefined : 'is-empty'}>{plannedQuantity ?? displayValue(null)}</strong>
                </div>
                <div>
                  <span>{t('trips.deliveredQuantity')}</span>
                  <strong className={deliveredQuantity ? undefined : 'is-empty'}>{deliveredQuantity ?? displayValue(null)}</strong>
                </div>
              </div>
            </div>
          </section>

          {schedule.length > 0 ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="calendar" title={t('trips.scheduleSection')} />
                <DetailList items={schedule} />
              </div>
            </section>
          ) : null}

          {LIVE_TRACKING_ENABLED ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="clock" title={t('trips.liveSection')} />
                <DetailList
                  items={presentItems([
                    { label: t('common.location'), value: ltr(formatCoords(trip.current_lat, trip.current_lng)) },
                    { label: t('common.eta'), value: trip.eta_at ? formatDateTime(trip.eta_at) : null },
                    { label: t('trips.otp'), value: trip.otp_required ? t('trips.otpRequired') : t('trips.otpNotRequired') },
                  ])}
                />
              </div>
            </section>
          ) : null}

          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="trips" title={t('shipments.routeSection')} />
              <div className="mz-stack">
                <LocationMap
                  icon="pickup"
                  label={t('common.pickup')}
                  address={trip.pickup_address}
                  city={trip.pickup_city}
                  lat={trip.pickup_lat}
                  lng={trip.pickup_lng}
                />
                <LocationMap
                  icon="delivery"
                  label={t('common.delivery')}
                  address={trip.delivery_address}
                  city={trip.delivery_city}
                  lat={trip.delivery_lat}
                  lng={trip.delivery_lng}
                />
                {LIVE_TRACKING_ENABLED ? (
                  <LocationMap icon="tracking" label={t('common.location')} lat={trip.current_lat} lng={trip.current_lng} />
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

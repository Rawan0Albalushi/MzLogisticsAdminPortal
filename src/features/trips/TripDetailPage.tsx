import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, getApiMessage } from '@/core/api/client.ts'
import { fetchTrip, updateTripOperations, updateTripStatus, uploadTripPodDocuments } from '@/core/api/services.ts'
import type { Trip } from '@/core/api/types.ts'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { TripAssignForm } from '@/features/trips/TripAssignForm.tsx'
import { PageHeader } from '@/shared/components/PageHeader.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'
import { StatusBadge } from '@/shared/components/StatusBadge.tsx'
import { InfoGrid } from '@/shared/components/InfoGrid.tsx'
import { TripTimeline } from '@/features/trips/TripTimeline.tsx'
import { LocationMap } from '@/shared/components/LocationMap.tsx'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import { IconWell } from '@/shared/components/IconWell.tsx'
import { RouteLabel } from '@/shared/components/RouteLabel.tsx'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { LIVE_TRACKING_ENABLED } from '@/core/constants/features.ts'
import { TRIP_STATUS_ACTIONS } from '@/core/constants/statuses.ts'
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
    <form className="mz-form mz-section" onSubmit={onSubmit}>
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

function TripStatusActions({ trip }: { trip: Trip }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const options = TRIP_STATUS_ACTIONS[trip.status] ?? []
  const forward = options.find((status) => status !== 'cancelled')
  const canCancel = options.includes('cancelled')

  const save = useMutation({
    mutationFn: (status: string) => updateTripStatus(trip.id, status),
    onSuccess: async () => {
      setPendingStatus(null)
      setError('')
      setFeedback(t('trips.statusSaved'))
      await queryClient.invalidateQueries({ queryKey: ['trip', String(trip.id)] })
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      if (trip.job?.id) {
        await queryClient.invalidateQueries({ queryKey: ['job', String(trip.job.id)] })
      }
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('trips.statusFailed')))
    },
  })

  if (!forward && !canCancel) {
    return null
  }

  const confirming = pendingStatus != null
  const cancelling = pendingStatus === 'cancelled'

  return (
    <div className="mz-trip-status">
      <p className="mz-field__hint">{t('trips.updateStatusHint')}</p>
      {error ? <div className="mz-alert">{error}</div> : null}
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <div className="mz-trip-status__actions">
        {forward ? (
          <button type="button" className="mz-btn mz-btn--primary" onClick={() => setPendingStatus(forward)}>
            {t('trips.markStatus', { status: t(`status.${forward}`) })}
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" className="mz-btn mz-btn--danger" onClick={() => setPendingStatus('cancelled')}>
            {t('trips.cancelTrip')}
          </button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirming}
        title={t('trips.confirmStatusTitle')}
        danger={cancelling}
        busy={save.isPending}
        confirmLabel={pendingStatus ? t('trips.markStatus', { status: t(`status.${pendingStatus}`) }) : undefined}
        onClose={() => {
          if (!save.isPending) {
            setPendingStatus(null)
          }
        }}
        onConfirm={() => {
          if (pendingStatus) {
            save.mutate(pendingStatus)
          }
        }}
      >
        <p>{cancelling ? t('trips.confirmCancelBody') : t('trips.confirmStatusBody', { status: t(`status.${pendingStatus ?? ''}`) })}</p>
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

  return (
    <>
      <PageHeader
        title={trip.reference}
        subtitle={t('trips.detailTitle')}
        crumbs={[{ label: t('trips.title'), to: '/trips' }, { label: trip.reference }]}
        actions={<StatusBadge status={trip.status} />}
      />

      <section className="mz-card">
        <div className="mz-card__body">
          <SectionTitle icon="trips" title={t('trips.timeline')} />
          <TripTimeline status={trip.status} />
          {canUpdateStatus ? <TripStatusActions trip={trip} /> : null}
        </div>
      </section>

      <div className="mz-grid-2 mz-section">
        <section className="mz-card">
          <div className="mz-card__body">
            <div className="mz-profile">
              <IconWell name="trips" size="lg" />
              <div className="mz-profile__body">
                <h2 className="mz-profile__name">{trip.reference}</h2>
                {routeLabel ? <p className="mz-profile__aka">{routeLabel}</p> : null}
                <div className="mz-profile__contacts">
                  <StatusBadge status={trip.status} />
                  {trip.job ? (
                    <Link className="mz-profile__chip" to={`/jobs/${trip.job.id}`}>
                      <AppIcon name="jobs" />
                      {trip.job.reference}
                    </Link>
                  ) : null}
                  {trip.driver?.name ? (
                    <span className="mz-profile__chip">
                      <AppIcon name="drivers" />
                      {trip.driver.name}
                    </span>
                  ) : null}
                  {trip.truck?.plate_number ? (
                    <span className="mz-profile__chip" dir="ltr">
                      <AppIcon name="fleet" />
                      {trip.truck.plate_number}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <SectionTitle icon="dispatch" title={t('trips.assignmentSection')} />
            <InfoGrid
              fields={[
                { icon: 'jobs', label: t('common.job'), value: jobLink },
                { icon: 'quantity', label: t('trips.sequence'), value: numericValue(trip.sequence) },
                { icon: 'drivers', label: t('common.driver'), value: trip.driver?.name },
                { icon: 'fleet', label: t('common.truck'), value: trip.truck?.plate_number, dir: 'ltr' },
                { icon: 'fleet', label: t('trips.trailerPlate'), value: trip.trailer_plate, dir: 'ltr' },
                { icon: 'invoices', label: t('trips.deliveryNote'), value: trip.delivery_note_number, dir: 'ltr' },
                { icon: 'profile', label: t('drivers.civilId'), value: trip.driver?.driver_profile?.civil_id, dir: 'ltr' },
                { icon: 'notes', label: t('trips.operationsNotes'), value: trip.operations_notes, wide: true },
                ...(trip.driver_pay_amount != null
                  ? [
                      {
                        icon: 'payments' as const,
                        label: t('trips.driverPay'),
                        value: formatMoney(trip.driver_pay_amount, trip.job?.currency ?? undefined),
                      },
                      {
                        icon: 'settlements' as const,
                        label: t('trips.payableStatus'),
                        value: trip.driver_payable?.status ? <StatusBadge status={trip.driver_payable.status} /> : t('trips.payablePendingCompletion'),
                      },
                    ]
                  : []),
                ...(!LIVE_TRACKING_ENABLED
                  ? [
                      {
                        icon: 'roles' as const,
                        label: t('trips.otp'),
                        value: trip.otp_required ? t('trips.otpRequired') : t('trips.otpNotRequired'),
                      },
                    ]
                  : []),
              ]}
            />
            {canAssign ? <TripAssignForm key={trip.id} trip={trip} /> : null}
            {canEditOperations ? (
              <TripOperationsForm
                key={`${trip.id}-${trip.trailer_plate ?? ''}-${trip.delivery_note_number ?? ''}-${trip.operations_notes ?? ''}`}
                trip={trip}
              />
            ) : null}
          </div>
        </section>

        <div className="mz-stack">
          <section className="mz-card">
            <div className="mz-card__body">
              <SectionTitle icon="quantity" title={t('trips.quantitiesSection')} />
              <InfoGrid
                fields={[
                  { icon: 'quantity', label: t('trips.plannedQuantity'), value: numericValue(trip.planned_quantity) },
                  { icon: 'delivery', label: t('trips.deliveredQuantity'), value: numericValue(trip.delivered_quantity) },
                ]}
              />
            </div>
          </section>
          {LIVE_TRACKING_ENABLED ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="clock" title={t('trips.liveSection')} />
                <InfoGrid
                  fields={[
                    {
                      icon: 'tracking',
                      label: t('common.location'),
                      value: formatCoords(trip.current_lat, trip.current_lng),
                      dir: 'ltr',
                    },
                    { icon: 'clock', label: t('common.eta'), value: trip.eta_at ? formatDateTime(trip.eta_at) : null },
                    { icon: 'roles', label: t('trips.otp'), value: trip.otp_required ? t('trips.otpRequired') : t('trips.otpNotRequired') },
                  ]}
                />
              </div>
            </section>
          ) : null}
          {pod ? (
            <section className="mz-card">
              <div className="mz-card__body">
                <SectionTitle icon="verify" title={t('trips.pod')} />
                <InfoGrid
                  fields={[
                    { icon: 'profile', label: t('trips.receiverName'), value: pod.receiver_name },
                    { icon: 'notes', label: t('common.notes'), value: pod.notes, wide: true },
                  ]}
                />
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
      </div>

      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <SectionTitle icon="calendar" title={t('trips.scheduleSection')} />
          <InfoGrid
            fields={[
              ...(!LIVE_TRACKING_ENABLED
                ? [{ icon: 'clock' as const, label: t('common.eta'), value: trip.eta_at ? formatDateTime(trip.eta_at) : null }]
                : []),
              { icon: 'calendar', label: t('trips.scheduledDeparture'), value: trip.scheduled_departure_at ? formatDateTime(trip.scheduled_departure_at) : null },
              { icon: 'dispatch', label: t('trips.assignedAt'), value: trip.assigned_at ? formatDateTime(trip.assigned_at) : null },
              { icon: 'pickup', label: t('trips.arrivedPickupAt'), value: trip.arrived_pickup_at ? formatDateTime(trip.arrived_pickup_at) : null },
              { icon: 'shipments', label: t('trips.loadedAt'), value: trip.loaded_at ? formatDateTime(trip.loaded_at) : null },
              { icon: 'trips', label: t('trips.inTransitAt'), value: trip.in_transit_at ? formatDateTime(trip.in_transit_at) : null },
              { icon: 'tracking', label: t('trips.arrivedAt'), value: trip.arrived_at ? formatDateTime(trip.arrived_at) : null },
              { icon: 'delivery', label: t('trips.deliveredAt'), value: trip.delivered_at ? formatDateTime(trip.delivered_at) : null },
              { icon: 'verify', label: t('trips.completedAt'), value: trip.completed_at ? formatDateTime(trip.completed_at) : null },
              { icon: 'calendar', label: t('common.createdAt'), value: trip.created_at ? formatDateTime(trip.created_at) : null },
            ]}
          />
        </div>
      </section>

      <section className="mz-card mz-section">
        <div className="mz-card__body">
          <SectionTitle icon="trips" title={t('shipments.routeSection')} />
          <div className="mz-grid-2 mz-grid-2--equal">
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
          </div>
          {LIVE_TRACKING_ENABLED ? (
            <div className="mz-section">
              <LocationMap icon="tracking" label={t('common.location')} lat={trip.current_lat} lng={trip.current_lng} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}

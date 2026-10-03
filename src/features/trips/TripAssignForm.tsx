import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { assignTrip, fetchDrivers, fetchTrucks } from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import type { Trip } from '@/core/api/types.ts'
import { FormField } from '@/shared/components/FormField.tsx'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'

function localDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function departureDateInput(scheduled?: string | null, planned?: string | null): string {
  const today = localDateInput(new Date())
  let candidate = ''
  if (scheduled) {
    const parsed = new Date(scheduled)
    if (!Number.isNaN(parsed.getTime())) candidate = localDateInput(parsed)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) candidate = (planned ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate) || candidate < today) return today
  return candidate
}

function departureInput(value?: string | null): string {
  if (!value) {
    return '10:00'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '10:00'
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function TripAssignForm({ trip }: { trip: Trip }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState({
    truck_id: trip.truck?.id ? String(trip.truck.id) : '',
    driver_id: trip.driver?.id ? String(trip.driver.id) : '',
    departure_date: departureDateInput(trip.scheduled_departure_at, trip.planned_service_date),
    departure_time: departureInput(trip.scheduled_departure_at),
    driver_pay: trip.driver_pay_amount != null ? String(trip.driver_pay_amount) : '',
  })

  const trucks = useQuery({
    queryKey: ['trucks', 'platform', 'assign'],
    queryFn: () => fetchTrucks({ owner: 'platform', per_page: 100, page: 1 }),
  })
  const drivers = useQuery({
    queryKey: ['drivers', 'platform', 'assign'],
    queryFn: () => fetchDrivers({ owner: 'platform', per_page: 100, page: 1 }),
  })

  const save = useMutation({
    mutationFn: () =>
      assignTrip(trip.id, {
        truck_id: Number(form.truck_id),
        driver_id: Number(form.driver_id),
        departure_date: form.departure_date,
        departure_time: form.departure_time.slice(0, 5),
        driver_pay_amount: Number(form.driver_pay),
      }),
    onSuccess: async () => {
      setError('')
      setFeedback(t('trips.assignSaved'))
      await queryClient.invalidateQueries({ queryKey: ['trip', String(trip.id)] })
      await queryClient.invalidateQueries({ queryKey: ['trips'] })
      if (trip.job?.id) {
        await queryClient.invalidateQueries({ queryKey: ['job', String(trip.job.id)] })
      }
    },
    onError: (err) => {
      setFeedback('')
      setError(getApiMessage(err, t('trips.assignFailed')))
    },
  })

  function onDriverChange(driverId: string) {
    const driver = drivers.data?.items.find((item) => String(item.id) === driverId)
    const rate = driver?.driver_profile?.trip_rate
    setForm((current) => ({
      ...current,
      driver_id: driverId,
      driver_pay: rate != null && rate !== '' ? String(rate) : current.driver_pay,
    }))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form className="mz-form mz-section" onSubmit={onSubmit}>
      <SectionTitle icon="dispatch" title={t('trips.assign')} />
      {error ? <div className="mz-alert">{error}</div> : null}
      {feedback ? <div className="mz-alert mz-alert--ok">{feedback}</div> : null}
      <FormField label={t('common.truck')} htmlFor="assign-truck" required>
        <select id="assign-truck" className="mz-select" required value={form.truck_id} onChange={(event) => setForm((current) => ({ ...current, truck_id: event.target.value }))}>
          <option value="">{t('common.select')}</option>
          {(trucks.data?.items ?? []).map((truck) => (
            <option key={truck.id} value={truck.id}>
              {truck.plate_number}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('common.driver')} htmlFor="assign-driver" required>
        <select id="assign-driver" className="mz-select" required value={form.driver_id} onChange={(event) => onDriverChange(event.target.value)}>
          <option value="">{t('common.select')}</option>
          {(drivers.data?.items ?? []).map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={t('trips.plannedServiceDate')} htmlFor="assign-service-date" required hint={t('trips.departureTimeHint')}>
        <input
          id="assign-service-date"
          className="mz-input"
          type="date"
          required
          min={localDateInput(new Date())}
          value={form.departure_date}
          onChange={(event) => setForm((current) => ({ ...current, departure_date: event.target.value }))}
        />
      </FormField>
      <FormField label={t('trips.departureTime')} htmlFor="assign-departure" required>
        <input id="assign-departure" className="mz-input" type="time" required value={form.departure_time} onChange={(event) => setForm((current) => ({ ...current, departure_time: event.target.value }))} />
      </FormField>
      <FormField label={t('trips.driverPay')} htmlFor="assign-pay" required hint={t('trips.driverPayHint')}>
        <input id="assign-pay" className="mz-input" type="number" min="0" step="0.001" required value={form.driver_pay} onChange={(event) => setForm((current) => ({ ...current, driver_pay: event.target.value }))} />
      </FormField>
      <button type="submit" className="mz-btn mz-btn--primary" disabled={save.isPending}>
        {save.isPending ? t('common.saving') : t('trips.assign')}
      </button>
    </form>
  )
}

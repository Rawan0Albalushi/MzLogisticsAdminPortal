import type { TFunction } from 'i18next'
import type { Trip } from '@/core/api/types.ts'
import { createReportDocument, reportStatus } from '@/shared/reports/buildReport.ts'
import type { ReportDocument, ReportFilter } from '@/shared/reports/types.ts'
import { displayValue, formatDate, formatDateTime, formatNumber, formatRoute, organizationName, projectName } from '@/shared/utils/format.ts'

function projectLabel(t: TFunction, trip: Trip): string {
  const project = trip.job?.project
  if (!project) {
    return t('trips.logNoProject')
  }
  const name = projectName(project)
  return project.project_id ? `${name} (${project.project_id})` : name
}

function tripWeight(trip: Trip): string {
  const delivered = Number(trip.delivered_quantity)
  const quantity = delivered > 0 ? trip.delivered_quantity : trip.planned_quantity
  if (quantity == null || quantity === '') {
    return displayValue(null)
  }
  const amount = formatNumber(quantity)
  const unit = trip.job?.shipment?.quantity_unit?.trim()
  return unit ? `${amount} ${unit}` : amount
}

function tripRoute(trip: Trip): string {
  const from = trip.pickup_city || trip.pickup_address || ''
  const to = trip.delivery_city || trip.delivery_address || ''
  if (!from && !to) {
    return displayValue(null)
  }
  return formatRoute(from || displayValue(null), to || displayValue(null))
}

export function tripLogGroups(t: TFunction, trips: Trip[]): Trip[][] {
  const groups = new Map<string, Trip[]>()
  for (const trip of trips) {
    const key = `${trip.job?.project?.id ?? 'none'}:${trip.job?.id ?? trip.id}`
    const current = groups.get(key) ?? []
    current.push(trip)
    groups.set(key, current)
  }

  return [...groups.values()]
    .map((items) => [...items].sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0)))
    .sort((left, right) => {
      const leftMissing = !left[0]?.job?.project
      const rightMissing = !right[0]?.job?.project
      if (leftMissing !== rightMissing) {
        return leftMissing ? 1 : -1
      }
      const projectOrder = projectLabel(t, left[0]).localeCompare(projectLabel(t, right[0]))
      if (projectOrder !== 0) {
        return projectOrder
      }
      return (left[0].job?.reference ?? '').localeCompare(right[0].job?.reference ?? '')
    })
}

export function tripLogTitle(t: TFunction, trip: Trip): string {
  const reference = trip.job?.reference
  return reference ? `${projectLabel(t, trip)} · ${reference}` : projectLabel(t, trip)
}

export function tripLogColumns(t: TFunction): string[] {
  return columns(t)
}

export function tripLogRow(t: TFunction, trip: Trip, sequence: number): string[] {
  return tripRow(t, trip, sequence)
}

function tripRow(t: TFunction, trip: Trip, sequence: number): string[] {
  const invoice = trip.customer_invoice
  return [
    String(sequence),
    projectLabel(t, trip),
    formatDate(trip.planned_service_date),
    displayValue(trip.truck?.type_label || trip.truck?.type),
    displayValue(trip.truck?.plate_number),
    displayValue(trip.trailer_plate),
    displayValue(trip.driver?.name),
    displayValue(trip.driver?.phone),
    displayValue(trip.driver?.driver_profile?.civil_id),
    organizationName(trip.job?.provider),
    formatDateTime(trip.loaded_at),
    formatDateTime(trip.in_transit_at || trip.scheduled_departure_at),
    formatDateTime(trip.delivered_at),
    tripWeight(trip),
    tripRoute(trip),
    reportStatus(t, trip.status),
    displayValue(trip.delivery_note_number),
    displayValue(trip.reference),
    invoice?.status ? reportStatus(t, invoice.status) : displayValue(null),
    formatDate(invoice?.paid_at),
    formatDate(invoice?.due_at),
    displayValue(trip.operations_notes),
  ]
}

function columns(t: TFunction): string[] {
  return [
    t('trips.logSerial'),
    t('trips.logProject'),
    t('trips.logDate'),
    t('trips.logVehicleType'),
    t('trips.logVehicleNo'),
    t('trips.logTrailer'),
    t('trips.logDriver'),
    t('trips.logMobile'),
    t('trips.logCivilId'),
    t('trips.logTransporter'),
    t('trips.logLoading'),
    t('trips.logDispatch'),
    t('trips.logDelivery'),
    t('trips.logWeight'),
    t('trips.logRoute'),
    t('common.status'),
    t('trips.logDn'),
    t('trips.logTripNo'),
    t('trips.logPayment'),
    t('trips.logPaymentDate'),
    t('trips.logExpectedDue'),
    t('trips.logRemarks'),
  ]
}

export function createTripLogReport(t: TFunction, trips: Trip[], filters: ReportFilter[]): ReportDocument {
  const headers = columns(t)
  const grouped = tripLogGroups(t, trips)
  const sections = grouped.length === 0
    ? [
        {
          title: t('trips.title'),
          table: {
            columns: headers,
            numbered: false,
            rows: [],
          },
        },
      ]
    : grouped.map((items) => {
      const sample = items[0]
      const job = sample.job
      return {
        title: tripLogTitle(t, sample),
        metrics: [
          { label: t('trips.logCargo'), value: displayValue(job?.shipment?.cargo_type) },
          { label: t('trips.logJobStatus'), value: reportStatus(t, job?.status) },
          { label: t('trips.logTripCount'), value: String(items.length) },
        ],
        table: {
          columns: headers,
          numbered: false,
          rows: items.map((trip, index) => tripRow(t, trip, index + 1)),
        },
      }
    })

  return createReportDocument({
    title: t('trips.title'),
    subtitle: t('trips.subtitle'),
    filters,
    sections,
  })
}

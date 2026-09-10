import i18n from '@/core/i18n/index.ts'
import { DEFAULT_CURRENCY } from '@/core/constants/statuses.ts'
import type { Organization } from '@/core/api/types.ts'

export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return i18n.t('common.noValue')
  }
  return String(value)
}

export function organizationName(organization?: Organization | null): string {
  if (!organization) {
    return i18n.t('common.noValue')
  }
  if (i18n.language.startsWith('ar') && organization.name_ar) {
    return organization.name_ar
  }
  return organization.name
}

export function formatMoney(value: string | number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined || value === '') {
    return i18n.t('common.noValue')
  }
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) {
    return displayValue(value)
  }
  const locale = i18n.language.startsWith('ar') ? 'ar-OM' : 'en-OM'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount)
}

export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return i18n.t('common.noValue')
  }
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) {
    return displayValue(value)
  }
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en'
  return new Intl.NumberFormat(locale).format(amount)
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return i18n.t('common.noValue')
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en-GB'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return i18n.t('common.noValue')
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en-GB'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function formatPercent(value?: number | null): string {
  if (value === null || value === undefined) {
    return i18n.t('common.noValue')
  }
  return `${Math.round(value)}%`
}

export function formatCoords(lat?: number | null, lng?: number | null): string {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return i18n.t('trips.noLocation')
  }
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
}

export function initials(name?: string | null): string {
  if (!name) {
    return 'MZ'
  }
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part.charAt(0).toUpperCase()).join('')
  return letters || 'MZ'
}

export function greetingKey(date = new Date()): 'dashboard.greetingMorning' | 'dashboard.greetingAfternoon' | 'dashboard.greetingEvening' {
  const hour = date.getHours()
  if (hour < 12) {
    return 'dashboard.greetingMorning'
  }
  if (hour < 17) {
    return 'dashboard.greetingAfternoon'
  }
  return 'dashboard.greetingEvening'
}

export function mapUrl(lat?: number | null, lng?: number | null): string | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return null
  }
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`
}

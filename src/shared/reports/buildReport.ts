import type { TFunction } from 'i18next'
import i18n from '@/core/i18n/index.ts'
import { formatDateTime } from '@/shared/utils/format.ts'
import type { ReportDocument, ReportFilter, ReportSection } from '@/shared/reports/types.ts'

export function reportLanguage(): ReportDocument['language'] {
  return i18n.language.startsWith('ar') ? 'ar' : 'en'
}

export function reportStatus(t: TFunction, status?: string | null): string {
  if (!status) {
    return t('common.noValue')
  }
  return t(`status.${status}`, { defaultValue: status })
}

export function createReportDocument(input: {
  title: string
  subtitle?: string
  filters?: ReportFilter[]
  sections: ReportSection[]
}): ReportDocument {
  const language = reportLanguage()
  return {
    title: input.title,
    subtitle: input.subtitle,
    appName: i18n.t('app.name'),
    portal: i18n.t('app.portal'),
    generatedAt: formatDateTime(new Date().toISOString()),
    language,
    languageLabel: i18n.t(language === 'ar' ? 'common.arabic' : 'common.english'),
    filters: input.filters ?? [],
    sections: input.sections.filter((section) => Boolean(section.metrics?.length || section.table)),
  }
}

export function createListReport(input: {
  title: string
  subtitle?: string
  filters?: ReportFilter[]
  columns: string[]
  rows: string[][]
}): ReportDocument {
  return createReportDocument({
    title: input.title,
    subtitle: input.subtitle,
    filters: input.filters,
    sections: [
      {
        title: input.title,
        table: {
          columns: input.columns,
          rows: input.rows,
        },
      },
    ],
  })
}

interface ListFilterSource {
  search?: string
  status?: string
  type?: string
  role?: string
  accountType?: string
  dateFrom?: string
  dateTo?: string
  city?: string
  method?: string
}

export function listReportFilters(t: TFunction, list: ListFilterSource): ReportFilter[] {
  const filters: ReportFilter[] = []
  if (list.search) {
    filters.push({ label: t('common.search'), value: list.search })
  }
  if (list.status) {
    filters.push({ label: t('common.status'), value: reportStatus(t, list.status) })
  }
  if (list.type) {
    filters.push({ label: t('common.type'), value: reportStatus(t, list.type) })
  }
  if (list.role) {
    filters.push({ label: t('users.role'), value: list.role })
  }
  if (list.accountType) {
    filters.push({ label: t('customers.accountType'), value: reportStatus(t, list.accountType) })
  }
  if (list.city) {
    filters.push({ label: t('common.city'), value: list.city })
  }
  if (list.method) {
    filters.push({ label: t('payments.method'), value: reportStatus(t, list.method) })
  }
  if (list.dateFrom || list.dateTo) {
    filters.push({
      label: t('common.dateRange'),
      value: `${list.dateFrom || t('common.noValue')} – ${list.dateTo || t('common.noValue')}`,
    })
  }
  return filters
}

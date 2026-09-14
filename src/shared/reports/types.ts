export type ReportLanguage = 'ar' | 'en'
export type ReportFormat = 'pdf' | 'excel'

export interface ReportFilter {
  label: string
  value: string
}

export interface ReportMetric {
  label: string
  value: string
  hint?: string
}

export interface ReportTable {
  title?: string
  columns: string[]
  rows: string[][]
}

export interface ReportSection {
  title: string
  metrics?: ReportMetric[]
  table?: ReportTable
}

export interface ReportDocument {
  title: string
  subtitle?: string
  appName: string
  portal: string
  generatedAt: string
  language: ReportLanguage
  languageLabel: string
  filters: ReportFilter[]
  sections: ReportSection[]
}

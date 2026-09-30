import type { TFunction } from 'i18next'
import ExcelJS from 'exceljs'
import type { Trip } from '@/core/api/types.ts'
import i18n from '@/core/i18n/index.ts'
import { tripLogColumns, tripLogGroups, tripLogRow, tripLogTitle } from '@/features/trips/tripLogReport.ts'
import { reportTheme } from '@/shared/reports/reportTheme.ts'
import type { ReportFilter } from '@/shared/reports/types.ts'

const widths = [24, 18, 16, 16, 16, 16, 20, 16, 16, 22, 20, 20, 20, 14, 36, 16, 18, 14, 14, 16, 18, 28]

const edge = { style: 'thin' as const, color: { argb: `FF${reportTheme.border}` } }
const border: ExcelJS.Borders = {
  top: edge,
  left: edge,
  bottom: edge,
  right: edge,
  diagonal: { up: false, down: false },
}

function plain(value: string): string {
  return value.replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
}

function paint(cell: ExcelJS.Cell, isRtl: boolean, value: string, fill: string, color: string, bold = false, size = 11): void {
  cell.value = plain(value)
  cell.font = {
    name: isRtl ? 'Tahoma' : 'Calibri',
    size,
    bold,
    color: { argb: `FF${color}` },
  }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } }
  cell.alignment = {
    vertical: 'middle',
    horizontal: isRtl ? 'right' : 'left',
    readingOrder: isRtl ? 'rtl' : 'ltr',
    wrapText: false,
  }
  cell.border = border
}

function writeBand(sheet: ExcelJS.Worksheet, rowIndex: number, lastColumn: number, isRtl: boolean, value: string, fill: string, color: string, size: number): void {
  const row = sheet.getRow(rowIndex)
  for (let column = 1; column <= lastColumn; column += 1) {
    paint(row.getCell(column), isRtl, column === 1 ? value : '', fill, color, true, size)
  }
  if (lastColumn > 1) {
    sheet.mergeCells(rowIndex, 1, rowIndex, lastColumn)
  }
  row.height = size > 14 ? 28 : 24
}

export async function buildTripLogWorkbook(t: TFunction, trips: Trip[], filters: ReportFilter[]): Promise<ExcelJS.Buffer> {
  const isRtl = i18n.language.startsWith('ar')
  const headers = tripLogColumns(t)
  const lastColumn = headers.length
  const workbook = new ExcelJS.Workbook()
  workbook.creator = i18n.t('app.name')
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(t('trips.title').slice(0, 31), {
    views: [{ rightToLeft: isRtl, state: 'frozen', ySplit: 4, showGridLines: false }],
    properties: { defaultRowHeight: 22 },
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: false,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  })

  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width
  })

  writeBand(sheet, 1, lastColumn, isRtl, i18n.t('app.name'), reportTheme.purple, reportTheme.white, 16)
  writeBand(sheet, 2, lastColumn, isRtl, t('trips.title'), reportTheme.surface, reportTheme.ink, 14)

  const filterText = filters.map((filter) => `${filter.label}: ${filter.value}`).join('   ·   ')
  writeBand(
    sheet,
    3,
    lastColumn,
    isRtl,
    filterText || i18n.t('reports.generatedAt'),
    reportTheme.surface,
    reportTheme.muted,
    11,
  )

  let rowIndex = 5
  const groups = tripLogGroups(t, trips)
  const blocks = groups.length > 0 ? groups : [[]]

  for (const items of blocks) {
    const title = items[0] ? tripLogTitle(t, items[0]) : t('trips.logNoProject')
    writeBand(sheet, rowIndex, lastColumn, isRtl, title, reportTheme.purpleSoft, reportTheme.purple, 12)
    rowIndex += 1

    const header = sheet.getRow(rowIndex)
    headers.forEach((label, index) => {
      const cell = header.getCell(index + 1)
      paint(cell, isRtl, label, reportTheme.purple, reportTheme.white, true, 11)
      cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle' }
    })
    header.height = 36
    rowIndex += 1

    if (items.length === 0) {
      writeBand(sheet, rowIndex, lastColumn, isRtl, i18n.t('reports.noData'), reportTheme.white, reportTheme.muted, 11)
      rowIndex += 1
    }

    items.forEach((trip, offset) => {
      const row = sheet.getRow(rowIndex)
      const values = tripLogRow(t, trip)
      values.forEach((value, index) => {
        const cell = row.getCell(index + 1)
        paint(cell, isRtl, value, offset % 2 === 0 ? reportTheme.white : reportTheme.stripe, reportTheme.ink, false, 11)
        if (index === 14 || index === 21) {
          cell.alignment = { ...cell.alignment, wrapText: true }
        }
      })
      row.height = 22
      rowIndex += 1
    })

    rowIndex += 1
  }

  return workbook.xlsx.writeBuffer()
}

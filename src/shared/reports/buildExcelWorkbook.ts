import ExcelJS from 'exceljs'
import i18n from '@/core/i18n/index.ts'
import { columnWidth, reportTheme, safeSheetName } from '@/shared/reports/reportTheme.ts'
import type { ReportDocument } from '@/shared/reports/types.ts'

const edge = { style: 'thin' as const, color: { argb: `FF${reportTheme.border}` } }
const thinBorder: ExcelJS.Borders = {
  top: edge,
  left: edge,
  bottom: edge,
  right: edge,
  diagonal: { up: false, down: false },
}

function fill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${argb}` } }
}

function font(isRtl: boolean, options: Partial<ExcelJS.Font> = {}): Partial<ExcelJS.Font> {
  return {
    name: isRtl ? 'Tahoma' : 'Calibri',
    size: 11,
    color: { argb: `FF${reportTheme.ink}` },
    ...options,
  }
}

function align(isRtl: boolean, options: Partial<ExcelJS.Alignment> = {}): Partial<ExcelJS.Alignment> {
  return {
    vertical: 'middle',
    horizontal: options.horizontal ?? (isRtl ? 'right' : 'left'),
    readingOrder: isRtl ? 'rtl' : 'ltr',
    wrapText: true,
    shrinkToFit: false,
    ...options,
  }
}

function usedColumnCount(document: ReportDocument): number {
  let columns = 1
  if (document.filters.length > 0) {
    columns = Math.max(columns, 2)
  }
  for (const section of document.sections) {
    if (section.metrics?.length) {
      columns = Math.max(columns, 3)
    }
    if (section.table) {
      columns = Math.max(columns, section.table.columns.length + 1)
    }
  }
  return Math.max(columns, 1)
}

function styleCell(
  cell: ExcelJS.Cell,
  isRtl: boolean,
  options: {
    value?: string | number
    fill?: string
    bold?: boolean
    size?: number
    color?: string
    italic?: boolean
    center?: boolean
    bordered?: boolean
  },
): void {
  if (options.value !== undefined) {
    cell.value = options.value
  }
  cell.font = font(isRtl, {
    bold: options.bold,
    italic: options.italic,
    size: options.size,
    color: options.color ? { argb: `FF${options.color}` } : undefined,
  })
  if (options.fill) {
    cell.fill = fill(options.fill)
  }
  if (options.bordered !== false) {
    cell.border = thinBorder
  }
  cell.alignment = align(isRtl, options.center ? { horizontal: 'center' } : undefined)
}

function writeCells(
  sheet: ExcelJS.Worksheet,
  rowIndex: number,
  isRtl: boolean,
  values: Array<string | number>,
  options: {
    fill?: string
    bold?: boolean
    size?: number
    color?: string
    italic?: boolean
    height?: number
    header?: boolean
    bordered?: boolean
  } = {},
): ExcelJS.Row {
  const row = sheet.getRow(rowIndex)
  values.forEach((value, index) => {
    styleCell(row.getCell(index + 1), isRtl, {
      value,
      fill: options.header ? reportTheme.purple : options.fill,
      bold: options.bold ?? options.header,
      size: options.size ?? (options.header ? 11 : 10),
      color: options.color ?? (options.header ? reportTheme.white : reportTheme.ink),
      italic: options.italic,
      center: options.header && index === 0,
      bordered: options.bordered,
    })
  })
  row.height = options.height ?? 22
  return row
}

function writeBanner(
  sheet: ExcelJS.Worksheet,
  rowIndex: number,
  isRtl: boolean,
  lastColumn: number,
  value: string,
  options: {
    fill: string
    bold?: boolean
    size?: number
    color?: string
    italic?: boolean
    height?: number
    bordered?: boolean
  },
): void {
  const row = sheet.getRow(rowIndex)
  for (let column = 1; column <= lastColumn; column += 1) {
    styleCell(row.getCell(column), isRtl, {
      value: column === 1 ? value : undefined,
      fill: options.fill,
      bold: options.bold,
      size: options.size,
      color: options.color,
      italic: options.italic,
      bordered: options.bordered ?? false,
    })
  }
  if (lastColumn > 1) {
    sheet.mergeCells(rowIndex, 1, rowIndex, lastColumn)
  }
  row.height = options.height ?? 24
}

export async function buildExcelWorkbook(document: ReportDocument): Promise<ExcelJS.Buffer> {
  const isRtl = document.language === 'ar'
  const lastColumn = usedColumnCount(document)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = document.appName
  workbook.company = document.appName
  workbook.created = new Date()
  workbook.modified = new Date()

  const sheet = workbook.addWorksheet(safeSheetName(document.title), {
    views: [{ rightToLeft: isRtl, showGridLines: true }],
    properties: {
      defaultRowHeight: 20,
      defaultColWidth: 18,
      dyDescent: 55,
    },
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.4, right: 0.4, top: 0.55, bottom: 0.5, header: 0.2, footer: 0.25 },
    },
    headerFooter: {
      oddHeader: isRtl
        ? `&R${document.appName}&C${document.title}&L${document.languageLabel}`
        : `&L${document.appName}&C${document.title}&R${document.languageLabel}`,
      oddFooter: isRtl
        ? `&C&P / &N&L${document.generatedAt}`
        : `&C&P / &N&R${document.generatedAt}`,
    },
  })

  const widths = Array.from({ length: lastColumn }, () => 16)
  let rowIndex = 1

  writeBanner(sheet, rowIndex, isRtl, lastColumn, `${document.appName}  ·  ${document.portal}`, {
    fill: reportTheme.purple,
    bold: true,
    size: 13,
    color: reportTheme.white,
    height: 28,
  })
  rowIndex += 1

  writeBanner(sheet, rowIndex, isRtl, lastColumn, '', {
    fill: reportTheme.amber,
    height: 6,
  })
  rowIndex += 1

  writeBanner(sheet, rowIndex, isRtl, lastColumn, document.title, {
    fill: reportTheme.surface,
    bold: true,
    size: 18,
    color: reportTheme.ink,
    height: 30,
  })
  rowIndex += 1

  if (document.subtitle) {
    writeBanner(sheet, rowIndex, isRtl, lastColumn, document.subtitle, {
      fill: reportTheme.surface,
      size: 11,
      color: reportTheme.muted,
      height: 22,
    })
    rowIndex += 1
  }

  writeCells(
    sheet,
    rowIndex,
    isRtl,
    [
      i18n.t('reports.generatedAt'),
      document.generatedAt,
      i18n.t('common.language'),
      document.languageLabel,
    ],
    { fill: reportTheme.white, size: 10, height: 20, bordered: false },
  )
  ;[i18n.t('reports.generatedAt'), document.generatedAt, i18n.t('common.language'), document.languageLabel].forEach(
    (value, index) => {
      widths[index] = Math.max(widths[index] ?? 16, columnWidth([value]))
    },
  )
  rowIndex += 2

  if (document.filters.length > 0) {
    writeBanner(sheet, rowIndex, isRtl, lastColumn, i18n.t('reports.filters'), {
      fill: reportTheme.purpleSoft,
      bold: true,
      size: 12,
      color: reportTheme.purple,
      height: 24,
    })
    rowIndex += 1

    for (const filter of document.filters) {
      writeCells(sheet, rowIndex, isRtl, [filter.label, filter.value], {
        fill: reportTheme.surface,
        height: 20,
      })
      widths[0] = Math.max(widths[0], columnWidth([filter.label]))
      widths[1] = Math.max(widths[1], columnWidth([filter.value]))
      rowIndex += 1
    }

    rowIndex += 1
  }

  for (const section of document.sections) {
    writeBanner(sheet, rowIndex, isRtl, lastColumn, section.title, {
      fill: reportTheme.amberSoft,
      bold: true,
      size: 13,
      color: reportTheme.purple,
      height: 26,
    })
    rowIndex += 1

    if (section.metrics?.length) {
      const metricHeaders = [i18n.t('reports.indicator'), i18n.t('common.amount'), i18n.t('common.notes')]
      writeCells(sheet, rowIndex, isRtl, metricHeaders, { header: true, height: 28 })
      metricHeaders.forEach((label, index) => {
        widths[index] = Math.max(widths[index], columnWidth([label]))
      })
      rowIndex += 1

      section.metrics.forEach((metric, metricIndex) => {
        const values = [metric.label, metric.value, metric.hint ?? '']
        writeCells(sheet, rowIndex, isRtl, values, {
          fill: metricIndex % 2 === 0 ? reportTheme.white : reportTheme.stripe,
          height: 22,
        })
        values.forEach((value, index) => {
          widths[index] = Math.max(widths[index], columnWidth([value]))
        })
        rowIndex += 1
      })

      rowIndex += 1
    }

    if (section.table) {
      const headers = [i18n.t('reports.rowNumber'), ...section.table.columns]
      writeCells(sheet, rowIndex, isRtl, headers, { header: true, height: 32 })
      headers.forEach((label, index) => {
        widths[index] = Math.max(widths[index] ?? 16, columnWidth([label]))
      })
      const tableStart = rowIndex
      rowIndex += 1

      if (section.table.rows.length === 0) {
        writeBanner(sheet, rowIndex, isRtl, headers.length, i18n.t('reports.noData'), {
          fill: reportTheme.surface,
          italic: true,
          size: 10,
          color: reportTheme.muted,
          height: 24,
          bordered: true,
        })
        rowIndex += 1
      } else {
        section.table.rows.forEach((values, rowOffset) => {
          const cells = [
            String(rowOffset + 1),
            ...headers.slice(1).map((_, index) => values[index] ?? ''),
          ]
          writeCells(sheet, rowIndex, isRtl, cells, {
            fill: rowOffset % 2 === 0 ? reportTheme.white : reportTheme.stripe,
            height: 22,
          })
          cells.forEach((value, index) => {
            widths[index] = Math.max(widths[index] ?? 16, columnWidth([value]))
          })
          rowIndex += 1
        })
        sheet.autoFilter = {
          from: { row: tableStart, column: 1 },
          to: { row: rowIndex - 1, column: headers.length },
        }
      }

      rowIndex += 1
    }
  }

  writeBanner(sheet, rowIndex, isRtl, lastColumn, `${i18n.t('reports.footer')}  ·  ${document.appName}`, {
    fill: reportTheme.surface,
    italic: true,
    size: 9,
    color: reportTheme.muted,
    height: 20,
  })

  for (let column = 1; column <= lastColumn; column += 1) {
    sheet.getColumn(column).width = widths[column - 1] ?? 16
  }

  return workbook.xlsx.writeBuffer()
}

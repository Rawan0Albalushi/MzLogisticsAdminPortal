import type { ReportDocument, ReportTable } from '@/shared/reports/types.ts'

const PORTRAIT_WIDTH = 718
const LANDSCAPE_WIDTH = 1046
const UNIT_PX = 6.6
const CELL_PAD = 16

export function plainReportText(value: string): string {
  return value.replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
}

function visualUnits(value: string): number {
  let units = 0
  for (const char of plainReportText(value)) {
    const code = char.codePointAt(0) ?? 0
    const wide = (code >= 0x0600 && code <= 0x06ff) || code > 0xff
    units += wide ? 1.75 : 1
  }
  return units
}

function longestWordUnits(value: string): number {
  const parts = plainReportText(value).split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 2
  }
  return parts.reduce((max, part) => Math.max(max, visualUnits(part)), 0)
}

function columnNeeds(table: ReportTable): number[] {
  return table.columns.map((label, index) => {
    let word = longestWordUnits(label)
    for (const row of table.rows.slice(0, 40)) {
      word = Math.max(word, longestWordUnits(row[index] ?? ''))
    }
    return Math.max(52, word * UNIT_PX + CELL_PAD)
  })
}

export function tableContentWidth(table: ReportTable): number {
  if (table.widths && table.widths.length > 0) {
    return PORTRAIT_WIDTH
  }
  const numbered = table.numbered !== false
  const columns = columnNeeds(table).reduce((sum, width) => sum + width, numbered ? 36 : 0)
  return Math.ceil(columns)
}

export function pdfSheetWidth(document: ReportDocument): number {
  const needed = document.sections.reduce((max, section) => {
    return section.table ? Math.max(max, tableContentWidth(section.table)) : max
  }, PORTRAIT_WIDTH)
  if (needed <= PORTRAIT_WIDTH + 24) {
    return PORTRAIT_WIDTH
  }
  return Math.min(1600, Math.max(LANDSCAPE_WIDTH, needed))
}

export function tableColumnPercents(table: ReportTable, sheetWidth: number): string[] {
  const numbered = table.numbered !== false
  const mins = numbered ? [36] : []
  const prefs = numbered ? [40] : []

  table.columns.forEach((label, index) => {
    let word = longestWordUnits(label)
    let full = visualUnits(label)
    for (const row of table.rows.slice(0, 40)) {
      const cell = row[index] ?? ''
      word = Math.max(word, longestWordUnits(cell))
      full = Math.max(full, Math.min(visualUnits(cell), 34))
    }
    const minPx = Math.max(52, word * UNIT_PX + CELL_PAD)
    mins.push(minPx)
    prefs.push(Math.max(minPx, Math.min(full * UNIT_PX + CELL_PAD, 240)))
  })

  const minSum = mins.reduce((sum, width) => sum + width, 0)
  let pixels = mins.slice()
  if (minSum < sheetWidth) {
    const extra = sheetWidth - minSum
    const preference = prefs.reduce((sum, preferred, index) => sum + (preferred - mins[index]), 0)
    pixels = mins.map((min, index) =>
      min + (preference > 0 ? ((prefs[index] - min) / preference) * extra : extra / mins.length),
    )
  } else if (minSum > sheetWidth) {
    const scale = sheetWidth / minSum
    pixels = mins.map((min) => min * scale)
  }

  const total = pixels.reduce((sum, width) => sum + width, 0)
  return pixels.map((width) => `${((width / total) * 100).toFixed(2)}%`)
}

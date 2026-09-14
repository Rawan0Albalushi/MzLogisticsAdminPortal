import { buildExcelWorkbook } from '@/shared/reports/buildExcelWorkbook.ts'
import { generatePdfFile } from '@/shared/reports/generatePdf.ts'
import { downloadBlob, reportFileName } from '@/shared/reports/reportTheme.ts'
import type { ReportDocument, ReportFormat } from '@/shared/reports/types.ts'

async function downloadExcelReport(document: ReportDocument): Promise<void> {
  const buffer = await buildExcelWorkbook(document)
  downloadBlob(
    buffer,
    reportFileName(document.title, document.language, 'xlsx'),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

export async function downloadReport(document: ReportDocument, format: ReportFormat): Promise<void> {
  if (format === 'excel') {
    await downloadExcelReport(document)
    return
  }
  await generatePdfFile(document)
}

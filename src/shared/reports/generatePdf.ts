import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { buildPdfCaptureHtml } from '@/shared/reports/buildPdfHtml.ts'
import { reportFileName } from '@/shared/reports/reportTheme.ts'
import type { ReportDocument } from '@/shared/reports/types.ts'

const A4_CONTENT_WIDTH_PX = 718

async function waitForFonts(): Promise<void> {
  if (document.fonts) {
    await document.fonts.ready
  }
  await new Promise((resolve) => window.setTimeout(resolve, 80))
}

function resetCapturedText(root: HTMLElement): void {
  const nodes = [root, ...root.querySelectorAll<HTMLElement>('*')]
  for (const node of nodes) {
    node.style.setProperty('letter-spacing', '0', 'important')
    node.style.setProperty('word-spacing', 'normal', 'important')
    node.style.setProperty('font-kerning', 'none', 'important')
    node.style.setProperty('font-variant-ligatures', 'none', 'important')
  }
}

function addImagePages(pdf: jsPDF, dataUrl: string, pixelWidth: number, pixelHeight: number): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2
  const imageWidth = usableWidth
  const imageHeight = (pixelHeight * imageWidth) / pixelWidth

  const pageCount = Math.max(1, Math.ceil(imageHeight / usableHeight))
  for (let page = 0; page < pageCount; page += 1) {
    if (page > 0) {
      pdf.addPage()
    }
    const offset = margin - page * usableHeight
    pdf.addImage(dataUrl, 'PNG', margin, offset, imageWidth, imageHeight, undefined, 'FAST')
  }
}

export async function generatePdfFile(report: ReportDocument): Promise<void> {
  const host = window.document.createElement('div')
  host.setAttribute('data-mz-pdf-host', '')
  host.dir = report.language === 'ar' ? 'rtl' : 'ltr'
  host.lang = report.language
  host.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-10000px',
    `width:${A4_CONTENT_WIDTH_PX}px`,
    'overflow:visible',
    'background:#ffffff',
    'opacity:1',
    'pointer-events:none',
    'z-index:-1',
    'letter-spacing:0',
    'word-spacing:normal',
    "font-family:Tahoma,'Segoe UI',Arial,sans-serif",
  ].join(';')
  host.innerHTML = buildPdfCaptureHtml(report)
  window.document.body.appendChild(host)

  try {
    const sheet = host.querySelector<HTMLElement>('.sheet') ?? host
    sheet.style.overflow = 'visible'
    host.querySelectorAll<HTMLElement>('.table-wrap').forEach((wrap) => {
      wrap.style.overflow = 'visible'
    })
    resetCapturedText(host)
    await waitForFonts()

    const dataUrl = await toPng(host, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: false,
      skipFonts: true,
      fontEmbedCSS: '',
      width: A4_CONTENT_WIDTH_PX,
      height: Math.max(sheet.scrollHeight, sheet.offsetHeight, host.scrollHeight),
      style: {
        position: 'static',
        left: '0',
        top: '0',
        opacity: '1',
        transform: 'none',
        letterSpacing: '0px',
        wordSpacing: '0px',
      },
    })

    const image = new Image()
    image.src = dataUrl
    await image.decode()

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })
    addImagePages(pdf, dataUrl, image.naturalWidth || image.width, image.naturalHeight || image.height)
    pdf.save(reportFileName(report.title, report.language, 'pdf'))
  } finally {
    host.remove()
  }
}

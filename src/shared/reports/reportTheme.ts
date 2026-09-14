export const reportTheme = {
  ink: '1C1633',
  muted: '6B647C',
  white: 'FFFFFF',
  purple: '27155E',
  purpleMid: '3D22A8',
  purpleSoft: 'EDE7FA',
  amber: 'FFB020',
  amberSoft: 'FFF6E0',
  surface: 'F4F1F8',
  border: 'E0DAEA',
  stripe: 'F7F4FC',
  success: '2F6F4E',
} as const

export function slugify(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'report'
}

export function reportFileName(title: string, language: string, extension: 'pdf' | 'xlsx'): string {
  const date = new Date().toISOString().slice(0, 10)
  return `mz-${slugify(title)}-${language}-${date}.${extension}`
}

export function safeSheetName(value: string): string {
  const cleaned = value.replace(/[:\\/?*[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  return (cleaned || 'Report').slice(0, 31)
}

export function columnWidth(values: string[]): number {
  const longest = values.reduce((max, value) => {
    const visual = [...String(value)].reduce((sum, char) => {
      const code = char.codePointAt(0) ?? 0
      const arabic = code >= 0x0600 && code <= 0x06ff
      const wide = arabic || code > 0xff
      return sum + (wide ? 1.85 : 1)
    }, 0)
    return Math.max(max, visual)
  }, 0)
  return Math.min(42, Math.max(14, Math.ceil(longest) + 4))
}

export function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

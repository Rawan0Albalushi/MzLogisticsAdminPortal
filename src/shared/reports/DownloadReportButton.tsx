import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon } from '@/shared/icons/NavIcons.tsx'
import { downloadReport } from '@/shared/reports/downloadReport.ts'
import type { ReportDocument, ReportFormat } from '@/shared/reports/types.ts'

interface DownloadReportButtonProps {
  build: () => ReportDocument | Promise<ReportDocument>
  disabled?: boolean
}

export function DownloadReportButton({ build, disabled }: DownloadReportButtonProps) {
  const { t } = useTranslation()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function exportReport(format: ReportFormat) {
    setBusy(true)
    setError('')
    try {
      const document = await build()
      await downloadReport(document, format)
      setOpen(false)
    } catch (cause) {
      console.error('MZ report export failed', cause)
      setError(t('reports.exportFailed'))
      setOpen(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mz-report-menu" ref={rootRef}>
      <button
        type="button"
        className="mz-btn mz-btn--ghost"
        disabled={disabled || busy}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <AppIcon name="download" width={15} height={15} />
        {busy ? t('reports.downloading') : t('reports.download')}
      </button>
      {open ? (
        <div className="mz-report-menu__list" id={menuId} role="menu">
          <p className="mz-report-menu__hint">{t('reports.exportHint')}</p>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void exportReport('pdf')}>
            {t('reports.downloadPdf')}
          </button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void exportReport('excel')}>
            {t('reports.downloadExcel')}
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="mz-report-menu__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

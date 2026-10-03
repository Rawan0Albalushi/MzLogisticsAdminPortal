import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import {
  downloadImportTemplate,
  importSpreadsheet,
  type SpreadsheetImportError,
  type SpreadsheetImportResult,
} from '@/core/api/services.ts'
import { getApiMessage } from '@/core/api/client.ts'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog.tsx'
import { formatActivationCode } from '@/shared/utils/format.ts'

interface ExcelImportDialogProps {
  open: boolean
  title: string
  hint: string
  templatePath: string
  templateFilename: string
  importPath: string
  detailKeys: (keyof SpreadsheetImportError)[]
  localizeError: (error: SpreadsheetImportError) => string
  onImported: (result: SpreadsheetImportResult) => void
  onClose: () => void
}

function errorDetails(error: SpreadsheetImportError, keys: (keyof SpreadsheetImportError)[]): string {
  return keys
    .map((key) => {
      const value = error[key]
      return typeof value === 'string' ? value.trim() : ''
    })
    .filter(Boolean)
    .join(' · ')
}

async function importErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const payload = JSON.parse(await error.response.data.text()) as {
        message?: string
        errors?: Record<string, string[]>
      }
      const fieldError = payload.errors ? Object.values(payload.errors).flat()[0] : undefined
      return fieldError ?? payload.message ?? fallback
    } catch {
      return fallback
    }
  }
  return getApiMessage(error, fallback)
}

export function ExcelImportDialog({
  open,
  title,
  hint,
  templatePath,
  templateFilename,
  importPath,
  detailKeys,
  localizeError,
  onImported,
  onClose,
}: ExcelImportDialogProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<SpreadsheetImportResult | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (open) {
      return
    }
    setFile(null)
    setResult(null)
    setNotice('')
    setError('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [open])

  async function downloadTemplate() {
    if (downloading) return
    setDownloading(true)
    setError('')
    try {
      await downloadImportTemplate(templatePath, templateFilename)
      setNotice(t('import.templateDownloaded'))
    } catch (err) {
      setNotice('')
      setError(await importErrorMessage(err, t('import.failed')))
    } finally {
      setDownloading(false)
    }
  }

  async function upload() {
    if (!file) {
      setError(t('import.noFile'))
      return
    }
    if (uploading) return
    setUploading(true)
    setError('')
    setNotice('')
    try {
      const imported = await importSpreadsheet(importPath, file)
      setResult(imported)
      onImported(imported)
    } catch (err) {
      setError(await importErrorMessage(err, t('import.failed')))
    } finally {
      setUploading(false)
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setNotice(t('import.inviteCopied'))
      setError('')
    } catch {
      setError(t('import.failed'))
    }
  }

  const drivers = result?.drivers ?? []
  const items = result?.items ?? []
  const unsent = drivers.filter((driver) => !driver.whatsapp_sent && driver.activation_code)

  return (
    <ConfirmDialog
      open={open}
      wide
      title={title}
      confirmLabel={uploading ? t('import.uploading') : t('import.upload')}
      cancelLabel={t('common.close')}
      busy={uploading}
      disabled={!file}
      onConfirm={() => void upload()}
      onClose={onClose}
    >
      <div className="mz-import">
        <p className="mz-import__hint">{hint}</p>
        {notice ? <div className="mz-alert mz-alert--ok">{notice}</div> : null}
        {error ? <div className="mz-alert">{error}</div> : null}
        <div className="mz-form-actions">
          <button type="button" className="mz-btn mz-btn--ghost" onClick={() => void downloadTemplate()} disabled={downloading || uploading}>
            {downloading ? t('common.loading') : t('import.downloadTemplate')}
          </button>
          <button type="button" className="mz-btn mz-btn--ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {file?.name ?? t('import.chooseFile')}
          </button>
          <input
            ref={inputRef}
            id="excel-import-file"
            className="mz-file-input"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            aria-label={t('import.chooseFile')}
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null
              setFile(next)
              setResult(null)
              setError('')
            }}
          />
        </div>
        {result ? (
          <div className="mz-import__results">
            <p className="mz-import__summary">{t('import.summary', { created: result.created, failed: result.failed })}</p>
            {unsent.length > 0 ? (
              <button
                type="button"
                className="mz-btn mz-btn--ghost"
                onClick={() =>
                  void copyText(unsent.map((driver) => `${driver.name}\t${driver.phone ?? ''}\t${formatActivationCode(driver.activation_code)}`).join('\n'))
                }
              >
                {t('import.copyUnsent')}
              </button>
            ) : null}
            {items.length > 0 ? (
              <ul className="mz-import__list">
                {items.map((item) => (
                  <li key={`${item.row}-${item.label}`}>
                    <span>{item.label}</span>
                    <span>{t('import.row', { row: item.row })}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {drivers.length > 0 ? (
              <ul className="mz-import__list">
                {drivers.map((driver) => (
                  <li key={`${driver.row}-${driver.name}`}>
                    <span>
                      <strong>{driver.name}</strong>
                      <small>{driver.whatsapp_sent ? t('import.whatsappSent') : formatActivationCode(driver.activation_code)}</small>
                    </span>
                    <span className="mz-import__row-actions">
                      <span>{t('import.row', { row: driver.row })}</span>
                      {driver.activation_code ? (
                        <button type="button" className="mz-btn mz-btn--ghost" onClick={() => void copyText(formatActivationCode(driver.activation_code))}>
                          {t('import.copyInvite')}
                        </button>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {result.errors.map((rowError) => {
              const details = errorDetails(rowError, detailKeys)
              return (
                <div key={`${rowError.row}-${rowError.field}-${rowError.message}`} className="mz-import-error">
                  <strong>{details ? t('import.rowDetails', { row: rowError.row, details }) : t('import.row', { row: rowError.row })}</strong>
                  <p>{localizeError(rowError)}</p>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </ConfirmDialog>
  )
}

import type { KeyboardEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ApiMeta } from '@/core/api/types.ts'
import { EmptyState } from '@/shared/components/EmptyState.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { ErrorState } from '@/shared/components/ErrorState.tsx'

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  meta?: ApiMeta
  onPageChange?: (page: number) => void
  rowTo?: (row: T) => string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  onRetry,
  meta,
  onPageChange,
  rowTo,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  function openRow(row: T) {
    if (!rowTo) {
      return
    }
    void navigate(rowTo(row))
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!rowTo) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openRow(row)
    }
  }

  if (isLoading) {
    return (
      <div className="mz-card">
        <LoadingState />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mz-card">
        <ErrorState onRetry={onRetry} />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="mz-card">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="mz-table-wrap">
      <table className="mz-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={rowTo ? 'mz-table__row--clickable' : undefined}
              tabIndex={rowTo ? 0 : undefined}
              onClick={
                rowTo
                  ? (event) => {
                      const target = event.target as HTMLElement
                      if (target.closest('a, button')) {
                        return
                      }
                      openRow(row)
                    }
                  : undefined
              }
              onKeyDown={rowTo ? (event) => onRowKeyDown(event, row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.id}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {meta && onPageChange ? (
        <div className="mz-pagination">
          <span>
            {t('common.showing')} {meta.total} {t('common.results')} · {t('common.page')} {meta.current_page}{' '}
            {t('common.of')} {meta.last_page}
          </span>
          <div className="mz-pagination__controls">
            <button
              type="button"
              className="mz-btn mz-btn--ghost"
              disabled={meta.current_page <= 1}
              onClick={() => onPageChange(meta.current_page - 1)}
            >
              {t('common.previous')}
            </button>
            <button
              type="button"
              className="mz-btn mz-btn--ghost"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => onPageChange(meta.current_page + 1)}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

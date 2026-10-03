import { useEffect, useId, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchJobs } from '@/core/api/services.ts'
import { organizationName } from '@/shared/utils/format.ts'

interface JobFilterProps {
  value: string
  label?: string
  onChange: (value: string) => void
}

export function JobFilter({ value, label, onChange }: JobFilterProps) {
  const { t } = useTranslation()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [chosenLabel, setChosenLabel] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(draft.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [draft])

  useEffect(() => {
    if (!open) {
      return
    }
    searchRef.current?.focus()
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const jobs = useQuery({
    queryKey: ['jobs', 'trip-filter', search],
    queryFn: () => fetchJobs({ search, page: 1, per_page: 20 }),
    enabled: open,
    placeholderData: keepPreviousData,
  })

  const selected = Boolean(value)
  const triggerLabel = selected ? label || chosenLabel || '…' : t('common.allJobs')

  const choose = (next: string, nextLabel = '') => {
    setChosenLabel(nextLabel)
    onChange(next)
    setDraft('')
    setSearch('')
    setOpen(false)
  }

  return (
    <div className="mz-job-filter" ref={rootRef}>
      <button
        type="button"
        className={`mz-job-filter__trigger${selected ? '' : ' is-empty'}`}
        aria-label={t('common.job')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="mz-job-filter__value">{triggerLabel}</span>
        <span className="mz-job-filter__icons">
          {selected ? (
            <span
              className="mz-job-filter__clear"
              role="button"
              tabIndex={0}
              aria-label={t('common.allJobs')}
              onClick={(event) => {
                event.stopPropagation()
                choose('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  choose('')
                }
              }}
            >
              ×
            </span>
          ) : null}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="mz-job-filter__popover" role="dialog" aria-label={t('common.job')}>
          <input
            ref={searchRef}
            className="mz-input mz-job-filter__search"
            type="search"
            value={draft}
            placeholder={t('common.searchJob')}
            aria-label={t('common.searchJob')}
            onChange={(event) => setDraft(event.target.value)}
          />
          <ul className="mz-job-filter__list" id={listId} role="listbox" aria-label={t('common.job')}>
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!selected}
                className={`mz-job-filter__option${selected ? '' : ' is-active'}`}
                onClick={() => choose('')}
              >
                <span>{t('common.allJobs')}</span>
              </button>
            </li>
            {jobs.isLoading ? (
              <li className="mz-job-filter__empty">{t('common.loading')}</li>
            ) : jobs.isError ? (
              <li className="mz-job-filter__empty">{t('common.error')}</li>
            ) : (jobs.data?.items.length ?? 0) === 0 ? (
              <li className="mz-job-filter__empty">{t('common.noResults')}</li>
            ) : (
              jobs.data?.items.map((job) => {
                const active = String(job.id) === value
                const customer = job.customer ? organizationName(job.customer) : ''
                return (
                  <li key={job.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`mz-job-filter__option${active ? ' is-active' : ''}`}
                      onClick={() => choose(String(job.id), job.reference)}
                    >
                      <span>{job.reference}</span>
                      {customer ? <small>{customer}</small> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

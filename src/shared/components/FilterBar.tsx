import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mz-filters">{children}</div>
}

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function parseIso(value: string) {
  if (!value) {
    return null
  }
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return new Date(year, month - 1, day)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const { t, i18n } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'start' | 'end'>('start')
  const [cursor, setCursor] = useState(() => parseIso(from) ?? parseIso(to) ?? new Date())
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftTo, setDraftTo] = useState(to)
  const [hover, setHover] = useState('')

  useEffect(() => {
    if (!open) {
      setStep('start')
      setHover('')
      setDraftFrom(from)
      setDraftTo(to)
      setCursor(parseIso(from) ?? parseIso(to) ?? new Date())
    }
  }, [from, to, open])

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startOffset = first.getDay()
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    return Array.from({ length: startOffset + total }, (_, index) => {
      if (index < startOffset) {
        return null
      }
      return new Date(cursor.getFullYear(), cursor.getMonth(), index - startOffset + 1)
    })
  }, [cursor])

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' })
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2026, 2, index + 1)))
  }, [i18n.language])

  const label = from && to ? `${from} – ${to}` : from || to || t('common.dateRange')
  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(cursor)

  const previewEnd = draftTo || (step === 'end' ? hover : '')

  const selectDay = (date: Date) => {
    const iso = toIso(date)
    if (step === 'start' || !draftFrom) {
      setDraftFrom(iso)
      setDraftTo('')
      setHover('')
      setStep('end')
      return
    }
    const start = parseIso(draftFrom)
    if (!start) {
      setDraftFrom(iso)
      setStep('end')
      return
    }
    const [nextFrom, nextTo] = startOfDay(date) < startOfDay(start) ? [iso, draftFrom] : [draftFrom, iso]
    setDraftFrom(nextFrom)
    setDraftTo(nextTo)
    setStep('start')
    onChange(nextFrom, nextTo)
    setOpen(false)
  }

  const dayClass = (date: Date) => {
    const iso = toIso(date)
    const start = draftFrom ? parseIso(draftFrom) : null
    const end = previewEnd ? parseIso(previewEnd) : null
    const classes = ['mz-date-range__day']
    if (iso === draftFrom) {
      classes.push('is-start')
    }
    if (iso === previewEnd) {
      classes.push('is-end')
    }
    if (start && end) {
      const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start]
      if (date >= rangeStart && date <= rangeEnd) {
        classes.push('is-in')
      }
    }
    if (iso === toIso(new Date())) {
      classes.push('is-today')
    }
    return classes.join(' ')
  }

  return (
    <div className="mz-date-range" ref={rootRef}>
      <button
        type="button"
        className={`mz-date-range__trigger${!from && !to ? ' is-empty' : ''}`}
        aria-label={t('common.dateRange')}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{label}</span>
        <span className="mz-date-range__icons">
          {from || to ? (
            <span
              className="mz-date-range__clear"
              role="button"
              tabIndex={0}
              aria-label={t('common.clearDateRange')}
              onClick={(event) => {
                event.stopPropagation()
                onChange('', '')
                setOpen(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  onChange('', '')
                  setOpen(false)
                }
              }}
            >
              ×
            </span>
          ) : null}
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="3.6" y="5.2" width="16.8" height="15" rx="2" />
            <path d="M3.6 9.4h16.8M8 3.8v3M16 3.8v3" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="mz-date-range__popover" role="dialog" aria-label={t('common.dateRange')}>
          <div className="mz-date-range__nav">
            <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              ›
            </button>
          </div>
          <div className="mz-date-range__week">
            {weekdays.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <p className="mz-date-range__hint">
            {step === 'end' ? t('common.dateRangePickEnd') : t('common.dateRangePickStart')}
          </p>
          <div className="mz-date-range__grid">
            {days.map((date, index) =>
              date ? (
                <button
                  key={toIso(date)}
                  type="button"
                  className={dayClass(date)}
                  onMouseEnter={() => setHover(toIso(date))}
                  onMouseLeave={() => setHover('')}
                  onClick={() => selectDay(date)}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface StatusFilterProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  allLabel: string
  label: (status: string) => string
}

export function StatusFilter({ value, options, onChange, allLabel, label }: StatusFilterProps) {
  return (
    <select className="mz-select" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {label(option)}
        </option>
      ))}
    </select>
  )
}

import { useEffect, useId, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

export type TableActionIcon =
  | 'view'
  | 'edit'
  | 'delete'
  | 'receipt'
  | 'invite'
  | 'confirm'
  | 'enable'
  | 'disable'
  | 'detach'
  | 'prev'
  | 'next'

type Tone = 'default' | 'danger' | 'success' | 'warning'

interface TableIconButtonProps {
  label: string
  icon: TableActionIcon
  tone?: Tone
  to?: string
  onClick?: () => void
  disabled?: boolean
}

interface TipPosition {
  x: number
  y: number
  below: boolean
}

export function TableIconButton({ label, icon, tone = 'default', to, onClick, disabled }: TableIconButtonProps) {
  const tipId = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<TipPosition>({ x: 0, y: 0, below: false })

  useEffect(() => {
    if (!open) {
      return
    }

    function close() {
      setOpen(false)
    }

    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function place(target: HTMLElement) {
    const rect = target.getBoundingClientRect()
    const below = rect.top < 52
    setPos({
      x: rect.left + rect.width / 2,
      y: below ? rect.bottom : rect.top,
      below,
    })
    setOpen(true)
  }

  function show(event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) {
    place(event.currentTarget)
  }

  function hide() {
    setOpen(false)
  }

  const className = `mz-row-action${tone === 'default' ? '' : ` mz-row-action--${tone}`}`
  const shared = {
    className,
    'aria-label': label,
    'aria-describedby': open ? tipId : undefined,
    onFocus: show,
    onBlur: hide,
  }

  const glyph = <ActionGlyph name={icon} />
  const control = to ? (
    <Link to={to} {...shared}>
      {glyph}
    </Link>
  ) : (
    <button type="button" {...shared} disabled={disabled} onClick={onClick}>
      {glyph}
    </button>
  )

  return (
    <>
      <span className="mz-row-action-host" onMouseEnter={show} onMouseLeave={hide}>
        {control}
      </span>
      {open
        ? createPortal(
            <span id={tipId} role="tooltip" className={`mz-tip${pos.below ? ' mz-tip--below' : ''}`} style={{ left: pos.x, top: pos.y }}>
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  )
}

function ActionGlyph({ name }: { name: TableActionIcon }) {
  const chevron = name === 'prev' ? 'start' : name === 'next' ? 'end' : null
  const mirrors = name === 'enable' || name === 'disable'
  const className = [chevron ? `mz-chevron mz-chevron--${chevron}` : '', mirrors ? 'mz-glyph--mirror' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className || undefined}
    >
      {glyphs[name]}
    </svg>
  )
}

const glyphs: Record<TableActionIcon, ReactNode> = {
  view: (
    <>
      <path d="M2.6 12s3.6-6 9.4-6 9.4 6 9.4 6-3.6 6-9.4 6-9.4-6-9.4-6z" fill="currentColor" opacity="0.16" />
      <path d="M2.6 12s3.6-6 9.4-6 9.4 6 9.4 6-3.6 6-9.4 6-9.4-6-9.4-6z" />
      <circle cx="12" cy="12" r="2.7" fill="currentColor" opacity="0.22" />
      <circle cx="12" cy="12" r="2.7" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  edit: (
    <>
      <path d="m14.6 4.7 4.7 4.7L9 19.7H4.3v-4.7z" fill="currentColor" opacity="0.16" />
      <path d="m14.6 4.7 4.7 4.7L9 19.7H4.3v-4.7z" />
      <path d="m12.9 6.4 4.7 4.7" />
      <path d="M4.3 15.4 8.6 19.7" />
    </>
  ),
  delete: (
    <>
      <path d="M4.8 7.3h14.4" />
      <path d="M9.2 7.2V5.1h5.6v2.1" />
      <path d="M7.4 7.5h9.2l-.75 12H8.15z" fill="currentColor" opacity="0.16" />
      <path d="M7.4 7.5 8.15 19.5h7.7l.75-12" />
      <path d="M10.3 10.6v5.2M13.7 10.6v5.2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6.6 3.2h7l4.8 4.8v12.8H6.6z" fill="currentColor" opacity="0.14" />
      <path d="M6.6 3.2h7l4.8 4.8v12.8H6.6z" />
      <path d="M13.6 3.2v4.8h4.8" />
      <path d="M12.6 9.8v4.4" />
      <path d="m10 12.4 2.6 2.6 2.6-2.6" />
      <path d="M9.4 17.2h5.2" />
    </>
  ),
  invite: (
    <>
      <rect x="3.2" y="6.2" width="17.6" height="11.6" rx="2.2" fill="currentColor" opacity="0.14" />
      <rect x="3.2" y="6.2" width="17.6" height="11.6" rx="2.2" />
      <path d="m4 7.1 8 5.8 8-5.8" />
    </>
  ),
  confirm: (
    <>
      <circle cx="12" cy="12" r="8.2" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="12" r="8.2" />
      <path d="m7.8 12.2 2.7 2.7 5.7-6" />
    </>
  ),
  enable: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="17" cy="12" r="3.1" fill="currentColor" stroke="none" />
    </>
  ),
  disable: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="7" cy="12" r="3.1" fill="currentColor" stroke="none" />
    </>
  ),
  detach: (
    <>
      <path d="M8.8 7.2H7.2a4.8 4.8 0 0 0 0 9.6h1.6" />
      <path d="M15.2 7.2h1.6a4.8 4.8 0 0 1 0 9.6h-1.6" />
    </>
  ),
  prev: <path d="M14.8 5.2 8 12l6.8 6.8" />,
  next: <path d="M14.8 5.2 8 12l6.8 6.8" />,
}

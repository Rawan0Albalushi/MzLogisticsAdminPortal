import type { ReactNode } from 'react'

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mz-filters">{children}</div>
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

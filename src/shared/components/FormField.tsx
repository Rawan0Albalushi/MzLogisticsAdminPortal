import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  wide?: boolean
  children: ReactNode
}

export function FormField({ label, htmlFor, required, error, hint, wide, children }: FormFieldProps) {
  return (
    <div className={wide ? 'mz-field mz-field--wide' : 'mz-field'}>
      <label htmlFor={htmlFor}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? <span className="mz-field__error">{error}</span> : hint ? <span className="mz-field__hint">{hint}</span> : null}
    </div>
  )
}

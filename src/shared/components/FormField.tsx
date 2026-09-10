import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="mz-field">
      <label htmlFor={htmlFor}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? <span className="mz-field__error">{error}</span> : hint ? <span className="mz-field__hint">{hint}</span> : null}
    </div>
  )
}

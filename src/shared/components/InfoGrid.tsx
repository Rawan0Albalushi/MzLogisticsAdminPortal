import { displayValue } from '@/shared/utils/format.ts'
import type { ReactNode } from 'react'
import { AppIcon, type IconName } from '@/shared/icons/NavIcons.tsx'

export interface InfoField {
  label: string
  value?: ReactNode
  wide?: boolean
  dir?: 'ltr' | 'rtl'
  icon?: IconName
}

function isEmpty(value: ReactNode): boolean {
  return value == null || value === ''
}

export function InfoGrid({ fields }: { fields: InfoField[] }) {
  return (
    <dl className="mz-info-grid">
      {fields.map((field) => {
        const empty = isEmpty(field.value)
        return (
          <div
            key={field.label}
            className={[
              'mz-info-field',
              empty ? 'mz-info-field--empty' : '',
              field.wide ? 'mz-info-field--wide' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <dt className="mz-info-field__label">
              {field.icon ? <AppIcon name={field.icon} /> : null}
              {field.label}
            </dt>
            <dd className="mz-info-field__value" dir={field.dir}>
              {empty ? displayValue(null) : field.value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

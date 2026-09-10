import { displayValue } from '@/shared/utils/format.ts'
import type { ReactNode } from 'react'

interface DetailItem {
  label: string
  value: ReactNode
}

export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="mz-dl">
      {items.map((item) => (
        <div key={item.label} style={{ display: 'contents' }}>
          <dt>{item.label}</dt>
          <dd>{item.value ?? displayValue(null)}</dd>
        </div>
      ))}
    </dl>
  )
}

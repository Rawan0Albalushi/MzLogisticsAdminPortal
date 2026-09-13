import { formatNumber } from '@/shared/utils/format.ts'

export type MixTone = 'info' | 'warning' | 'success' | 'neutral'

export interface MixSegment {
  label: string
  value: number
  tone: MixTone
}

export function MixBar({
  title,
  segments,
  formatValue,
}: {
  title: string
  segments: MixSegment[]
  formatValue?: (value: number) => string
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0)

  return (
    <article className="mz-card">
      <div className="mz-card__body">
        <h2 className="mz-card__title">{title}</h2>
        <div className="mz-mix-bar" role="img" aria-label={title}>
          {total === 0 ? (
            <span className="mz-mix-bar__neutral" style={{ width: '100%' }} />
          ) : (
            segments.map((segment) =>
              segment.value > 0 ? (
                <span
                  key={segment.label}
                  className={`mz-mix-bar__${segment.tone}`}
                  style={{ width: `${(segment.value / total) * 100}%` }}
                />
              ) : null,
            )
          )}
        </div>
        <ul className="mz-mix-legend">
          {segments.map((segment) => (
            <li key={segment.label}>
              <i className={`mz-mix-dot mz-mix-dot--${segment.tone}`} aria-hidden />
              <span>{segment.label}</span>
              <strong>{formatValue ? formatValue(segment.value) : formatNumber(segment.value)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

import type { ReactNode } from 'react'
import { IconWell } from '@/shared/components/IconWell.tsx'
import type { IconName } from '@/shared/icons/NavIcons.tsx'

interface SectionTitleProps {
  icon: IconName
  title: string
  extra?: ReactNode
}

export function SectionTitle({ icon, title, extra }: SectionTitleProps) {
  return (
    <div className="mz-section-title">
      <IconWell name={icon} size="sm" />
      <h2 className="mz-card__title">{title}</h2>
      {extra ? <div className="mz-section-title__extra">{extra}</div> : null}
    </div>
  )
}

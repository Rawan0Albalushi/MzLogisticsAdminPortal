import { AppIcon, type IconName } from '@/shared/icons/NavIcons.tsx'
import { toneForIcon, type IconTone } from '@/shared/icons/pageVisuals.ts'

interface IconWellProps {
  name: IconName
  tone?: IconTone
  size?: 'sm' | 'md' | 'lg'
}

export function IconWell({ name, tone, size = 'md' }: IconWellProps) {
  return (
    <div className={`mz-icon-well mz-icon-well--${tone ?? toneForIcon(name)} mz-icon-well--${size}`} aria-hidden="true">
      <AppIcon name={name} />
    </div>
  )
}

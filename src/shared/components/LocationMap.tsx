import { useTranslation } from 'react-i18next'
import { formatCoords, googleMapEmbedUrl, googleMapUrl } from '@/shared/utils/format.ts'
import { SectionTitle } from '@/shared/components/SectionTitle.tsx'
import type { IconName } from '@/shared/icons/NavIcons.tsx'

type LocationMapProps = {
  lat?: number | null
  lng?: number | null
  label?: string
  address?: string | null
  city?: string | null
  icon?: IconName
}

export function LocationMap({ lat, lng, label, address, city, icon }: LocationMapProps) {
  const { t } = useTranslation()
  const href = googleMapUrl(lat, lng)
  const embed = googleMapEmbedUrl(lat, lng)
  const line = [address, city].filter((part) => part && part.trim()).join(' · ')

  return (
    <div className="mz-map">
      {label ? <SectionTitle icon={icon ?? 'tracking'} title={label} /> : null}
      {line ? <p className="mz-map__address">{line}</p> : null}
      {href && embed ? (
        <>
          <iframe
            className="mz-map__frame"
            title={label || t('common.location')}
            src={embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="mz-map__meta">
            <span className="mz-coords">{formatCoords(lat, lng)}</span>
            <a className="mz-link" href={href} target="_blank" rel="noreferrer">
              {t('common.openInGoogleMaps')}
            </a>
          </div>
        </>
      ) : (
        <p className="mz-map__empty">{t('common.noCoordinates')}</p>
      )}
    </div>
  )
}

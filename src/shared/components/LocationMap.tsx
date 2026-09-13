import { useTranslation } from 'react-i18next'
import { formatCoords, googleMapEmbedUrl, googleMapUrl } from '@/shared/utils/format.ts'

type LocationMapProps = {
  lat?: number | null
  lng?: number | null
  label?: string
  address?: string | null
  city?: string | null
}

export function LocationMap({ lat, lng, label, address, city }: LocationMapProps) {
  const { t } = useTranslation()
  const href = googleMapUrl(lat, lng)
  const embed = googleMapEmbedUrl(lat, lng)
  const line = [address, city].filter((part) => part && part.trim()).join(' · ')

  return (
    <div className="mz-map">
      {label ? <h3 className="mz-card__title">{label}</h3> : null}
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

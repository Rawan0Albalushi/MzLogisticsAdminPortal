import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getApiMessage } from '@/core/api/client.ts'
import { placeDetails, reversePlace, searchPlaces } from '@/core/api/services.ts'
import type { PlaceLocation, PlaceSuggestion } from '@/core/api/types.ts'
import { googleMapUrl } from '@/shared/utils/format.ts'

const MAP_DEFAULT_LAT = 23.588
const MAP_DEFAULT_LNG = 58.3829
const MAP_COUNTRY_ZOOM = 7
const MAP_PLACE_ZOOM = 15

const pinIcon = L.divIcon({
  className: 'mz-map-pin',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  html: '<span class="mz-map-pin__dot"></span>',
})

interface DraftLocation {
  address: string
  city: string
  governorate: string
  wilayat: string
  lat: number | null
  lng: number | null
}

interface FocusTarget {
  lat: number
  lng: number
  zoom: number
  token: number
}

function emptyDraft(value: PlaceLocation | null): DraftLocation {
  if (!value) {
    return { address: '', city: '', governorate: '', wilayat: '', lat: null, lng: null }
  }
  return {
    address: value.address,
    city: value.city,
    governorate: value.governorate,
    wilayat: value.wilayat,
    lat: value.lat,
    lng: value.lng,
  }
}

function composedCity(place: { city?: string; wilayat?: string; governorate?: string }): string {
  const city = place.city?.trim() ?? ''
  if (city) {
    return city
  }
  return [place.wilayat, place.governorate]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ')
}

function areaLabel(location: { wilayat: string; governorate: string }): string {
  return [location.wilayat, location.governorate].filter(Boolean).join('، ')
}

function MapBridge({
  focus,
  onPick,
}: {
  focus: FocusTarget | null
  onPick: (lat: number, lng: number) => void
}) {
  const map = useMap()
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 60)
    return () => window.clearTimeout(id)
  }, [map])
  useEffect(() => {
    if (!focus) {
      return
    }
    map.flyTo([focus.lat, focus.lng], focus.zoom)
  }, [focus, map])
  return null
}

export function LocationPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: PlaceLocation | null
  onChange: (value: PlaceLocation) => void
}) {
  const { t, i18n } = useTranslation()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DraftLocation>(() => emptyDraft(value))
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [focus, setFocus] = useState<FocusTarget | null>(null)
  const skipSearch = useRef(false)
  const searchRequest = useRef(0)

  useEffect(() => {
    if (!open) {
      return
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    if (skipSearch.current) {
      skipSearch.current = false
      return
    }
    const query = search.trim()
    if (query.length < 2) {
      setSuggestions(null)
      setSearching(false)
      return
    }
    const timer = window.setTimeout(() => {
      const requestId = searchRequest.current + 1
      searchRequest.current = requestId
      const language = i18n.language
      setSearching(true)
      searchPlaces(query, language)
        .then((rows) => {
          if (searchRequest.current === requestId) {
            setSuggestions(rows)
          }
        })
        .catch((err: unknown) => {
          if (searchRequest.current !== requestId) {
            return
          }
          setSuggestions(null)
          setError(placeErrorMessage(err, t('location.searchFailed'), t('location.mapsUnavailable')))
        })
        .finally(() => {
          if (searchRequest.current === requestId) {
            setSearching(false)
          }
        })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [open, search, i18n.language, t])

  function openPicker() {
    setDraft(emptyDraft(value))
    setSearch('')
    setSuggestions(null)
    setError('')
    setFocus(
      value
        ? { lat: value.lat, lng: value.lng, zoom: MAP_PLACE_ZOOM, token: Date.now() }
        : null,
    )
    setOpen(true)
  }

  function applyPlace(place: PlaceLocation, zoom = MAP_PLACE_ZOOM) {
    const city = composedCity(place)
    setDraft({
      address: place.address ?? '',
      city,
      governorate: place.governorate ?? '',
      wilayat: place.wilayat ?? '',
      lat: place.lat,
      lng: place.lng,
    })
    setFocus({ lat: place.lat, lng: place.lng, zoom, token: Date.now() })
    setSuggestions(null)
  }

  async function chooseSuggestion(suggestion: PlaceSuggestion) {
    setBusy(true)
    setError('')
    skipSearch.current = true
    setSearch(suggestion.description)
    try {
      applyPlace(await placeDetails(suggestion.place_id, i18n.language))
    } catch (err) {
      setError(placeErrorMessage(err, t('location.searchFailed'), t('location.mapsUnavailable')))
    } finally {
      setBusy(false)
    }
  }

  async function dropPin(lat: number, lng: number) {
    setDraft((current) => ({ ...current, lat, lng }))
    setFocus({ lat, lng, zoom: MAP_PLACE_ZOOM, token: Date.now() })
    setBusy(true)
    setError('')
    try {
      const place = await reversePlace(lat, lng, i18n.language)
      if (!place || !composedCity(place)) {
        setError(t('location.searchFailed'))
        return
      }
      applyPlace({ ...place, lat, lng })
    } catch (err) {
      setError(placeErrorMessage(err, t('location.searchFailed'), t('location.mapsUnavailable')))
    } finally {
      setBusy(false)
    }
  }

  function confirm() {
    if (draft.lat === null || draft.lng === null || !draft.city.trim()) {
      return
    }
    onChange({
      address: draft.address.trim(),
      city: draft.city.trim(),
      governorate: draft.governorate,
      wilayat: draft.wilayat,
      lat: draft.lat,
      lng: draft.lng,
    })
    setOpen(false)
  }

  const ready = draft.lat !== null && draft.lng !== null && draft.city.trim() !== ''
  const mapLink = value ? googleMapUrl(value.lat, value.lng) : null
  const area = value ? areaLabel(value) : ''

  return (
    <div className="mz-location">
      <button id={id} type="button" className="mz-btn mz-btn--ghost mz-location__trigger" onClick={openPicker}>
        <MapPinIcon />
        {value ? t('location.change') : t('location.pickOnMap')}
      </button>
      {value ? (
        <div className="mz-location__summary">
          {value.address ? <p>{value.address}</p> : null}
          {area ? <p className="mz-location__meta">{area}</p> : null}
          <p className="mz-location__meta">
            {t('location.coordinates')}: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
          {mapLink ? (
            <a className="mz-location__link" href={mapLink} target="_blank" rel="noreferrer">
              {t('location.openInGoogleMaps')}
            </a>
          ) : null}
        </div>
      ) : (
        <p className="mz-location__meta">{t('location.dropPinHint')}</p>
      )}
      {open ? (
        <div className="mz-dialog-backdrop mz-dialog-backdrop--in" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="mz-dialog mz-dialog--map"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mz-dialog__head">
              <h2 id={titleId}>{label}</h2>
            </div>
            <div className="mz-dialog__body mz-location-dialog">
              <input
                className="mz-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('location.searchGoogleMaps')}
                aria-label={t('location.searchGoogleMaps')}
                autoFocus
              />
              <p className="mz-location__meta">{t('location.searchHint')}</p>
              {searching ? <p className="mz-location__meta">{t('common.loading')}</p> : null}
              {suggestions && suggestions.length > 0 ? (
                <ul className="mz-location__suggestions">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.place_id}>
                      <button type="button" onClick={() => void chooseSuggestion(suggestion)} disabled={busy}>
                        <span>{suggestion.main_text || suggestion.description}</span>
                        {suggestion.secondary_text ? <small>{suggestion.secondary_text}</small> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {suggestions && suggestions.length === 0 && !searching ? (
                <p className="mz-location__meta">{t('common.empty')}</p>
              ) : null}
              <div className="mz-map">
                <MapContainer
                  center={
                    draft.lat !== null && draft.lng !== null
                      ? [draft.lat, draft.lng]
                      : [MAP_DEFAULT_LAT, MAP_DEFAULT_LNG]
                  }
                  zoom={draft.lat !== null ? MAP_PLACE_ZOOM : MAP_COUNTRY_ZOOM}
                  className="mz-map__canvas"
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapBridge focus={focus} onPick={(lat, lng) => void dropPin(lat, lng)} />
                  {draft.lat !== null && draft.lng !== null ? (
                    <Marker position={[draft.lat, draft.lng]} icon={pinIcon} />
                  ) : null}
                </MapContainer>
              </div>
              {error ? <div className="mz-alert">{error}</div> : null}
              <div className="mz-grid-2 mz-grid-2--equal">
                <label className="mz-field">
                  <span>{t('location.governorate')}</span>
                  <input className="mz-input" value={draft.governorate} readOnly />
                </label>
                <label className="mz-field">
                  <span>{t('location.wilayat')}</span>
                  <input className="mz-input" value={draft.wilayat} readOnly />
                </label>
              </div>
              <p className="mz-location__meta">{t('location.autoFilledFromMap')}</p>
              <label className="mz-field">
                <span>{t('common.address')}</span>
                <input
                  className="mz-input"
                  value={draft.address}
                  onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                  placeholder={t('location.addressHint')}
                />
              </label>
              {draft.lat !== null && draft.lng !== null ? (
                <p className="mz-location__meta">
                  {t('location.coordinates')}: {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                </p>
              ) : null}
            </div>
            <div className="mz-dialog__foot">
              <button type="button" className="mz-btn mz-btn--ghost" onClick={() => setOpen(false)} disabled={busy}>
                {t('common.cancel')}
              </button>
              <button type="button" className="mz-btn mz-btn--primary" onClick={confirm} disabled={busy || !ready}>
                {t('location.confirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function placeErrorMessage(error: unknown, fallback: string, unavailable: string): string {
  if (axios.isAxiosError(error) && error.response?.status === 503) {
    return unavailable
  }
  return getApiMessage(error, fallback)
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useListQuery() {
  const [params, setParams] = useSearchParams()

  const page = Number(params.get('page') || '1') || 1
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''
  const type = params.get('type') ?? ''
  const role = params.get('role') ?? ''

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      if (key !== 'page') {
        next.set('page', '1')
      }
      setParams(next)
    },
    [params, setParams],
  )

  const setPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(params)
      next.set('page', String(nextPage))
      setParams(next)
    },
    [params, setParams],
  )

  return useMemo(
    () => ({ page, search, status, type, role, setFilter, setPage }),
    [page, search, status, type, role, setFilter, setPage],
  )
}

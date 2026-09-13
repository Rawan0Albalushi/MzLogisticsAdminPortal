import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useListQuery() {
  const [params, setParams] = useSearchParams()

  const page = Number(params.get('page') || '1') || 1
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''
  const type = params.get('type') ?? ''
  const role = params.get('role') ?? ''
  const accountType = params.get('account_type') ?? ''
  const dateFrom = params.get('date_from') ?? ''
  const dateTo = params.get('date_to') ?? ''
  const city = params.get('city') ?? ''
  const method = params.get('method') ?? ''

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

  const setFilters = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params)
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
      }
      next.set('page', '1')
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
    () => ({
      page,
      search,
      status,
      type,
      role,
      accountType,
      dateFrom,
      dateTo,
      city,
      method,
      setFilter,
      setFilters,
      setPage,
    }),
    [page, search, status, type, role, accountType, dateFrom, dateTo, city, method, setFilter, setFilters, setPage],
  )
}

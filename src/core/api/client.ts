import axios, { type AxiosError } from 'axios'
import { AUTH_TOKEN_KEY, DEFAULT_API_URL } from '@/core/constants/storage.ts'
import type { ApiMeta, ApiSuccess, Paginated } from '@/core/api/types.ts'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export function getApiMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    const firstFieldError = payload?.errors ? Object.values(payload.errors).flat()[0] : undefined
    const message = firstFieldError ?? payload?.message
    if (message && message.length < 180 && !message.includes('stack')) {
      return message
    }
  }
  return fallback
}

function isLaravelPaginator<T>(value: unknown): value is { data: T[] } & ApiMeta {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { data?: unknown }).data) &&
    typeof (value as { current_page?: unknown }).current_page === 'number'
  )
}

export function unwrapData<T>(payload: ApiSuccess<T>): T {
  return payload.data
}

export function unwrapList<T>(payload: ApiSuccess<T[] | { data: T[] }>): Paginated<T> {
  if (Array.isArray(payload.data)) {
    return {
      items: payload.data,
      meta: payload.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: payload.data.length,
        total: payload.data.length,
      },
    }
  }

  if (isLaravelPaginator<T>(payload.data)) {
    return {
      items: payload.data.data,
      meta: {
        current_page: payload.data.current_page,
        last_page: payload.data.last_page,
        per_page: payload.data.per_page,
        total: payload.data.total,
      },
    }
  }

  return {
    items: [],
    meta: payload.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
  }
}

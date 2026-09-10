import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AUTH_TOKEN_KEY } from '@/core/constants/storage.ts'
import { fetchMe, loginRequest, logoutRequest } from '@/core/api/services.ts'
import type { AuthUser } from '@/core/api/types.ts'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isReady: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: AuthUser) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const stored = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!stored) {
        if (!cancelled) {
          setIsReady(true)
        }
        return
      }

      try {
        const me = await fetchMe()
        if (!cancelled) {
          setUser(me)
          setToken(stored)
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    setToken(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Token is cleared locally regardless of network outcome.
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      setToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await fetchMe()
    setUser(me)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => {
      const permissions = user?.permissions ?? []
      return permissions.includes(permission)
    },
    [user],
  )

  const hasAnyPermission = useCallback(
    (permissions: string[]) => permissions.some((permission) => hasPermission(permission)),
    [hasPermission],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshUser,
      setUser,
      hasPermission,
      hasAnyPermission,
    }),
    [user, token, isReady, login, logout, refreshUser, hasPermission, hasAnyPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

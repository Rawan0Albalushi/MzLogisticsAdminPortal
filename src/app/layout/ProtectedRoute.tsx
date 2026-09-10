import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/core/auth/AuthContext.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'
import { EmptyState } from '@/shared/components/EmptyState.tsx'

interface ProtectedRouteProps {
  permission?: string
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { isReady, isAuthenticated, hasPermission } = useAuth()
  const { t } = useTranslation()

  if (!isReady) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(permission)) {
    return <EmptyState title={t('common.forbidden')} hint={t('common.forbidden')} />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { isReady, isAuthenticated } = useAuth()

  if (!isReady) {
    return <LoadingState />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

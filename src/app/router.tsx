import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PERMISSIONS } from '@/core/constants/permissions.ts'
import { AppShell } from '@/app/layout/AppShell.tsx'
import { GuestRoute, ProtectedRoute } from '@/app/layout/ProtectedRoute.tsx'
import { LoadingState } from '@/shared/components/LoadingState.tsx'

const LoginPage = lazy(() => import('@/features/auth/LoginPage.tsx').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage })))
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage.tsx').then((m) => ({ default: m.CustomersPage })))
const CustomerDetailPage = lazy(() =>
  import('@/features/customers/CustomerDetailPage.tsx').then((m) => ({ default: m.CustomerDetailPage })),
)
const ProvidersPage = lazy(() =>
  import('@/features/service-providers/ProvidersPage.tsx').then((m) => ({ default: m.ProvidersPage })),
)
const ProviderDetailPage = lazy(() =>
  import('@/features/service-providers/ProviderDetailPage.tsx').then((m) => ({ default: m.ProviderDetailPage })),
)
const FleetPage = lazy(() => import('@/features/fleet/FleetPage.tsx').then((m) => ({ default: m.FleetPage })))
const DriversPage = lazy(() => import('@/features/drivers/DriversPage.tsx').then((m) => ({ default: m.DriversPage })))
const ShipmentsPage = lazy(() => import('@/features/shipments/ShipmentsPage.tsx').then((m) => ({ default: m.ShipmentsPage })))
const ShipmentDetailPage = lazy(() =>
  import('@/features/shipments/ShipmentDetailPage.tsx').then((m) => ({ default: m.ShipmentDetailPage })),
)
const QuotationsPage = lazy(() => import('@/features/quotations/QuotationsPage.tsx').then((m) => ({ default: m.QuotationsPage })))
const QuotationDetailPage = lazy(() =>
  import('@/features/quotations/QuotationDetailPage.tsx').then((m) => ({ default: m.QuotationDetailPage })),
)
const JobsPage = lazy(() => import('@/features/jobs/JobsPage.tsx').then((m) => ({ default: m.JobsPage })))
const JobDetailPage = lazy(() => import('@/features/jobs/JobDetailPage.tsx').then((m) => ({ default: m.JobDetailPage })))
const TripsPage = lazy(() => import('@/features/trips/TripsPage.tsx').then((m) => ({ default: m.TripsPage })))
const TripDetailPage = lazy(() => import('@/features/trips/TripDetailPage.tsx').then((m) => ({ default: m.TripDetailPage })))
const TrackingPage = lazy(() => import('@/features/tracking/TrackingPage.tsx').then((m) => ({ default: m.TrackingPage })))
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage.tsx').then((m) => ({ default: m.PaymentsPage })))
const PaymentMethodsPage = lazy(() =>
  import('@/features/payments/PaymentMethodsPage.tsx').then((m) => ({ default: m.PaymentMethodsPage })),
)
const InvoicesPage = lazy(() => import('@/features/invoices/InvoicesPage.tsx').then((m) => ({ default: m.InvoicesPage })))
const WalletsPage = lazy(() => import('@/features/wallets/WalletsPage.tsx').then((m) => ({ default: m.WalletsPage })))
const WalletDetailPage = lazy(() =>
  import('@/features/wallets/WalletDetailPage.tsx').then((m) => ({ default: m.WalletDetailPage })),
)
const SettlementsPage = lazy(() =>
  import('@/features/settlements/SettlementsPage.tsx').then((m) => ({ default: m.SettlementsPage })),
)
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage.tsx').then((m) => ({ default: m.ReportsPage })))
const ProfilePage = lazy(() => import('@/features/users/ProfilePage.tsx').then((m) => ({ default: m.ProfilePage })))
const UsersPage = lazy(() => import('@/features/users/UsersPage.tsx').then((m) => ({ default: m.UsersPage })))
const UserFormPage = lazy(() => import('@/features/users/UserFormPage.tsx').then((m) => ({ default: m.UserFormPage })))
const RolesPage = lazy(() => import('@/features/users/RolesPage.tsx').then((m) => ({ default: m.RolesPage })))

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<LoadingState />}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: '/login', element: withSuspense(<LoginPage />) }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <ProtectedRoute permission={PERMISSIONS.DASHBOARD_VIEW} />,
            children: [{ path: '/', element: withSuspense(<DashboardPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.CUSTOMERS_VIEW} />,
            children: [
              { path: '/customers', element: withSuspense(<CustomersPage />) },
              { path: '/customers/:id', element: withSuspense(<CustomerDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.PROVIDERS_VIEW} />,
            children: [
              { path: '/providers', element: withSuspense(<ProvidersPage />) },
              { path: '/providers/:id', element: withSuspense(<ProviderDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.FLEET_VIEW} />,
            children: [{ path: '/fleet', element: withSuspense(<FleetPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.DRIVERS_VIEW} />,
            children: [{ path: '/drivers', element: withSuspense(<DriversPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.SHIPMENTS_VIEW} />,
            children: [
              { path: '/shipments', element: withSuspense(<ShipmentsPage />) },
              { path: '/shipments/:id', element: withSuspense(<ShipmentDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.QUOTATIONS_VIEW} />,
            children: [
              { path: '/quotations', element: withSuspense(<QuotationsPage />) },
              { path: '/quotations/:id', element: withSuspense(<QuotationDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.JOBS_VIEW} />,
            children: [
              { path: '/jobs', element: withSuspense(<JobsPage />) },
              { path: '/jobs/:id', element: withSuspense(<JobDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.TRIPS_VIEW} />,
            children: [
              { path: '/trips', element: withSuspense(<TripsPage />) },
              { path: '/trips/:id', element: withSuspense(<TripDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.TRACKING_VIEW} />,
            children: [{ path: '/tracking', element: withSuspense(<TrackingPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.PAYMENTS_VIEW} />,
            children: [{ path: '/payments', element: withSuspense(<PaymentsPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.PAYMENTS_MANAGE} />,
            children: [{ path: '/payment-methods', element: withSuspense(<PaymentMethodsPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.INVOICES_VIEW} />,
            children: [{ path: '/invoices', element: withSuspense(<InvoicesPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.WALLETS_VIEW} />,
            children: [
              { path: '/wallets', element: withSuspense(<WalletsPage />) },
              { path: '/wallets/:id', element: withSuspense(<WalletDetailPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.SETTLEMENTS_VIEW} />,
            children: [{ path: '/settlements', element: withSuspense(<SettlementsPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.REPORTS_VIEW} />,
            children: [{ path: '/reports', element: withSuspense(<ReportsPage />) }],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.USERS_MANAGE} />,
            children: [
              { path: '/users', element: withSuspense(<UsersPage />) },
              { path: '/users/new', element: withSuspense(<UserFormPage />) },
              { path: '/users/:id', element: withSuspense(<UserFormPage />) },
            ],
          },
          {
            element: <ProtectedRoute permission={PERMISSIONS.ROLES_MANAGE} />,
            children: [{ path: '/roles', element: withSuspense(<RolesPage />) }],
          },
          { path: '/settings', element: withSuspense(<ProfilePage />) },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

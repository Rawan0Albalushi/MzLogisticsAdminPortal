import { api, unwrapData, unwrapList } from '@/core/api/client.ts'
import type {
  ApiSuccess,
  AuthUser,
  Catalog,
  AccessCatalog,
  AccessRole,
  CreateSettlementInput,
  CreateStaffUserInput,
  DashboardStats,
  Invoice,
  ListQuery,
  LoginPayload,
  Organization,
  Payment,
  Quotation,
  Settlement,
  Shipment,
  TransportJob,
  Trip,
  Truck,
  UpdateStaffUserInput,
  VerifyOrganizationInput,
} from '@/core/api/types.ts'

function toParams(query: ListQuery = {}): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.search) params.search = query.search
  if (query.status) params.status = query.status
  if (query.page) params.page = query.page
  if (query.per_page) params.per_page = query.per_page
  if (query.type) params.type = query.type
  if (query.role) params.role = query.role
  if (query.job_id) params.job_id = query.job_id
  return params
}

export async function loginRequest(email: string, password: string): Promise<LoginPayload> {
  const { data } = await api.post<ApiSuccess<LoginPayload>>('/auth/login', { email, password })
  return unwrapData(data)
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiSuccess<AuthUser>>('/auth/me')
  return unwrapData(data)
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<ApiSuccess<DashboardStats>>('/dashboard')
  return unwrapData(data)
}

export async function fetchCustomers(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Organization[]>>('/customers', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchProviders(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Organization[]>>('/providers', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchOrganization(id: string | number): Promise<Organization> {
  const { data } = await api.get<ApiSuccess<Organization>>(`/organizations/${id}`)
  return unwrapData(data)
}

export async function verifyOrganization(id: string | number, payload: VerifyOrganizationInput): Promise<Organization> {
  const { data } = await api.post<ApiSuccess<Organization>>(`/organizations/${id}/verify`, payload)
  return unwrapData(data)
}

export async function fetchShipments(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Shipment[]>>('/shipments', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchShipment(id: string | number): Promise<Shipment> {
  const { data } = await api.get<ApiSuccess<Shipment>>(`/shipments/${id}`)
  return unwrapData(data)
}

export async function fetchQuotations(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Quotation[]>>('/quotations', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchQuotation(id: string | number): Promise<Quotation> {
  const { data } = await api.get<ApiSuccess<Quotation>>(`/quotations/${id}`)
  return unwrapData(data)
}

export async function fetchJobs(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<TransportJob[]>>('/jobs', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchJob(id: string | number): Promise<TransportJob> {
  const { data } = await api.get<ApiSuccess<TransportJob>>(`/jobs/${id}`)
  return unwrapData(data)
}

export async function fetchTrips(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Trip[]>>('/trips', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchTrip(id: string | number): Promise<Trip> {
  const { data } = await api.get<ApiSuccess<Trip>>(`/trips/${id}`)
  return unwrapData(data)
}

export async function fetchTrucks(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Truck[]>>('/trucks', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchDrivers(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<AuthUser[]>>('/drivers', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchPayments(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Payment[]>>('/payments', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchInvoices(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Invoice[]>>('/invoices', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchSettlements(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Settlement[] | { data: Settlement[] }>>('/settlements', {
    params: toParams(query),
  })
  return unwrapList(data)
}

export async function createSettlement(payload: CreateSettlementInput): Promise<Settlement> {
  const { data } = await api.post<ApiSuccess<Settlement>>('/settlements', payload)
  return unwrapData(data)
}

export async function completeSettlement(id: string | number): Promise<Settlement> {
  const { data } = await api.post<ApiSuccess<Settlement>>(`/settlements/${id}/complete`)
  return unwrapData(data)
}

export async function fetchCatalog(): Promise<Catalog> {
  const { data } = await api.get<ApiSuccess<Catalog>>('/catalog')
  return unwrapData(data)
}

export async function updateMe(payload: { name?: string; phone?: string | null; locale?: string }): Promise<AuthUser> {
  const { data } = await api.patch<ApiSuccess<AuthUser>>('/auth/me', payload)
  return unwrapData(data)
}

export async function updateMyPassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<void> {
  await api.patch('/auth/password', payload)
}

export async function fetchUsers(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<AuthUser[]>>('/users', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchUser(id: string | number): Promise<AuthUser> {
  const { data } = await api.get<ApiSuccess<AuthUser>>(`/users/${id}`)
  return unwrapData(data)
}

export async function createStaffUser(payload: CreateStaffUserInput): Promise<AuthUser> {
  const { data } = await api.post<ApiSuccess<AuthUser>>('/users', payload)
  return unwrapData(data)
}

export async function updateStaffUser(id: string | number, payload: UpdateStaffUserInput): Promise<AuthUser> {
  const { data } = await api.patch<ApiSuccess<AuthUser>>(`/users/${id}`, payload)
  return unwrapData(data)
}

export async function resetStaffPassword(
  id: string | number,
  payload: { password: string; password_confirmation: string },
): Promise<void> {
  await api.patch(`/users/${id}/password`, payload)
}

export async function fetchAccessCatalog(): Promise<AccessCatalog> {
  const { data } = await api.get<ApiSuccess<AccessCatalog>>('/roles')
  return unwrapData(data)
}

export async function updateRolePermissions(role: string, permissions: string[]): Promise<AccessRole> {
  const { data } = await api.patch<ApiSuccess<AccessRole>>(`/roles/${encodeURIComponent(role)}`, { permissions })
  return unwrapData(data)
}

export async function cancelShipment(id: string | number): Promise<Shipment> {
  const { data } = await api.post<ApiSuccess<Shipment>>(`/shipments/${id}/cancel`)
  return unwrapData(data)
}

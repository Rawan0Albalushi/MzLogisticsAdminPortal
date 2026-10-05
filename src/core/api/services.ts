import { api, unwrapData, unwrapList } from '@/core/api/client.ts'
import type {
  ApiSuccess,
  AuthUser,
  BankAccount,
  Catalog,
  AccessCatalog,
  AccessRole,
  CreateCustomerInput,
  CreateProviderInput,
  CreateSettlementInput,
  CreateShipmentInput,
  CreateStaffUserInput,
  DashboardStats,
  FinanceStatement,
  DriverPayable,
  Invoice,
  ListQuery,
  LoginPayload,
  Organization,
  Payment,
  PaymentMethod,
  PaymentMethodInput,
  OfferSelectionSetting,
  Project,
  ProjectInput,
  Quotation,
  Settlement,
  Shipment,
  TransportJob,
  Trip,
  Truck,
  Equipment,
  CatalogTruckType,
  TruckTypeInput,
  UpdateCommissionRateInput,
  UpdateOrganizationInput,
  UpdateShipmentInput,
  UpdateStaffUserInput,
  VerifyOrganizationInput,
  Wallet,
  WalletTransaction,
  PaymentContract,
  PlaceLocation,
  PlaceSuggestion,
} from '@/core/api/types.ts'

function toParams(query: ListQuery = {}): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (query.search) params.search = query.search
  if (query.status) params.status = query.status
  if (query.page) params.page = query.page
  if (query.per_page) params.per_page = query.per_page
  if (query.type) params.type = query.type
  if (query.role) params.role = query.role
  if (query.account_type) params.account_type = query.account_type
  if (query.job_id) params.job_id = query.job_id
  if (query.project) params.project = query.project
  if (query.without_project) params.without_project = 1
  if (query.organization_id) params.organization_id = query.organization_id
  if (query.owner) params.owner = query.owner
  if (query.date_from) params.date_from = query.date_from
  if (query.date_to) params.date_to = query.date_to
  if (query.city) params.city = query.city
  if (query.method) params.method = query.method
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

export async function createCustomer(payload: CreateCustomerInput): Promise<Organization> {
  const { data } = await api.post<ApiSuccess<Organization>>('/customers', payload)
  return unwrapData(data)
}

export async function createProvider(payload: CreateProviderInput): Promise<Organization> {
  const { data } = await api.post<ApiSuccess<Organization>>('/providers', payload)
  return unwrapData(data)
}

export async function fetchProviders(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Organization[]>>('/providers', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchOrganization(id: string | number): Promise<Organization> {
  const { data } = await api.get<ApiSuccess<Organization>>(`/organizations/${id}`)
  return unwrapData(data)
}

export async function updateOrganization(id: string | number, payload: UpdateOrganizationInput): Promise<Organization> {
  const { data } = await api.patch<ApiSuccess<Organization>>(`/organizations/${id}`, payload)
  return unwrapData(data)
}

export async function verifyOrganization(id: string | number, payload: VerifyOrganizationInput): Promise<Organization> {
  const { data } = await api.post<ApiSuccess<Organization>>(`/organizations/${id}/verify`, payload)
  return unwrapData(data)
}

export async function updateOrganizationCommission(
  id: string | number,
  payload: UpdateCommissionRateInput,
): Promise<Organization> {
  const { data } = await api.patch<ApiSuccess<Organization>>(`/organizations/${id}/commission-rate`, payload)
  return unwrapData(data)
}

export async function fetchPendingPaymentContracts(query: ListQuery = {}) {
  const { data } = await api.get<ApiSuccess<PaymentContract[]>>('/payment-contracts', { params: toParams(query) })
  return unwrapList(data)
}

export async function approvePaymentContract(id: string | number): Promise<PaymentContract> {
  const { data } = await api.post<ApiSuccess<PaymentContract>>(`/organizations/${id}/payment-contract/approve`)
  return unwrapData(data)
}

export async function rejectPaymentContract(id: string | number, reason?: string): Promise<PaymentContract> {
  const { data } = await api.post<ApiSuccess<PaymentContract>>(`/organizations/${id}/payment-contract/reject`, {
    reason,
  })
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

export async function createShipment(payload: CreateShipmentInput): Promise<Shipment> {
  const { data } = await api.post<ApiSuccess<Shipment>>('/shipments', payload)
  return unwrapData(data)
}

export async function updateShipment(id: string | number, payload: UpdateShipmentInput): Promise<Shipment> {
  const { data } = await api.put<ApiSuccess<Shipment>>(`/shipments/${id}`, payload)
  return unwrapData(data)
}

function placesLanguage(language: string) {
  return { headers: { 'Accept-Language': language.startsWith('ar') ? 'ar' : 'en' } }
}

export async function searchPlaces(query: string, language: string): Promise<PlaceSuggestion[]> {
  const { data } = await api.get<ApiSuccess<{ suggestions: PlaceSuggestion[] }>>('/places/autocomplete', {
    params: { query },
    ...placesLanguage(language),
  })
  return unwrapData(data).suggestions
}

export async function placeDetails(placeId: string, language: string): Promise<PlaceLocation> {
  const { data } = await api.get<ApiSuccess<PlaceLocation>>('/places/details', {
    params: { place_id: placeId },
    ...placesLanguage(language),
  })
  return unwrapData(data)
}

export async function reversePlace(lat: number, lng: number, language: string): Promise<PlaceLocation | null> {
  const { data } = await api.get<ApiSuccess<Partial<PlaceLocation>>>('/places/reverse', {
    params: { lat, lng },
    ...placesLanguage(language),
  })
  const place = unwrapData(data)
  if (typeof place.lat !== 'number' || typeof place.lng !== 'number') {
    return null
  }
  return {
    address: place.address ?? '',
    city: place.city ?? '',
    governorate: place.governorate ?? '',
    wilayat: place.wilayat ?? '',
    lat: place.lat,
    lng: place.lng,
    place_id: place.place_id,
  }
}

export async function fetchOfferSelectionMode(): Promise<OfferSelectionSetting> {
  const { data } = await api.get<ApiSuccess<OfferSelectionSetting>>('/settings/offer-selection')
  return unwrapData(data)
}

export async function updateOfferSelectionMode(mode: 'customer' | 'admin'): Promise<OfferSelectionSetting> {
  const { data } = await api.put<ApiSuccess<OfferSelectionSetting>>('/settings/offer-selection', {
    offer_selection_mode: mode,
  })
  return unwrapData(data)
}

export type ProviderPlatformOfferInput = {
  quotation_id: number
  customer_price: number
}

export type OwnedPlatformOfferInput = {
  price_per_trip: number
  truck_count: number
  truck_type: string
  truck_capacity_tons: number
  trip_count: number
  quantity_per_trip: number
  duration_days: number
  transport_start_date: string
  additional_costs?: number
  conditions?: string
}

export type PlatformOfferInput = (ProviderPlatformOfferInput | OwnedPlatformOfferInput) & {
  confirm?: boolean
}

export async function publishPlatformOffer(shipmentId: string | number, payload: PlatformOfferInput): Promise<void> {
  await api.post(`/shipments/${shipmentId}/platform-offers`, payload)
}

export async function confirmPlatformOffer(offerId: string | number): Promise<void> {
  await api.post(`/platform-offers/${offerId}/confirm`)
}

export async function withdrawPlatformOffer(offerId: string | number): Promise<void> {
  await api.post(`/platform-offers/${offerId}/withdraw`)
}

export type OnBehalfQuotationInput = {
  provider_organization_id: number
  price_per_trip: number
  truck_count: number
  truck_type: string
  truck_capacity_tons: number
  trip_count: number
  quantity_per_trip: number
  duration_days: number
  transport_start_date: string
  additional_costs?: number
  conditions?: string
}

export async function submitQuotationOnBehalf(
  shipmentId: string | number,
  payload: OnBehalfQuotationInput,
): Promise<Quotation> {
  const { data } = await api.post<ApiSuccess<Quotation>>(`/shipments/${shipmentId}/quotations/on-behalf`, payload)
  return unwrapData(data)
}

export async function withdrawQuotation(id: string | number): Promise<Quotation> {
  const { data } = await api.post<ApiSuccess<Quotation>>(`/quotations/${id}/withdraw`)
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

export async function fetchProjects(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Project[]>>('/projects', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchProject(id: string | number): Promise<Project> {
  const { data } = await api.get<ApiSuccess<Project>>(`/projects/${id}`)
  return unwrapData(data)
}

export async function createProject(payload: ProjectInput): Promise<Project> {
  const { data } = await api.post<ApiSuccess<Project>>('/projects', payload)
  return unwrapData(data)
}

export async function updateProject(id: string | number, payload: ProjectInput): Promise<Project> {
  const { data } = await api.patch<ApiSuccess<Project>>(`/projects/${id}`, payload)
  return unwrapData(data)
}

export async function attachProjectJob(projectId: string | number, jobId: number): Promise<Project> {
  const { data } = await api.post<ApiSuccess<Project>>(`/projects/${projectId}/jobs`, { job_id: jobId })
  return unwrapData(data)
}

export async function detachProjectJob(projectId: string | number, jobId: number): Promise<Project> {
  const { data } = await api.delete<ApiSuccess<Project>>(`/projects/${projectId}/jobs/${jobId}`)
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

export async function uploadTripPodDocuments(
  id: string | number,
  files: { invoice?: File | null; weightTicket?: File | null },
): Promise<Trip> {
  const form = new FormData()
  if (files.invoice) {
    form.append('invoice', files.invoice)
  }
  if (files.weightTicket) {
    form.append('weight_ticket', files.weightTicket)
  }
  const { data } = await api.post<ApiSuccess<Trip>>(`/trips/${id}/pod/documents`, form)
  return unwrapData(data)
}

export async function submitTripPod(
  id: string | number,
  proof: {
    otp?: string
    receivedQuantity?: number
    notes?: string
    photos: File[]
    invoice?: File | null
    weightTicket?: File | null
  },
): Promise<void> {
  const form = new FormData()
  if (proof.otp) {
    form.append('otp', proof.otp)
  }
  if (proof.receivedQuantity != null && !Number.isNaN(proof.receivedQuantity)) {
    form.append('received_quantity', String(proof.receivedQuantity))
  }
  if (proof.notes) {
    form.append('notes', proof.notes)
  }
  proof.photos.forEach((file, index) => {
    form.append(`photos[${index}]`, file)
  })
  if (proof.invoice) {
    form.append('invoice', proof.invoice)
  }
  if (proof.weightTicket) {
    form.append('weight_ticket', proof.weightTicket)
  }
  await api.post(`/trips/${id}/pod`, form)
}

export async function updateTripStatus(id: string | number, status: string): Promise<Trip> {
  const { data } = await api.post<ApiSuccess<Trip>>(`/trips/${id}/status`, { status })
  return unwrapData(data)
}

export async function updateTripOperations(
  id: string | number,
  payload: { trailer_plate?: string | null; delivery_note_number?: string | null; operations_notes?: string | null },
): Promise<Trip> {
  const { data } = await api.post<ApiSuccess<Trip>>(`/trips/${id}/operations`, payload)
  return unwrapData(data)
}

export async function assignTrip(
  id: string | number,
  payload: { truck_id: number; driver_id: number; departure_date: string; departure_time: string; driver_pay_amount: number },
): Promise<Trip> {
  const { data } = await api.post<ApiSuccess<Trip>>(`/trips/${id}/assign`, payload)
  return unwrapData(data)
}

export async function fetchDriverPayables(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<DriverPayable[]>>('/driver-payables', { params: toParams(query) })
  return unwrapList(data)
}

export async function payDriverPayable(id: string | number, receipt?: File | null): Promise<DriverPayable> {
  if (receipt) {
    const form = new FormData()
    form.append('receipt', receipt)
    const { data } = await api.post<ApiSuccess<DriverPayable>>(`/driver-payables/${id}/pay`, form)
    return unwrapData(data)
  }

  const { data } = await api.post<ApiSuccess<DriverPayable>>(`/driver-payables/${id}/pay`)
  return unwrapData(data)
}

export async function downloadDriverPayableReceipt(id: string | number, filename: string): Promise<void> {
  const response = await api.get<Blob>(`/driver-payables/${id}/receipt`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function fetchTrucks(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Truck[]>>('/trucks', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchFleetForPlan(query: Pick<ListQuery, 'owner' | 'organization_id'>) {
  const perPage = 100
  const first = await fetchTrucks({ ...query, page: 1, per_page: perPage })
  const pages = Math.min(first.meta.last_page, 10)
  if (pages <= 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) => fetchTrucks({ ...query, page: index + 2, per_page: perPage })),
  )
  return [...first.items, ...rest.flatMap((page) => page.items)]
}

export async function fetchDrivers(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<AuthUser[]>>('/drivers', { params: toParams(query) })
  return unwrapList(data)
}

export async function createDriver(payload: {
  name: string
  phone: string
  email?: string
  license_number?: string
  license_expires_at?: string
  civil_id?: string | null
  trip_rate?: number | null
}): Promise<{ driver: AuthUser; activation_code: string; whatsapp_sent: boolean }> {
  const { data } = await api.post<ApiSuccess<{ driver: AuthUser; activation_code: string; whatsapp_sent: boolean }>>('/drivers', payload)
  return unwrapData(data)
}

export async function resendDriverInvite(id: string | number): Promise<{ driver: AuthUser; activation_code: string; whatsapp_sent: boolean }> {
  const { data } = await api.post<ApiSuccess<{ driver: AuthUser; activation_code: string; whatsapp_sent: boolean }>>(
    `/drivers/${id}/resend-invite`,
  )
  return unwrapData(data)
}

export async function updateDriver(
  id: string | number,
  payload: {
    name: string
    phone: string
    email?: string
    license_number?: string
    license_expires_at?: string
    civil_id?: string | null
    trip_rate?: number | null
    status?: string
  },
): Promise<AuthUser> {
  const { data } = await api.put<ApiSuccess<AuthUser>>(`/drivers/${id}`, payload)
  return unwrapData(data)
}

export async function fetchEquipment(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Equipment[]>>('/equipment', { params: toParams(query) })
  return unwrapList(data)
}

export type TruckInput = {
  plate_number: string
  type: string
  capacity_tons: number
  volume_cbm?: number
  year?: number
  make?: string
  model?: string
  status?: string
  insurance_expires_at?: string
}

export async function createTruck(payload: TruckInput): Promise<Truck> {
  const { data } = await api.post<ApiSuccess<Truck>>('/trucks', payload)
  return unwrapData(data)
}

export async function updateTruck(id: string | number, payload: TruckInput): Promise<Truck> {
  const { data } = await api.put<ApiSuccess<Truck>>(`/trucks/${id}`, payload)
  return unwrapData(data)
}

export type EquipmentInput = {
  name: string
  type?: string
  quantity: number
  status?: string
  truck_id?: number | null
}

export async function createEquipment(payload: EquipmentInput): Promise<Equipment> {
  const { data } = await api.post<ApiSuccess<Equipment>>('/equipment', payload)
  return unwrapData(data)
}

export async function updateEquipment(id: string | number, payload: EquipmentInput): Promise<Equipment> {
  const { data } = await api.put<ApiSuccess<Equipment>>(`/equipment/${id}`, payload)
  return unwrapData(data)
}

export type SpreadsheetImportError = {
  row: number
  field: string
  message: string
  plate_number?: string | null
  type?: string | null
  name?: string | null
  phone?: string | null
  email?: string | null
  license_number?: string | null
  civil_id?: string | null
  truck_plate?: string | null
}

export type SpreadsheetImportResult = {
  created: number
  failed: number
  items?: { row: number; label: string }[]
  drivers?: {
    row: number
    name: string
    phone: string | null
    activation_code: string
    whatsapp_sent: boolean
  }[]
  errors: SpreadsheetImportError[]
}

export async function downloadImportTemplate(path: string, filename: string): Promise<void> {
  const response = await api.get<Blob>(path, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function importSpreadsheet(path: string, file: File): Promise<SpreadsheetImportResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<ApiSuccess<SpreadsheetImportResult>>(path, form)
  return unwrapData(data)
}

export async function recordInvoiceBankTransfer(
  id: string | number,
  receipt: File,
  transferReference: string,
): Promise<{ payment: Payment; job: TransportJob | null }> {
  const form = new FormData()
  form.append('receipt', receipt)
  if (transferReference.trim()) {
    form.append('transfer_reference', transferReference.trim())
  }
  const { data } = await api.post<ApiSuccess<{ payment: Payment; job: TransportJob | null }>>(
    `/invoices/${id}/record-transfer`,
    form,
  )
  return unwrapData(data)
}

export async function confirmBankTransfer(
  id: string | number,
  receipt: File | null,
  transferReference: string,
): Promise<{ payment: Payment; job: TransportJob | null }> {
  const form = new FormData()
  if (receipt) {
    form.append('receipt', receipt)
  }
  if (transferReference.trim()) {
    form.append('transfer_reference', transferReference.trim())
  }
  const { data } = await api.post<ApiSuccess<{ payment: Payment; job: TransportJob | null }>>(
    `/payments/${id}/confirm-transfer`,
    form,
  )
  return unwrapData(data)
}

export async function downloadPaymentReceipt(id: string | number, filename: string): Promise<void> {
  const response = await api.get<Blob>(`/payments/${id}/receipt`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function fetchBankAccount(): Promise<BankAccount> {
  const { data } = await api.get<ApiSuccess<BankAccount>>('/settings/bank-account')
  return unwrapData(data)
}

export async function updateBankAccount(payload: BankAccount): Promise<BankAccount> {
  const { data } = await api.put<ApiSuccess<BankAccount>>('/settings/bank-account', payload)
  return unwrapData(data)
}

export async function fetchFinanceStatement(query: ListQuery & { project_id?: string; unassigned?: boolean } = {}) {
  const params = toParams(query)
  if (query.project_id) params.project_id = query.project_id
  if (query.unassigned) params.unassigned = 1
  const { data } = await api.get<ApiSuccess<FinanceStatement>>('/finance/statement', { params })
  return unwrapData(data)
}

export async function fetchPayments(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Payment[]>>('/payments', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchInvoices(query: ListQuery) {
  const { data } = await api.get<ApiSuccess<Invoice[]>>('/invoices', { params: toParams(query) })
  return unwrapList(data)
}

export async function fetchWallets(query: ListQuery = {}) {
  const { data } = await api.get<ApiSuccess<Wallet[] | { data: Wallet[] }>>('/wallets', {
    params: toParams(query),
  })
  return unwrapList(data)
}

export async function fetchWallet(id: string | number): Promise<Wallet> {
  const { data } = await api.get<ApiSuccess<Wallet>>(`/wallets/${id}`)
  return unwrapData(data)
}

export async function fetchWalletTransactions(id: string | number, query: ListQuery = {}) {
  const { data } = await api.get<ApiSuccess<WalletTransaction[] | { data: WalletTransaction[] }>>(
    `/wallets/${id}/transactions`,
    { params: toParams(query) },
  )
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

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await api.get<ApiSuccess<PaymentMethod[]>>('/payment-methods')
  return unwrapData(data)
}

export async function createPaymentMethod(payload: PaymentMethodInput): Promise<PaymentMethod> {
  const { data } = await api.post<ApiSuccess<PaymentMethod>>('/payment-methods', payload)
  return unwrapData(data)
}

export async function updatePaymentMethod(id: number, payload: Partial<PaymentMethodInput>): Promise<PaymentMethod> {
  const { data } = await api.patch<ApiSuccess<PaymentMethod>>(`/payment-methods/${id}`, payload)
  return unwrapData(data)
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await api.delete(`/payment-methods/${id}`)
}

export async function fetchTruckTypes(): Promise<CatalogTruckType[]> {
  const { data } = await api.get<ApiSuccess<CatalogTruckType[]>>('/truck-types')
  return unwrapData(data)
}

export async function createTruckType(payload: TruckTypeInput): Promise<CatalogTruckType> {
  const { data } = await api.post<ApiSuccess<CatalogTruckType>>('/truck-types', payload)
  return unwrapData(data)
}

export async function updateTruckType(id: number, payload: Partial<TruckTypeInput>): Promise<CatalogTruckType> {
  const { data } = await api.patch<ApiSuccess<CatalogTruckType>>(`/truck-types/${id}`, payload)
  return unwrapData(data)
}

export async function deleteTruckType(id: number): Promise<void> {
  await api.delete(`/truck-types/${id}`)
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

export async function createRole(payload: { name: string; permissions: string[] }): Promise<AccessRole> {
  const { data } = await api.post<ApiSuccess<AccessRole>>('/roles', payload)
  return unwrapData(data)
}

export async function updateRolePermissions(
  role: string,
  permissions: string[],
  name?: string,
): Promise<AccessRole> {
  const { data } = await api.patch<ApiSuccess<AccessRole>>(`/roles/${encodeURIComponent(role)}`, {
    permissions,
    ...(name ? { name } : {}),
  })
  return unwrapData(data)
}

export async function deleteRole(role: string): Promise<void> {
  await api.delete(`/roles/${encodeURIComponent(role)}`)
}

export async function cancelShipment(id: string | number): Promise<Shipment> {
  const { data } = await api.post<ApiSuccess<Shipment>>(`/shipments/${id}/cancel`)
  return unwrapData(data)
}

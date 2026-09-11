export interface ApiMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
  meta?: ApiMeta
}

export interface ApiFailure {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface Paginated<T> {
  items: T[]
  meta: ApiMeta
}

export interface Organization {
  id: number
  type: string
  account_type?: string | null
  name: string
  name_ar?: string | null
  commercial_register?: string | null
  tax_number?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
  address?: string | null
  status: string
  verification_notes?: string | null
  commission_rate?: string | number | null
  effective_commission_rate?: string | number | null
  uses_default_commission?: boolean
  created_at?: string
  trucks_count?: number
  driver_profiles_count?: number
  provider_jobs_count?: number
}

export interface DriverProfile {
  id: number
  user_id: number
  organization_id: number
  license_number?: string | null
  license_expires_at?: string | null
  status?: string | null
}

export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  locale?: string | null
  user_type: string
  is_active: boolean
  organization_id?: number | null
  organization?: Organization | null
  roles?: string[]
  permissions?: string[]
  driver_profile?: DriverProfile | null
  last_login_at?: string | null
}

export interface LoginPayload {
  token: string
  user: AuthUser
}

export interface DashboardStats {
  shipments_open: number
  shipments_total: number
  quotations_pending: number
  jobs_active: number
  jobs_pending_dispatch: number
  jobs_completed: number
  trips_active: number
  trips_unassigned: number
  trips_in_transit: number
  payments_pending: number
  payments_completed_amount: number
  commission_amount: number
  wallet_pending?: number
  wallet_available?: number
  wallet_reserved?: number
  provider_receivable: number
  settlements_pending: number
  invoices_count: number
  invoices_unpaid: number
  providers_pending: number
  customers_pending: number
}

export interface Shipment {
  id: number
  reference: string
  cargo_type?: string | null
  cargo_description?: string | null
  weight_tons?: string | number | null
  volume_cbm?: string | number | null
  quantity?: string | number | null
  quantity_unit?: string | null
  pickup_address?: string | null
  pickup_city?: string | null
  pickup_lat?: number | null
  pickup_lng?: number | null
  delivery_address?: string | null
  delivery_city?: string | null
  delivery_lat?: number | null
  delivery_lng?: number | null
  required_date?: string | null
  notes?: string | null
  status: string
  published_at?: string | null
  customer?: Organization | null
  quotations?: Quotation[]
  quotations_count?: number
  created_at?: string
}

export interface Quotation {
  id: number
  reference: string
  shipment_request_id: number
  total_price?: string | number | null
  currency?: string | null
  truck_count?: number | null
  truck_type?: string | null
  truck_capacity_tons?: string | number | null
  trip_count?: number | null
  quantity_per_trip?: string | number | null
  duration_days?: number | null
  additional_costs?: string | number | null
  conditions?: string | null
  valid_until?: string | null
  status: string
  provider?: Organization | null
  shipment?: Shipment | null
  created_at?: string
}

export interface TransportJob {
  id: number
  reference: string
  status: string
  total_price?: string | number | null
  currency?: string | null
  total_quantity?: string | number | null
  delivered_quantity?: string | number | null
  progress_percent?: number | null
  started_at?: string | null
  completed_at?: string | null
  customer?: Organization | null
  provider?: Organization | null
  shipment?: Shipment | null
  quotation?: Quotation | null
  trips?: Trip[]
  created_at?: string
}

export interface Truck {
  id: number
  plate_number: string
  type?: string | null
  capacity_tons?: string | number | null
  year?: number | null
  make?: string | null
  model?: string | null
  status: string
  assigned_driver_id?: number | null
  assigned_driver?: AuthUser | null
  insurance_expires_at?: string | null
  organization?: Organization | null
}

export interface ProofOfDelivery {
  id: number
  receiver_name?: string | null
  notes?: string | null
  created_at?: string
}

export interface Trip {
  id: number
  reference: string
  sequence?: number | null
  status: string
  planned_quantity?: string | number | null
  delivered_quantity?: string | number | null
  pickup_address?: string | null
  pickup_city?: string | null
  pickup_lat?: number | null
  pickup_lng?: number | null
  delivery_address?: string | null
  delivery_city?: string | null
  delivery_lat?: number | null
  delivery_lng?: number | null
  current_lat?: number | null
  current_lng?: number | null
  eta_at?: string | null
  otp_code?: string | null
  assigned_at?: string | null
  arrived_pickup_at?: string | null
  loaded_at?: string | null
  in_transit_at?: string | null
  arrived_at?: string | null
  delivered_at?: string | null
  completed_at?: string | null
  job?: TransportJob | null
  truck?: Truck | null
  driver?: AuthUser | null
  proof_of_delivery?: ProofOfDelivery | null
  created_at?: string
}

export interface Payment {
  id: number
  reference: string
  amount?: string | number | null
  commission_amount?: string | number | null
  provider_amount?: string | number | null
  currency?: string | null
  method?: string | null
  status: string
  gateway?: string | null
  gateway_reference?: string | null
  paid_at?: string | null
  created_at?: string
}

export interface Invoice {
  id: number
  reference: string
  type: string
  amount?: string | number | null
  currency?: string | null
  status: string
  issued_at?: string | null
  due_at?: string | null
  organization?: Organization | null
  job?: TransportJob | null
  payment?: Payment | null
}

export interface Wallet {
  id: number
  organization_id: number
  currency?: string | null
  pending_balance?: string | number | null
  available_balance?: string | number | null
  reserved_balance?: string | number | null
  lifetime_earned?: string | number | null
  lifetime_withdrawn?: string | number | null
  outstanding_balance?: string | number | null
  organization?: Organization | null
  updated_at?: string | null
}

export interface WalletTransaction {
  id: number
  reference: string
  type: string
  amount?: string | number | null
  pending_delta?: string | number | null
  available_delta?: string | number | null
  reserved_delta?: string | number | null
  currency?: string | null
  description?: string | null
  payment?: { id: number; reference: string } | null
  job?: { id: number; reference: string } | null
  created_at?: string | null
}

export interface Settlement {
  id: number
  reference: string
  provider_organization_id: number
  amount?: string | number | null
  commission_amount?: string | number | null
  net_amount?: string | number | null
  currency?: string | null
  status: string
  period_start?: string | null
  period_end?: string | null
  settled_at?: string | null
  provider_organization?: Organization | null
  created_at?: string
}

export interface PaymentMethod {
  id: number
  code: string
  name: string
  name_ar: string
  label?: string
  processor: 'thawani' | 'cash' | string
  is_active: boolean
  is_system: boolean
  sort_order: number
}

export interface Catalog {
  shipment_statuses: string[]
  quotation_statuses: string[]
  job_statuses: string[]
  trip_statuses: string[]
  payment_statuses: string[]
  truck_types: string[]
  payment_methods?: PaymentMethod[]
  currency: string
  commission_rate: number
}

export interface PaymentMethodInput {
  code?: string
  name: string
  name_ar: string
  processor: 'thawani' | 'cash'
  is_active?: boolean
  sort_order?: number
}

export interface AccessRole {
  name: string
  users_count: number
  permissions: string[]
}

export interface AccessCatalog {
  roles: AccessRole[]
  permissions: string[]
  platform_roles: string[]
}

export interface ListQuery {
  search?: string
  status?: string
  page?: number
  per_page?: number
  type?: string
  role?: string
  job_id?: number | string
  organization_id?: number | string
}

export interface CreateStaffUserInput {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
  role: string
  locale?: string
  is_active?: boolean
}

export interface UpdateStaffUserInput {
  name?: string
  phone?: string | null
  locale?: string
  is_active?: boolean
  role?: string
}

export interface CreateSettlementInput {
  provider_organization_id: number
  amount: number
  period_start: string
  period_end: string
}

export interface VerifyOrganizationInput {
  status: string
  verification_notes?: string
}

export interface UpdateCommissionRateInput {
  commission_rate: number | null
}

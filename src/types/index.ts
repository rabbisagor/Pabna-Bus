export type VerificationStatus = 'verified' | 'unverified' | 'needs_reverification' | 'cancelled';
export type PublishStatus = 'published' | 'draft' | 'inactive';
export type BusType = 'intercity' | 'local' | 'pabna_crossing' | 'regional' | 'special';
export type RouteType = 'local' | 'short' | 'regional' | 'interdistrict' | 'long_distance' | 'pabna_crossing' | 'special';
export type CorrectionStatus = 'new' | 'in_review' | 'approved' | 'rejected' | 'resolved';
export type UserRole = 'super_admin' | 'admin' | 'editor';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  is_active: number;
  created_at: string;
  last_login_at?: string;
}

export interface BusCompany {
  id: string;
  name_bn: string;
  name_en: string;
  logo_url?: string;
  description?: string;
  head_office?: string;
  contact_number?: string;
  hotline?: string;
  website?: string;
  verification_status: VerificationStatus;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
  bus_count?: number;
}

export interface Bus {
  id: string;
  name_bn: string;
  name_en: string;
  company_id: string;
  company_name_bn?: string;
  company_name_en?: string;
  bus_type: BusType;
  is_ac: number; // 0: Non-AC, 1: AC, 2: Both
  seat_class: string;
  start_point: string;
  end_point: string;
  intermediate_stops?: string;
  operating_days: string;
  departure_times: string;
  counter_name?: string;
  counter_phone?: string;
  fare_info?: string;
  fare_verified: number;
  image_url?: string;
  information_source?: string;
  verification_status: VerificationStatus;
  verified_date?: string;
  verified_by?: string;
  status: PublishStatus;
  additional_notes?: string;
  is_pabna_crossing: number; // 1 if crosses Pabna
  crossing_entry_point?: string;
  crossing_pabna_stoppages?: string;
  crossing_exit_point?: string;
  allows_boarding_in_pabna: number;
  is_direct_route: number;
  is_active_route: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  routes?: Route[];
  counters?: Counter[];
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_name_bn: string;
  stop_name_en?: string;
  stop_order: number;
  district?: string;
  upazila?: string;
  is_in_pabna: number;
  is_boarding_allowed: number;
  lat?: number;
  lng?: number;
  fare_from_start?: number;
}

export interface Route {
  id: string;
  route_name_bn: string;
  route_name_en: string;
  route_type: RouteType;
  start_location: string;
  end_location: string;
  via_districts?: string;
  via_upazilas?: string;
  entry_point_pabna?: string;
  exit_point_pabna?: string;
  direction: 'both_ways' | 'one_way';
  distance_km?: number;
  estimated_duration?: string;
  verification_status: VerificationStatus;
  information_source?: string;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  stops?: RouteStop[];
  buses_count?: number;
}

export interface Counter {
  id: string;
  name_bn: string;
  name_en?: string;
  company_id?: string;
  company_name_bn?: string;
  address: string;
  district: string;
  upazila: string;
  area_name?: string;
  phone: string;
  alt_phone?: string;
  google_maps_url?: string;
  lat?: number;
  lng?: number;
  opening_hours?: string;
  is_phone_verified: number;
  verification_status: VerificationStatus;
  verified_date?: string;
  information_source?: string;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CorrectionRequest {
  id: string;
  bus_or_route_name: string;
  entity_type: 'bus' | 'route' | 'counter' | 'company' | 'other';
  entity_id?: string;
  incorrect_info: string;
  proposed_correction: string;
  proof_link?: string;
  submitter_name?: string;
  submitter_phone?: string;
  submitter_comments?: string;
  status: CorrectionStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_title?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalBuses: number;
  publishedBuses: number;
  draftBuses: number;
  crossingBuses: number;
  totalCompanies: number;
  totalRoutes: number;
  totalCounters: number;
  unverifiedCount: number;
  pendingCorrections: number;
  recentLogs: AuditLog[];
  recentBuses: Bus[];
}

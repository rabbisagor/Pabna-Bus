-- ===================================================
-- পাবনা বাস গাইড — PostgreSQL / Supabase Schema
-- ===================================================

-- 1. admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  full_name VARCHAR(128) NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 2. bus_companies
CREATE TABLE IF NOT EXISTS bus_companies (
  id VARCHAR(64) PRIMARY KEY,
  name_bn VARCHAR(128) NOT NULL,
  name_en VARCHAR(128) NOT NULL,
  logo_url TEXT,
  description TEXT,
  head_office TEXT,
  contact_number VARCHAR(64),
  hotline VARCHAR(64),
  website TEXT,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. buses
CREATE TABLE IF NOT EXISTS buses (
  id VARCHAR(64) PRIMARY KEY,
  name_bn VARCHAR(128) NOT NULL,
  name_en VARCHAR(128) NOT NULL,
  company_id VARCHAR(64) REFERENCES bus_companies(id),
  bus_type VARCHAR(32) NOT NULL DEFAULT 'intercity',
  is_ac SMALLINT NOT NULL DEFAULT 0,
  seat_class VARCHAR(64) NOT NULL DEFAULT 'Economy / Chair Coach',
  start_point VARCHAR(128) NOT NULL,
  end_point VARCHAR(128) NOT NULL,
  intermediate_stops TEXT,
  operating_days VARCHAR(64) NOT NULL DEFAULT 'প্রতিদিন',
  departure_times TEXT NOT NULL,
  counter_name VARCHAR(128),
  counter_phone VARCHAR(64),
  fare_info VARCHAR(128),
  fare_verified SMALLINT NOT NULL DEFAULT 1,
  image_url TEXT,
  information_source TEXT NOT NULL DEFAULT 'পাবনা বাস মালিক সমিতি ও কাউন্টার যাচাইকৃত',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  verified_date VARCHAR(64),
  verified_by VARCHAR(128),
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  additional_notes TEXT,
  is_pabna_crossing SMALLINT NOT NULL DEFAULT 0,
  crossing_entry_point VARCHAR(128),
  crossing_pabna_stoppages TEXT,
  crossing_exit_point VARCHAR(128),
  allows_boarding_in_pabna SMALLINT NOT NULL DEFAULT 1,
  is_direct_route SMALLINT NOT NULL DEFAULT 1,
  is_active_route SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. routes
CREATE TABLE IF NOT EXISTS routes (
  id VARCHAR(64) PRIMARY KEY,
  route_name_bn VARCHAR(128) NOT NULL,
  route_name_en VARCHAR(128) NOT NULL,
  route_type VARCHAR(32) NOT NULL DEFAULT 'long_distance',
  start_location VARCHAR(128) NOT NULL,
  end_location VARCHAR(128) NOT NULL,
  via_districts TEXT,
  via_upazilas TEXT,
  entry_point_pabna VARCHAR(128),
  exit_point_pabna VARCHAR(128),
  direction VARCHAR(32) NOT NULL DEFAULT 'both_ways',
  distance_km NUMERIC(6, 2),
  estimated_duration VARCHAR(64),
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  information_source TEXT NOT NULL DEFAULT 'পাবনা পরিবহন রুট গাইড',
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. route_stops
CREATE TABLE IF NOT EXISTS route_stops (
  id VARCHAR(64) PRIMARY KEY,
  route_id VARCHAR(64) NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_name_bn VARCHAR(128) NOT NULL,
  stop_name_en VARCHAR(128),
  stop_order INT NOT NULL,
  district VARCHAR(64),
  upazila VARCHAR(64),
  is_in_pabna SMALLINT NOT NULL DEFAULT 1,
  is_boarding_allowed SMALLINT NOT NULL DEFAULT 1,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  fare_from_start NUMERIC(8, 2)
);

-- 6. bus_route_assignments
CREATE TABLE IF NOT EXISTS bus_route_assignments (
  id VARCHAR(64) PRIMARY KEY,
  bus_id VARCHAR(64) NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  route_id VARCHAR(64) NOT NULL REFERENCES routes(id) ON DELETE CASCADE
);

-- 7. counters
CREATE TABLE IF NOT EXISTS counters (
  id VARCHAR(64) PRIMARY KEY,
  name_bn VARCHAR(128) NOT NULL,
  name_en VARCHAR(128),
  company_id VARCHAR(64) REFERENCES bus_companies(id),
  address TEXT NOT NULL,
  district VARCHAR(64) NOT NULL DEFAULT 'পাবনা',
  upazila VARCHAR(64) NOT NULL,
  area_name VARCHAR(128),
  phone VARCHAR(64) NOT NULL,
  alt_phone VARCHAR(64),
  google_maps_url TEXT,
  lat NUMERIC(9, 6),
  lng NUMERIC(9, 6),
  opening_hours VARCHAR(128),
  is_phone_verified SMALLINT NOT NULL DEFAULT 1,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  verified_date VARCHAR(64),
  information_source TEXT NOT NULL DEFAULT 'সরেজমিন কাউন্টার যাচাই',
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 8. counter_bus_assignments
CREATE TABLE IF NOT EXISTS counter_bus_assignments (
  id VARCHAR(64) PRIMARY KEY,
  counter_id VARCHAR(64) NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
  bus_id VARCHAR(64) NOT NULL REFERENCES buses(id) ON DELETE CASCADE
);

-- 9. correction_requests
CREATE TABLE IF NOT EXISTS correction_requests (
  id VARCHAR(64) PRIMARY KEY,
  bus_or_route_name VARCHAR(128) NOT NULL,
  entity_type VARCHAR(32) NOT NULL DEFAULT 'bus',
  entity_id VARCHAR(64),
  incorrect_info TEXT NOT NULL,
  proposed_correction TEXT NOT NULL,
  proof_link TEXT,
  submitter_name VARCHAR(128),
  submitter_phone VARCHAR(64),
  submitter_comments TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  user_name VARCHAR(128) NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64),
  entity_title VARCHAR(128),
  details TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buses_search ON buses(status, is_pabna_crossing);
CREATE INDEX IF NOT EXISTS idx_counters_upazila ON counters(upazila, status);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(route_id, stop_order);

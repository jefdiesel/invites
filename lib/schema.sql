-- ============================================================
-- Multi-tenant booking platform schema
-- Restaurant-first, extensible to any appointment business
-- Two-layer: global client identity + per-business scoped data
-- ============================================================

-- Global client identity (platform-owned)
-- This is YOUR data. Clients across all businesses.
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Businesses (restaurants, dentists, tattoo shops, etc.)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'restaurant', -- restaurant, dental, chiro, tattoo, etc.
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  timezone TEXT DEFAULT 'America/New_York',
  -- Restaurant-specific (nullable for other verticals)
  cuisine TEXT DEFAULT '',
  price_range TEXT DEFAULT '', -- $, $$, $$$, $$$$
  -- Site content
  about TEXT DEFAULT '',           -- short tagline (shown in hero if <80 chars)
  about_story TEXT DEFAULT '',     -- long-form editorial (about page, supports paragraphs split by \n\n)
  about_headline TEXT DEFAULT '',  -- about page headline (e.g., "Our Story")
  logo_url TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  -- Custom domain (e.g., "chezlaurent.com") — middleware maps hostname → slug
  custom_domain TEXT UNIQUE,
  -- Theme: modern, classic, rustic, playful, bright
  theme TEXT DEFAULT 'classic',
  -- Auth
  staff_password TEXT DEFAULT '',   -- PIN for host stand
  admin_password TEXT DEFAULT '',   -- password for testing, magic link for production
  -- Magic link tokens
  -- (stored in business_magic_links table below)
  -- Go live
  is_live BOOLEAN DEFAULT false, -- false = site visible but bookings disabled
  -- QR check-in
  qr_waitlist_enabled BOOLEAN DEFAULT false,
  qr_checkin_enabled BOOLEAN DEFAULT false,
  -- Operating config
  booking_window_days INT DEFAULT 30, -- how far ahead can you book
  min_party_size INT DEFAULT 1,
  max_party_size INT DEFAULT 12,
  slot_duration_minutes INT DEFAULT 90, -- how long a booking holds the table (legacy, use table_inventory.turn_time_minutes)
  min_advance_minutes INT DEFAULT 120, -- can't book less than 2 hours ahead
  slot_interval_minutes INT DEFAULT 30, -- 15 or 30
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Operating hours per business
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  last_seating TIME, -- last booking time (e.g., kitchen closes 30 min before close)
  is_closed BOOLEAN DEFAULT false
);

-- Services / menu categories (tables for restaurants, chairs for dentists, etc.)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "4-Top Window", "Bar Seat", "Patio", "Cleaning", "Consultation"
  capacity INT DEFAULT 4, -- party size this service handles
  quantity INT DEFAULT 1, -- how many of this resource exist
  duration_minutes INT DEFAULT 90,
  price_cents INT DEFAULT 0, -- 0 for free (restaurant tables), >0 for paid services
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- Per-business client view (RESTAURANT'S data about this client)
-- This is THEIR data. They can search it, export it, but can't see other businesses.
CREATE TABLE IF NOT EXISTS business_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- Their view of this client
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}', -- VIP, Regular, Allergy, etc.
  preferences TEXT DEFAULT '', -- "window seat", "no shellfish", "prefers Dr. Smith"
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ,
  visit_count INT DEFAULT 0,
  total_spend_cents INT DEFAULT 0,
  -- Restaurant-specific
  dietary TEXT DEFAULT '', -- vegetarian, vegan, gluten-free, allergies
  -- Status
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, client_id)
);

-- Bookings (reservations, appointments)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  service_id UUID REFERENCES services(id), -- which table/chair/resource
  -- Timing
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INT DEFAULT 90,
  party_size INT DEFAULT 2,
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, seated, completed, cancelled, no_show
  -- Details
  notes TEXT DEFAULT '', -- "birthday dinner", "bringing own wine"
  source TEXT DEFAULT 'website', -- website, phone, walk_in, event
  -- Financials (for paid bookings / deposits)
  deposit_cents INT DEFAULT 0,
  total_cents INT DEFAULT 0,
  --
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu items (for restaurant websites)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Main', -- Appetizer, Main, Dessert, Drink, etc.
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_cents INT DEFAULT 0,
  dietary_flags TEXT[] DEFAULT '{}', -- V, VG, GF, DF, etc.
  available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Magic link tokens for admin login
CREATE TABLE IF NOT EXISTS business_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- admin or staff
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content snapshots for rollback (taken before every publish)
CREATE TABLE IF NOT EXISTS business_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL DEFAULT 'full', -- full, menu, settings, photos, hours
  data JSONB NOT NULL,                        -- full state at time of snapshot
  label TEXT DEFAULT '',                       -- "Before menu edit", "Before theme change"
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE business_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all business_snapshots" ON business_snapshots FOR ALL USING (true) WITH CHECK (true);

-- Admin email whitelist per business
CREATE TABLE IF NOT EXISTS business_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- admin or staff
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, email)
);

-- Physical tables with floor plan position
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,               -- "T1", "W2", "PDR"
  zone TEXT DEFAULT 'Main',         -- "Main", "Patio", "Bar", "Private"
  capacity INT NOT NULL DEFAULT 4,
  shape TEXT DEFAULT 'circle',      -- circle, square, rect
  -- Floor plan position (percentage of canvas, 0-100)
  pos_x FLOAT DEFAULT 50,
  pos_y FLOAT DEFAULT 50,
  width FLOAT DEFAULT 8,            -- percentage of canvas width
  height FLOAT DEFAULT 8,
  rotation FLOAT DEFAULT 0,         -- degrees
  --
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Photos with REQUIRED alt text (a11y enforced at schema level)
CREATE TABLE IF NOT EXISTS business_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL CHECK (length(trim(alt)) > 0), -- WCAG: no empty alts
  caption TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'gallery', -- gallery, about, food, interior, team, hero
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all business_photos" ON business_photos FOR ALL USING (true) WITH CHECK (true);

-- Waitlist / walk-in queue (per-service day)
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  party_size INT NOT NULL DEFAULT 2,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, seated, removed
  quoted_wait_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  seated_at TIMESTAMPTZ
);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all waitlist_entries" ON waitlist_entries FOR ALL USING (true) WITH CHECK (true);

-- Table inventory (abstract — no positions, admin-only)
CREATE TABLE IF NOT EXISTS table_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  size INT NOT NULL,                  -- seats: 2, 4, 6, 8, etc.
  count INT NOT NULL DEFAULT 1,       -- how many of this size
  turn_time_minutes INT NOT NULL DEFAULT 90,
  UNIQUE(business_id, size)
);

ALTER TABLE table_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all table_inventory" ON table_inventory FOR ALL USING (true) WITH CHECK (true);

-- Blocked slots (manager overrides)
-- slot_date is used for one-off blocks
-- For recurring blocks: slot_date is NULL, day_of_week is set (0=Sun..6=Sat), or both NULL = every day
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  slot_date DATE,                   -- NULL = recurring
  day_of_week INT,                  -- 0-6 for recurring by weekday, NULL = all days (if slot_date also NULL)
  slot_time TIME NOT NULL,
  table_size INT NOT NULL DEFAULT 0, -- 0 = all sizes
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all blocked_slots" ON blocked_slots FOR ALL USING (true) WITH CHECK (true);

-- Guest magic links (for /my portal login)
CREATE TABLE IF NOT EXISTS guest_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guest_magic_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all guest_magic_links" ON guest_magic_links FOR ALL USING (true) WITH CHECK (true);

-- Client-sensitive data (isolated for HIPAA/SOC2 readiness)
-- This table can be encrypted at rest, moved to isolated storage,
-- or omitted entirely for non-healthcare verticals.
CREATE TABLE IF NOT EXISTS client_sensitive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- "insurance_id", "ssn_last4", "treatment_notes", "intake_form"
  field_value TEXT NOT NULL, -- encrypted at application layer for HIPAA
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, client_id, field_name)
);

-- ============================================================
-- Row-Level Security
-- Every business-scoped table enforced at DB level
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sensitive ENABLE ROW LEVEL SECURITY;

-- Allow all for now (service role key). Replace with proper auth later.
CREATE POLICY "Allow all clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all business_hours" ON business_hours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all business_clients" ON business_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all client_sensitive" ON client_sensitive FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGER FUNCTION: set_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE: sites
-- ============================================================
CREATE TABLE sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone      TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  location_name TEXT,
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'admin',
  site_id    UUID REFERENCES sites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER FUNCTION: handle_new_user
-- Auto-creates a profiles row on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABLE: daily_revenue
-- ============================================================
CREATE TABLE daily_revenue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  cash_total    NUMERIC(10,2) NOT NULL DEFAULT 0,
  card_total    NUMERIC(10,2) NOT NULL DEFAULT 0,
  wash_count    INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_revenue_site_date_unique UNIQUE (site_id, date)
);

CREATE TRIGGER set_daily_revenue_updated_at
  BEFORE UPDATE ON daily_revenue
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: revenue_line_items
-- ============================================================
CREATE TABLE revenue_line_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_revenue_id UUID NOT NULL REFERENCES daily_revenue(id) ON DELETE CASCADE,
  site_id          UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  service_type     TEXT NOT NULL,
  vehicle_type     TEXT NOT NULL,
  quantity         INTEGER NOT NULL DEFAULT 1,
  unit_price       NUMERIC(8,2) NOT NULL,
  line_total       NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- TRIGGER FUNCTION: compute_line_total
-- Sets line_total = quantity * unit_price on every write
-- ============================================================
CREATE OR REPLACE FUNCTION compute_line_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.line_total = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compute_line_total
  BEFORE INSERT OR UPDATE ON revenue_line_items
  FOR EACH ROW EXECUTE FUNCTION compute_line_total();

-- ============================================================
-- TRIGGER FUNCTION: sync_daily_totals
-- Recomputes total_revenue and wash_count on daily_revenue
-- whenever a revenue_line_items row is inserted/updated/deleted
-- ============================================================
CREATE OR REPLACE FUNCTION sync_daily_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_daily_revenue_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_daily_revenue_id := OLD.daily_revenue_id;
  ELSE
    v_daily_revenue_id := NEW.daily_revenue_id;
  END IF;

  UPDATE daily_revenue
  SET
    total_revenue = COALESCE((
      SELECT SUM(line_total)
      FROM revenue_line_items
      WHERE daily_revenue_id = v_daily_revenue_id
    ), 0),
    wash_count = COALESCE((
      SELECT SUM(quantity)
      FROM revenue_line_items
      WHERE daily_revenue_id = v_daily_revenue_id
    ), 0)
  WHERE id = v_daily_revenue_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_daily_totals
  AFTER INSERT OR UPDATE OR DELETE ON revenue_line_items
  FOR EACH ROW EXECUTE FUNCTION sync_daily_totals();

-- ============================================================
-- TABLE: costs
-- ============================================================
CREATE TABLE costs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('cos', 'capex')),
  description TEXT NOT NULL,
  notes       TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_costs_updated_at
  BEFORE UPDATE ON costs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: staff
-- ============================================================
CREATE TABLE staff (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  daily_rate NUMERIC(8,2) NOT NULL,
  role       TEXT NOT NULL DEFAULT 'washer',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  phone      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: attendance
-- ============================================================
CREATE TABLE attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  staff_id   UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  present    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_site_staff_date_unique UNIQUE (site_id, staff_id, date)
);

-- ============================================================
-- TABLE: daily_weather
-- ============================================================
CREATE TABLE daily_weather (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  weather_code  INTEGER NOT NULL,
  weather_label TEXT NOT NULL,
  temp_max_c    NUMERIC(4,1),
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_weather_site_date_unique UNIQUE (site_id, date)
);

-- ============================================================
-- TABLE: app_config
-- ============================================================
CREATE TABLE app_config (
  site_id    UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (site_id, key)
);

CREATE TRIGGER set_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- profiles: own-row access avoids the recursive subquery problem
CREATE POLICY "site_isolation" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- sites: match on id (the user's site_id from their profile)
CREATE POLICY "site_isolation" ON sites
  FOR ALL
  USING (id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON daily_revenue
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON revenue_line_items
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON costs
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON staff
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON attendance
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON daily_weather
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "site_isolation" ON app_config
  FOR ALL
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));

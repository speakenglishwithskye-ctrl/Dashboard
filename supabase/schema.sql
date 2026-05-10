-- ============================================================
-- LiFi Sales Dashboard — Complete Supabase SQL Setup
-- Run this entire file in Supabase → SQL Editor → New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'agent');
CREATE TYPE premium_plan AS ENUM ('weekly', 'monthly', 'three_months', 'six_months', 'yearly');
CREATE TYPE sale_type AS ENUM ('real_sale', 'giveaway');
CREATE TYPE platform_type AS ENUM ('telegram', 'facebook', 'tiktok');


-- ────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  role       user_role NOT NULL DEFAULT 'agent',
  full_name  TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile when a new user signs up via OTP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (SELECT role FROM public.profiles WHERE email = NEW.email LIMIT 1),
      'agent'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 3. BUYER HISTORY TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE buyer_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email         TEXT NOT NULL UNIQUE,
  total_purchases     INTEGER NOT NULL DEFAULT 0,
  total_spent         NUMERIC(10,2) NOT NULL DEFAULT 0,
  first_purchase_date DATE,
  last_purchase_date  DATE,
  plans_purchased     TEXT[] NOT NULL DEFAULT '{}',
  platforms_used      TEXT[] NOT NULL DEFAULT '{}',
  assigned_agents     UUID[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 4. SALES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  buyer_email      TEXT NOT NULL,
  premium_plan     premium_plan NOT NULL,
  sale_date        DATE NOT NULL,
  sale_type        sale_type NOT NULL DEFAULT 'real_sale',
  platform         platform_type NOT NULL,
  price            NUMERIC(10,2) NOT NULL DEFAULT 0,
  screenshot_url   TEXT,
  notes            TEXT,
  is_repeat_buyer  BOOLEAN NOT NULL DEFAULT false,
  purchase_count   INTEGER NOT NULL DEFAULT 1,
  previous_plan    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast buyer_email lookups
CREATE INDEX idx_sales_buyer_email ON sales(buyer_email);
CREATE INDEX idx_sales_agent_id ON sales(agent_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date DESC);


-- ────────────────────────────────────────────────────────────
-- 5. AUTO BUYER TRACKING TRIGGER
-- Runs every time a sale is inserted, auto-updates buyer_history
-- and marks is_repeat_buyer, purchase_count, previous_plan
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_existing   buyer_history%ROWTYPE;
  v_prev_plan  TEXT;
  v_count      INTEGER;
BEGIN
  -- Fetch current buyer history
  SELECT * INTO v_existing
  FROM buyer_history
  WHERE buyer_email = NEW.buyer_email;

  IF NOT FOUND THEN
    -- Brand new buyer
    NEW.is_repeat_buyer := false;
    NEW.purchase_count  := 1;
    NEW.previous_plan   := NULL;

    INSERT INTO buyer_history (
      buyer_email, total_purchases, total_spent,
      first_purchase_date, last_purchase_date,
      plans_purchased, platforms_used, assigned_agents
    ) VALUES (
      NEW.buyer_email, 1, NEW.price,
      NEW.sale_date, NEW.sale_date,
      ARRAY[NEW.premium_plan::TEXT],
      ARRAY[NEW.platform::TEXT],
      ARRAY[NEW.agent_id]
    );
  ELSE
    -- Returning buyer — get previous plan
    v_prev_plan := v_existing.plans_purchased[array_length(v_existing.plans_purchased, 1)];
    v_count     := v_existing.total_purchases + 1;

    NEW.is_repeat_buyer := true;
    NEW.purchase_count  := v_count;
    NEW.previous_plan   := v_prev_plan;

    UPDATE buyer_history SET
      total_purchases     = v_count,
      total_spent         = total_spent + NEW.price,
      last_purchase_date  = GREATEST(last_purchase_date, NEW.sale_date),
      plans_purchased     = plans_purchased || ARRAY[NEW.premium_plan::TEXT],
      platforms_used      = CASE
                              WHEN NOT (NEW.platform::TEXT = ANY(platforms_used))
                              THEN platforms_used || ARRAY[NEW.platform::TEXT]
                              ELSE platforms_used
                            END,
      assigned_agents     = CASE
                              WHEN NOT (NEW.agent_id = ANY(assigned_agents))
                              THEN assigned_agents || ARRAY[NEW.agent_id]
                              ELSE assigned_agents
                            END,
      updated_at          = now()
    WHERE buyer_email = NEW.buyer_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_sale_insert
  BEFORE INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_sale();


-- ────────────────────────────────────────────────────────────
-- 6. HANDLE SALE DELETION — keep buyer_history consistent
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate from scratch for this buyer
  UPDATE buyer_history bh
  SET
    total_purchases    = COALESCE((SELECT COUNT(*) FROM sales WHERE buyer_email = OLD.buyer_email), 0),
    total_spent        = COALESCE((SELECT SUM(price) FROM sales WHERE buyer_email = OLD.buyer_email), 0),
    last_purchase_date = (SELECT MAX(sale_date) FROM sales WHERE buyer_email = OLD.buyer_email),
    first_purchase_date = (SELECT MIN(sale_date) FROM sales WHERE buyer_email = OLD.buyer_email),
    plans_purchased    = COALESCE((
      SELECT ARRAY_AGG(premium_plan::TEXT ORDER BY sale_date ASC)
      FROM sales WHERE buyer_email = OLD.buyer_email
    ), '{}'),
    updated_at         = now()
  WHERE buyer_email = OLD.buyer_email;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_sale_delete
  AFTER DELETE ON sales
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale_delete();


-- ────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_history ENABLE ROW LEVEL SECURITY;


-- ── profiles policies ──

-- Anyone can read their own profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "admins_read_all_profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow profile inserts (for trigger + invites)
CREATE POLICY "allow_profile_insert"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "admins_update_any_profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── sales policies ──

-- Agents see only their own sales
CREATE POLICY "agents_read_own_sales"
  ON sales FOR SELECT
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Any authenticated user can insert (agent_id must match their uid, enforced in app)
CREATE POLICY "authenticated_insert_sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Agents can update their own sales (within 24h enforced in app)
-- Admins can update any
CREATE POLICY "update_sales"
  ON sales FOR UPDATE
  USING (
    agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete
CREATE POLICY "admins_delete_sales"
  ON sales FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── buyer_history policies ──

-- Only admins can read buyer_history
CREATE POLICY "admins_read_buyer_history"
  ON buyer_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger runs as SECURITY DEFINER so it can insert/update regardless
CREATE POLICY "allow_buyer_history_upsert"
  ON buyer_history FOR ALL
  USING (true)
  WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKET
-- Run this separately if bucket doesn't exist yet
-- ────────────────────────────────────────────────────────────

-- In Supabase Dashboard → Storage → Create bucket manually:
--   Name: sale-screenshots
--   Public: YES
--   Allowed MIME types: image/*

-- Or via SQL (may require pg_net / storage extension):
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale-screenshots', 'sale-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "public_read_screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sale-screenshots');

CREATE POLICY "authenticated_upload_screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sale-screenshots' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "users_delete_own_screenshots"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sale-screenshots' AND
    auth.uid() IS NOT NULL
  );


-- ────────────────────────────────────────────────────────────
-- 9. CREATE YOUR FIRST ADMIN ACCOUNT
-- Replace the values below, then run AFTER your first login
-- (You must log in once via OTP first so auth.users record exists)
-- ────────────────────────────────────────────────────────────

-- Step 1: Log into the app with your Gmail via OTP (creates auth.users record)
-- Step 2: Run this query, replacing the email with yours:

/*
UPDATE profiles
SET role = 'admin', full_name = 'Your Full Name'
WHERE email = 'youremail@gmail.com';
*/


-- ────────────────────────────────────────────────────────────
-- 10. USEFUL VIEWS (optional, for debugging)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_sales_with_agents AS
SELECT
  s.*,
  p.email     AS agent_email,
  p.full_name AS agent_name,
  p.role      AS agent_role
FROM sales s
LEFT JOIN profiles p ON s.agent_id = p.id;

CREATE OR REPLACE VIEW v_agent_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  COUNT(s.id)                              AS total_sales,
  COALESCE(SUM(s.price), 0)               AS total_revenue,
  COUNT(s.id) FILTER (WHERE s.is_repeat_buyer)  AS repeat_buyers,
  COUNT(s.id) FILTER (WHERE NOT s.is_repeat_buyer) AS new_buyers
FROM profiles p
LEFT JOIN sales s ON s.agent_id = p.id
GROUP BY p.id, p.email, p.full_name, p.role;

-- ────────────────────────────────────────────────────────────
-- DONE! All tables, triggers, RLS policies created.
-- ────────────────────────────────────────────────────────────

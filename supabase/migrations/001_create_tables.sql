-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  tokens      INTEGER DEFAULT 0,
  image_cost  NUMERIC(10, 4) DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage_logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage_logs"
  ON usage_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  stack       TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert error_logs"
  ON error_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read error_logs"
  ON error_logs FOR SELECT
  TO service_role
  USING (true);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email     TEXT UNIQUE NOT NULL,
  plan_tier      TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
  status         TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  paymob_order   TEXT,
  amount_cents   INTEGER DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Quota counters table for cross-function rate limiting
-- One row per (user_id, usage_type, window_start)
CREATE TABLE IF NOT EXISTS quota_counters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type   TEXT NOT NULL CHECK (usage_type IN ('images', 'text')),
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_type, window_start)
);

ALTER TABLE quota_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quota_counters"
  ON quota_counters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage quota_counters"
  ON quota_counters FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Atomic increment + check function (runs as SECURITY DEFINER to bypass RLS from service role)
CREATE OR REPLACE FUNCTION increment_quota(
  p_user_id    UUID,
  p_type       TEXT,
  p_limit      INTEGER
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, window_start TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_count  INTEGER;
BEGIN
  v_window := date_trunc('hour', NOW());

  INSERT INTO quota_counters (user_id, usage_type, window_start, count)
  VALUES (p_user_id, p_type, v_window, 1)
  ON CONFLICT (user_id, usage_type, window_start)
  DO UPDATE SET count = quota_counters.count + 1
  RETURNING quota_counters.count INTO v_count;

  RETURN QUERY SELECT (v_count <= p_limit), v_count, v_window;
END;
$$;

-- Auto-update updated_at on subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_email ON subscriptions (user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_quota_counters_lookup ON quota_counters (user_id, usage_type, window_start);

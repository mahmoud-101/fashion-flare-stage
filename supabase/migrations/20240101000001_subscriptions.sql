-- ============================================================
-- Subscriptions & Payment Orders tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan          text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','agency')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','pending','cancelled')),
  starts_at     timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz,
  payment_reference text,
  amount        int DEFAULT 0,
  paymob_order_id text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Payment orders table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan            text NOT NULL,
  amount          int NOT NULL,
  paymob_order_id text,
  paymob_txn_id   text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  payment_method  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment orders"
  ON public.payment_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment orders"
  ON public.payment_orders FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- updated_at trigger for both tables
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Update get_user_limits to read from subscriptions table
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_limits(_user_id uuid)
RETURNS TABLE (
  plan_name          text,
  daily_generations  int,
  daily_images       int,
  daily_reels        int,
  can_schedule       boolean,
  can_connect_store  boolean,
  can_batch_export   boolean
) AS $$
DECLARE
  _plan text;
BEGIN
  -- Get active subscription plan (fallback to free)
  SELECT s.plan INTO _plan
  FROM public.subscriptions s
  WHERE s.user_id = _user_id
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY s.created_at DESC
  LIMIT 1;

  _plan := COALESCE(_plan, 'free');

  RETURN QUERY
  SELECT
    _plan,
    CASE _plan
      WHEN 'agency' THEN -1   -- unlimited
      WHEN 'pro'    THEN 50
      ELSE               3
    END,
    CASE _plan
      WHEN 'agency' THEN -1
      WHEN 'pro'    THEN 30
      ELSE               3
    END,
    CASE _plan
      WHEN 'agency' THEN -1
      WHEN 'pro'    THEN 10
      ELSE               1
    END,
    _plan IN ('pro','agency'),
    _plan IN ('pro','agency'),
    _plan = 'agency';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS payment_orders_user_id_idx ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS payment_orders_paymob_order_id_idx ON public.payment_orders(paymob_order_id);

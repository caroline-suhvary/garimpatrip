-- ==============================================================
-- GARIMPATRIP: TELEMETRIA, CONTROLE DE COTAS E AFILIADOS
-- Execute no SQL Editor do Supabase se desejar persistencia no banco
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.api_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  period text NOT NULL, -- 'YYYY-MM-DD' para cota diaria ou 'YYYY-MM' para mensal
  request_count int NOT NULL DEFAULT 0,
  max_limit int NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_api_period UNIQUE (api_name, period)
);

CREATE TABLE IF NOT EXISTS public.api_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  endpoint text NOT NULL,
  status_code int NOT NULL,
  latency_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  category text NOT NULL,
  target_url text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.check_and_increment_quota(
  p_api_name text,
  p_period text,
  p_limit int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_allowed boolean;
BEGIN
  INSERT INTO public.api_quotas (api_name, period, request_count, max_limit, updated_at)
  VALUES (p_api_name, p_period, 1, p_limit, now())
  ON CONFLICT (api_name, period)
  DO UPDATE SET
    request_count = public.api_quotas.request_count + 1,
    max_limit = p_limit,
    updated_at = now()
  RETURNING request_count INTO v_count;

  IF v_count <= p_limit THEN
    v_allowed := true;
  ELSE
    v_allowed := false;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_count,
    'limit', p_limit,
    'remaining', GREATEST(0, p_limit - v_count)
  );
END;
$$;

-- ==============================================================
-- GARIMPATRIP: CÂMBIO, TETO DE 1.000 CONTAS E LIMPEZA DE 60 DIAS
-- ==============================================================

-- 1. TABELA DE CÂMBIO (AwesomeAPI)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_pair VARCHAR(10) NOT NULL, -- 'USD_BRL', 'EUR_BRL', 'ARS_BRL'
    rate NUMERIC(10, 4) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair_date ON public.exchange_rates(currency_pair, recorded_at);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de câmbio" ON public.exchange_rates;
CREATE POLICY "Leitura pública de câmbio" ON public.exchange_rates FOR SELECT USING (true);
GRANT SELECT ON public.exchange_rates TO anon, authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

-- 2. TETO MÁXIMO DE 1.000 CONTAS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total_users INT;
BEGIN
  -- Trava de segurança para não estourar o limite gratuito
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  IF v_total_users >= 1000 THEN
    RAISE EXCEPTION 'O limite de 1.000 contas gratuitas foi atingido temporariamente.'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, last_sign_in_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_sign_in_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. DESATIVAÇÃO DE ALERTAS APÓS 60 DIAS DE INATIVIDADE
CREATE OR REPLACE FUNCTION public.deactivate_inactive_alerts(p_days INT DEFAULT 60)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.user_route_alerts a
     SET is_active = FALSE
    FROM public.profiles p
   WHERE p.id = a.user_id AND a.is_active
     AND COALESCE(p.last_sign_in_at, p.created_at) < NOW() - make_interval(days => p_days);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 4. EXCLUSÃO AUTOMÁTICA DE CONTAS INATIVAS HÁ MAIS DE 60 DIAS
-- (Protege seus e-mails de desenvolvedora e domínio oficial para nunca serem apagados)
CREATE OR REPLACE FUNCTION public.purge_inactive_accounts(p_days INT DEFAULT 60)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  WITH deleted AS (
    DELETE FROM auth.users
     WHERE id IN (
       SELECT id FROM public.profiles
        WHERE COALESCE(last_sign_in_at, created_at) < NOW() - make_interval(days => p_days)
          AND email NOT ILIKE '%@garimpatrip.com.br'
          AND email NOT ILIKE '%carolaraujo%'
     )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM deleted;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_inactive_accounts(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_inactive_accounts(INT) TO service_role;

-- ==============================================================================
-- GARIMPATRIP: MODELAGEM RELACIONAL COMPLETA (PostgreSQL / Supabase)
-- Execute este arquivo inteiro no SQL Editor do Supabase (uma única vez).
-- Pode ser executado de novo sem apagar dados (usa IF NOT EXISTS / OR REPLACE).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PERFIS DE USUÁRIOS COM REGRAS DE INATIVIDADE E LIMITES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    max_active_alerts INT DEFAULT 3,
    max_trips INT DEFAULT 5,
    last_sign_in_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE VIAGENS
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_iata VARCHAR(3),
    destination_city VARCHAR(100) NOT NULL,
    destination_iata VARCHAR(3),
    start_date DATE,
    end_date DATE,
    is_flexible_dates BOOLEAN DEFAULT FALSE,
    travelers_count INT DEFAULT 1 CHECK (travelers_count BETWEEN 1 AND 50),
    budget_limit NUMERIC(10, 2) DEFAULT 0.00 CHECK (budget_limit >= 0),
    status VARCHAR(20) DEFAULT 'planejamento'
        CHECK (status IN ('planejamento', 'reservado', 'concluido', 'arquivado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAIXA DE DESCOBERTAS (ÁREA DE TRIAGEM TEMPORÁRIA)
CREATE TABLE IF NOT EXISTS public.discoveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('flight', 'hotel', 'tour', 'transport', 'doc', 'food', 'web_idea')),
    description TEXT,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('api_partner', 'web_result', 'manual')),
    external_url TEXT,
    estimated_price NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'BRL',
    raw_payload JSONB DEFAULT '{}'::jsonb,
    is_transferred_to_package BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ITENS DO PACOTE OFICIAL (AS 10 MACROCATEGORIAS CONSOLIDADAS)
CREATE TABLE IF NOT EXISTS public.package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    category_id INT NOT NULL CHECK (category_id BETWEEN 1 AND 10),
    title VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT 'planejado' CHECK (status IN ('planejado', 'reservado', 'pago')),
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    final_cost NUMERIC(10, 2),
    currency VARCHAR(3) DEFAULT 'BRL',
    booking_reference TEXT,
    external_url TEXT,
    notes TEXT,
    meta_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRONOGRAMA DIÁRIO
CREATE TABLE IF NOT EXISTS public.schedule_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 365),
    activity_date DATE,
    start_time TIME,
    title VARCHAR(200) NOT NULL,
    location_name VARCHAR(200),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    notes TEXT,
    is_rainy_day_alternative BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ROTAS MONITORADAS ÚNICAS (DEDUPLICAÇÃO DE CONSUMO DE API)
CREATE TABLE IF NOT EXISTS public.monitored_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    is_base_route BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    subscribers_count INT DEFAULT 1,
    last_checked_at TIMESTAMPTZ,
    UNIQUE(origin_iata, destination_iata)
);

-- 7. ALERTAS DE PREÇO DOS USUÁRIOS (LIGADOS ÀS ROTAS ÚNICAS)
CREATE TABLE IF NOT EXISTS public.user_route_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.monitored_routes(id) ON DELETE CASCADE,
    target_price NUMERIC(10, 2) NOT NULL CHECK (target_price > 0),
    preferred_month DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, route_id)
);

-- 8. TABELA DE DIMENSÃO CALENDÁRIO TURÍSTICO (ENRIQUECIMENTO ANALÍTICO)
CREATE TABLE IF NOT EXISTS public.dim_calendar (
    date_day DATE PRIMARY KEY,
    day_of_week INT NOT NULL,
    month INT NOT NULL,
    season_br VARCHAR(20) NOT NULL,
    is_school_vacation BOOLEAN DEFAULT FALSE,
    holiday_type VARCHAR(50),
    holiday_name VARCHAR(100),
    period_classification VARCHAR(30) DEFAULT 'Média Temporada'
);

-- 9. HISTÓRICO DE PREÇOS (RETENÇÃO MÓVEL DE 2 ANOS)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.monitored_routes(id) ON DELETE CASCADE,
    flight_date DATE NOT NULL REFERENCES public.dim_calendar(date_day),
    price NUMERIC(10, 2) NOT NULL,
    airline VARCHAR(100),
    stops INT DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_discoveries_raw_payload ON public.discoveries USING GIN (raw_payload);
CREATE INDEX IF NOT EXISTS idx_package_items_meta ON public.package_items USING GIN (meta_details);
CREATE INDEX IF NOT EXISTS idx_price_history_flight_date ON public.price_history(flight_date);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON public.price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_route ON public.price_history(route_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_trip ON public.discoveries(trip_id);
CREATE INDEX IF NOT EXISTS idx_package_items_trip ON public.package_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_trip ON public.schedule_items(trip_id);

-- ==============================================================================
-- FUNÇÕES AUXILIARES
-- ==============================================================================

-- Verifica se a viagem pertence ao usuário logado (usado nas regras de segurança).
CREATE OR REPLACE FUNCTION public.owns_trip(p_trip_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.trips WHERE id = p_trip_id AND user_id = auth.uid());
$$;

-- Cria o perfil automaticamente quando alguém entra pela primeira vez com o Google.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualiza o updated_at das viagens.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trips_touch_updated_at ON public.trips;
CREATE TRIGGER trips_touch_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- REGRA: cada usuário pode ter no máximo profiles.max_trips viagens não arquivadas (padrão 5).
CREATE OR REPLACE FUNCTION public.enforce_trip_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limit INT; v_count INT;
BEGIN
  IF NEW.status = 'arquivado' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> 'arquivado' THEN RETURN NEW; END IF;
  SELECT COALESCE(max_trips, 5) INTO v_limit FROM public.profiles WHERE id = NEW.user_id;
  SELECT COUNT(*) INTO v_count FROM public.trips
   WHERE user_id = NEW.user_id AND status <> 'arquivado' AND id <> NEW.id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de % viagens ativas atingido. Arquive uma viagem para criar outra.', v_limit
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trips_enforce_limit ON public.trips;
CREATE TRIGGER trips_enforce_limit
  BEFORE INSERT OR UPDATE OF status ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_trip_limit();

-- REGRA: cada usuário pode ter no máximo profiles.max_active_alerts alertas ativos (padrão 3).
CREATE OR REPLACE FUNCTION public.enforce_alert_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limit INT; v_count INT;
BEGIN
  IF NOT NEW.is_active THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_active THEN RETURN NEW; END IF;
  SELECT COALESCE(max_active_alerts, 3) INTO v_limit FROM public.profiles WHERE id = NEW.user_id;
  SELECT COUNT(*) INTO v_count FROM public.user_route_alerts
   WHERE user_id = NEW.user_id AND is_active AND id <> NEW.id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de % alertas ativos atingido. Desative um alerta para criar outro.', v_limit
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS alerts_enforce_limit ON public.user_route_alerts;
CREATE TRIGGER alerts_enforce_limit
  BEFORE INSERT OR UPDATE OF is_active ON public.user_route_alerts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_alert_limit();

-- Mantém subscribers_count das rotas e desliga rotas sem ninguém (exceto rotas base).
CREATE OR REPLACE FUNCTION public.refresh_route_subscribers(p_route_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.user_route_alerts WHERE route_id = p_route_id AND is_active;
  UPDATE public.monitored_routes
     SET subscribers_count = v_count,
         is_active = is_base_route OR v_count > 0
   WHERE id = p_route_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.alerts_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_route_subscribers(COALESCE(NEW.route_id, OLD.route_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS alerts_refresh_subscribers ON public.user_route_alerts;
CREATE TRIGGER alerts_refresh_subscribers
  AFTER INSERT OR UPDATE OR DELETE ON public.user_route_alerts
  FOR EACH ROW EXECUTE FUNCTION public.alerts_after_change();

-- Cria (ou reativa) um alerta de preço. Se a rota ainda não for monitorada,
-- ela é criada uma única vez e compartilhada por todos os usuários (deduplicação).
CREATE OR REPLACE FUNCTION public.create_route_alert(
  p_origin TEXT,
  p_destination TEXT,
  p_target_price NUMERIC,
  p_preferred_month DATE DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid UUID := auth.uid(); v_route UUID; v_alert UUID;
        v_origin TEXT := UPPER(TRIM(p_origin)); v_dest TEXT := UPPER(TRIM(p_destination));
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Entre com sua conta Google para criar alertas.'; END IF;
  IF v_origin !~ '^[A-Z]{3}$' OR v_dest !~ '^[A-Z]{3}$' OR v_origin = v_dest THEN
    RAISE EXCEPTION 'Use códigos IATA válidos e diferentes (ex.: GRU e SSA).';
  END IF;
  IF p_target_price IS NULL OR p_target_price <= 0 OR p_target_price > 100000 THEN
    RAISE EXCEPTION 'Informe um preço-alvo válido.';
  END IF;

  INSERT INTO public.monitored_routes (origin_iata, destination_iata, route_name, is_active, subscribers_count)
  VALUES (v_origin, v_dest, v_origin || ' -> ' || v_dest, TRUE, 0)
  ON CONFLICT (origin_iata, destination_iata) DO UPDATE SET is_active = TRUE
  RETURNING id INTO v_route;

  INSERT INTO public.user_route_alerts (user_id, route_id, target_price, preferred_month, is_active)
  VALUES (v_uid, v_route, p_target_price, p_preferred_month, TRUE)
  ON CONFLICT (user_id, route_id) DO UPDATE
     SET target_price = EXCLUDED.target_price,
         preferred_month = EXCLUDED.preferred_month,
         is_active = TRUE
  RETURNING id INTO v_alert;

  RETURN v_alert;
END;
$$;

-- REGRA DE INATIVIDADE: desativa alertas de quem não entra há mais de N dias (padrão 90).
-- Chamada diariamente pelo robô Python com a chave service_role.
CREATE OR REPLACE FUNCTION public.deactivate_inactive_alerts(p_days INT DEFAULT 90)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.user_route_alerts a
     SET is_active = FALSE
    FROM public.profiles p
   WHERE p.id = a.user_id AND a.is_active
     AND p.last_sign_in_at < NOW() - make_interval(days => p_days);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- RETENÇÃO MÓVEL: apaga preços registrados há mais de 2 anos.
CREATE OR REPLACE FUNCTION public.purge_old_prices()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  DELETE FROM public.price_history WHERE recorded_at < NOW() - INTERVAL '2 years';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA E ISOLAMENTO DE USUÁRIOS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_route_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários acessam apenas seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários leem seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários atualizam seu perfil" ON public.profiles;
CREATE POLICY "Usuários leem seu perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários atualizam seu perfil" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários acessam apenas suas viagens" ON public.trips;
CREATE POLICY "Usuários acessam apenas suas viagens" ON public.trips FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários acessam apenas suas descobertas" ON public.discoveries;
CREATE POLICY "Usuários acessam apenas suas descobertas" ON public.discoveries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.owns_trip(trip_id));

DROP POLICY IF EXISTS "Usuários acessam apenas itens de suas viagens" ON public.package_items;
CREATE POLICY "Usuários acessam apenas itens de suas viagens" ON public.package_items FOR ALL
  USING (public.owns_trip(trip_id)) WITH CHECK (public.owns_trip(trip_id));

DROP POLICY IF EXISTS "Usuários acessam apenas seu cronograma" ON public.schedule_items;
CREATE POLICY "Usuários acessam apenas seu cronograma" ON public.schedule_items FOR ALL
  USING (public.owns_trip(trip_id)) WITH CHECK (public.owns_trip(trip_id));

-- Alertas: leitura/edição/exclusão dos próprios; criação apenas via create_route_alert().
DROP POLICY IF EXISTS "Usuários acessam apenas seus alertas" ON public.user_route_alerts;
DROP POLICY IF EXISTS "Usuários leem seus alertas" ON public.user_route_alerts;
DROP POLICY IF EXISTS "Usuários editam seus alertas" ON public.user_route_alerts;
DROP POLICY IF EXISTS "Usuários apagam seus alertas" ON public.user_route_alerts;
CREATE POLICY "Usuários leem seus alertas" ON public.user_route_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários editam seus alertas" ON public.user_route_alerts FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários apagam seus alertas" ON public.user_route_alerts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Leitura pública de rotas monitoradas" ON public.monitored_routes;
DROP POLICY IF EXISTS "Leitura pública do histórico de preços" ON public.price_history;
DROP POLICY IF EXISTS "Leitura pública do calendário turístico" ON public.dim_calendar;
CREATE POLICY "Leitura pública de rotas monitoradas" ON public.monitored_routes FOR SELECT USING (true);
CREATE POLICY "Leitura pública do histórico de preços" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Leitura pública do calendário turístico" ON public.dim_calendar FOR SELECT USING (true);

-- ==============================================================================
-- PERMISSÕES (GRANTS)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL ON public.profiles, public.trips, public.discoveries, public.package_items,
  public.schedule_items, public.user_route_alerts, public.monitored_routes,
  public.price_history, public.dim_calendar FROM anon, authenticated;

GRANT SELECT ON public.monitored_routes, public.price_history, public.dim_calendar TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
-- O usuário NÃO pode alterar os próprios limites (max_trips / max_active_alerts).
GRANT UPDATE (full_name, avatar_url, last_sign_in_at) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips, public.discoveries,
  public.package_items, public.schedule_items TO authenticated;
GRANT SELECT, DELETE ON public.user_route_alerts TO authenticated;
GRANT UPDATE (target_price, preferred_month, is_active) ON public.user_route_alerts TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

REVOKE EXECUTE ON FUNCTION public.create_route_alert(TEXT, TEXT, NUMERIC, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_route_alert(TEXT, TEXT, NUMERIC, DATE) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_inactive_alerts(INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_old_prices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_route_subscribers(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_inactive_alerts(INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_prices() TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_trip(UUID) TO authenticated;

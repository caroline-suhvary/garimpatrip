-- ==============================================================================
-- GARIMPATRIP: CONTROLE ATOMICO DE COTA DO BRAVE & TELEMETRIA DE DADOS
-- Execute este script no SQL Editor do Supabase para ativar:
-- 1. Contador mensal atomico (limite de 950 chamadas/mes)
-- 2. Tabela de telemetria analitica de APIs (FinOps & Engenharia de Dados)
-- 3. Tabela de trafego do site (visitas e conversoes)
-- ==============================================================================

-- ==============================================================================
-- GARIMPATRIP: CONTROLE DE COTA MENSAL E TELEMETRIA DE APIS
-- Executar APÓS o 01_schema.sql ter sido executado com sucesso.
-- ==============================================================================

-- 1. CONTROLE ATÔMICO DE COTA MENSAL (Ex: Brave Search com teto de 950 req/mês)
CREATE TABLE IF NOT EXISTS public.api_monthly_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,                  -- 'brave', 'travelpayouts', 'geoapify', etc.
    year_month TEXT NOT NULL,                -- Formato 'YYYY-MM'
    request_count INT NOT NULL DEFAULT 0,
    quota_limit INT NOT NULL DEFAULT 950,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, year_month)
);

-- 2. HISTÓRICO DE TELEMETRIA (Engenharia de dados / Looker Studio)
CREATE TABLE IF NOT EXISTS public.api_telemetry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INT NOT NULL,
    duration_ms INT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas analíticas rápidas
CREATE INDEX IF NOT EXISTS idx_telemetry_provider_month ON public.api_telemetry_events(provider, created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.api_telemetry_events(created_at);

-- 3. FUNÇÃO ATÔMICA PARA INCREMENTAR COTA (Concorrência segura)
CREATE OR REPLACE FUNCTION public.increment_api_quota(
    p_provider TEXT,
    p_year_month TEXT,
    p_limit INT DEFAULT 950
)
RETURNS TABLE (allowed BOOLEAN, current_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    INSERT INTO public.api_monthly_usage (provider, year_month, request_count, quota_limit, updated_at)
    VALUES (p_provider, p_year_month, 1, p_limit, NOW())
    ON CONFLICT (provider, year_month)
    DO UPDATE SET 
        request_count = CASE 
            WHEN public.api_monthly_usage.request_count < public.api_monthly_usage.quota_limit 
            THEN public.api_monthly_usage.request_count + 1 
            ELSE public.api_monthly_usage.request_count 
        END,
        updated_at = NOW()
    RETURNING request_count INTO v_count;

    IF v_count <= p_limit THEN
        RETURN QUERY SELECT TRUE, v_count;
    ELSE
        RETURN QUERY SELECT FALSE, v_count;
    END IF;
END;
$$;

-- 4. SEGURANÇA: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.api_monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_telemetry_events ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas o servidor (service_role) atualiza cotas e grava telemetria
DROP POLICY IF EXISTS "Acesso total service_role cotas" ON public.api_monthly_usage;
CREATE POLICY "Acesso total service_role cotas" ON public.api_monthly_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total service_role telemetria" ON public.api_telemetry_events;
CREATE POLICY "Acesso total service_role telemetria" ON public.api_telemetry_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permissões
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.api_monthly_usage TO service_role;
GRANT ALL ON public.api_telemetry_events TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_api_quota(TEXT, TEXT, INT) TO service_role;

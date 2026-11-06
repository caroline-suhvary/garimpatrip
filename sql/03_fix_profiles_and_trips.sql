-- ==============================================================================
-- GARIMPATRIP: CORREÇÃO E SINCRONIZAÇÃO DE PERFIS (auth.users -> public.profiles)
-- Execute este script no SQL Editor do Supabase para corrigir o erro:
-- 'violates foreign key constraint "trips_user_id_fkey"'
-- ==============================================================================

-- 1. Sincroniza imediatamente todos os usuários existentes de auth.users para public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, max_trips, max_active_alerts, created_at)
SELECT 
  u.id,
  COALESCE(u.email, 'sem-email@garimpatrip.local'),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, 'Viajante'), '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  5,
  3,
  COALESCE(u.created_at, NOW())
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
  last_sign_in_at = NOW();

-- 2. Recria a função e o gatilho com suporte a UPSERT seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, max_trips, max_active_alerts)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Viajante'),
    NEW.raw_user_meta_data->>'avatar_url',
    5,
    3
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    last_sign_in_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Garante permissão de inserção/leitura no profile para o usuário autenticado caso falte
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;

-- 4. Função auxiliar para auto-garantir perfil (RPC seguro)
CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_user RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = v_uid;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, max_trips, max_active_alerts)
  VALUES (
    v_uid,
    COALESCE(v_user.email, ''),
    COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', 'Viajante'),
    v_user.raw_user_meta_data->>'avatar_url',
    5,
    3
  )
  ON CONFLICT (id) DO UPDATE SET
    last_sign_in_at = NOW();

  RETURN v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;

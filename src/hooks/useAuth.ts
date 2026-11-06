'use client';
// Estado do login (Google via rota própria GarimpaTrip + Supabase SSR) compartilhado pelas telas.
import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

export function useAuth() {
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(() => {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/auth/login/google?next=${encodeURIComponent(next)}`;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  }, [supabase]);

  return { supabase, user, loading, configured: Boolean(supabase), signIn, signOut };
}

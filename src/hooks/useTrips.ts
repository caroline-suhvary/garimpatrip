'use client';
// Lista as viagens do usuário logado e lembra qual está selecionada (no navegador).
import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Trip } from '@/types';

const STORAGE_KEY = 'garimpatrip:selectedTrip';

export function useTrips(supabase: SupabaseClient | null, user: User | null, initialTripId?: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedId, setSelectedIdState] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase || !user) {
      setTrips([]);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const list = (data ?? []) as Trip[];
    setTrips(list);
    setSelectedIdState((current) => {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      const wanted = [initialTripId, current, stored].find((id) => id && list.some((t) => t.id === id));
      return wanted ?? list.find((t) => t.status !== 'arquivado')?.id ?? list[0]?.id ?? '';
    });
  }, [supabase, user, initialTripId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedTrip = trips.find((t) => t.id === selectedId) ?? null;

  return { trips, selectedTrip, selectedId, setSelectedId, reload, loading, error };
}

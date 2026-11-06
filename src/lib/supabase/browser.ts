// Cliente do Supabase usado nas telas (navegador). Le os cookies de sessao.
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
    supabaseKey &&
    !supabaseKey.includes(' ')
  );
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return client;
}

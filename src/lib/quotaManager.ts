import 'server-only';
import { createClient } from '@supabase/supabase-js';

const memoryCounters = new Map<string, number>();

export async function checkQuotaAndTrack(
  apiName: string,
  periodType: 'daily' | 'monthly',
  maxLimit: number,
  endpoint: string,
  fn: () => Promise<{ status: number; data: any }>
): Promise<{ allowed: boolean; remaining: number; data: any; status: number; quotaExceeded?: boolean }> {
  const now = new Date();
  const period =
    periodType === 'daily'
      ? now.toISOString().slice(0, 10) // 'YYYY-MM-DD'
      : now.toISOString().slice(0, 7); // 'YYYY-MM'

  const cacheKey = `${apiName}:${period}`;
  let allowed = true;
  let remaining = maxLimit;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: rpcRes, error } = await supabase.rpc('check_and_increment_quota', {
        p_api_name: apiName,
        p_period: period,
        p_limit: maxLimit,
      });

      if (!error && rpcRes) {
        allowed = rpcRes.allowed;
        remaining = rpcRes.remaining;
      } else {
        const current = (memoryCounters.get(cacheKey) || 0) + 1;
        memoryCounters.set(cacheKey, current);
        allowed = current <= maxLimit;
        remaining = Math.max(0, maxLimit - current);
      }
    } catch {
      const current = (memoryCounters.get(cacheKey) || 0) + 1;
      memoryCounters.set(cacheKey, current);
      allowed = current <= maxLimit;
      remaining = Math.max(0, maxLimit - current);
    }
  } else {
    const current = (memoryCounters.get(cacheKey) || 0) + 1;
    memoryCounters.set(cacheKey, current);
    allowed = current <= maxLimit;
    remaining = Math.max(0, maxLimit - current);
  }

  if (!allowed) {
    return {
      allowed: false,
      quotaExceeded: true,
      remaining: 0,
      status: 429,
      data: null,
    };
  }

  const startTime = Date.now();
  const result = await fn();
  const latency = Date.now() - startTime;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      supabase
        .from('api_telemetry')
        .insert({
          api_name: apiName,
          endpoint,
          status_code: result.status,
          latency_ms: latency,
        })
        .then(() => {})
        .catch(() => {});
    } catch {}
  }

  return {
    allowed: true,
    remaining,
    data: result.data,
    status: result.status,
  };
}

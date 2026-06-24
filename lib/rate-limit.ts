import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const WINDOW_SECONDS = 60;
const DEFAULT_LIMIT = 60;
const BURST_LIMIT = 20;

export interface RateLimitConfig {
  limit?: number;
  window?: number;
  identifier?: (req: NextRequest) => string | null;
}

export function createRateLimiter(config: RateLimitConfig = {}) {
  const limit = config.limit ?? DEFAULT_LIMIT;
  const windowSec = config.window ?? WINDOW_SECONDS;

  return async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'anonymous';
    const identifier = config.identifier?.(req) ?? ip;

    // Try Upstash if configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const key = `rl:${identifier}`;
        const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { result: number };
          if (data.result === 1) {
            await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/expire/${key}/${windowSec}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
            });
          }
          if (data.result > limit) {
            return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Muitas requisições' } }, { status: 429 });
          }
        }
      } catch {
        // Fall through to in-memory below
      }
    }

    return null;
  };
}

export const defaultRateLimit = createRateLimiter();
export const burstRateLimit = createRateLimiter({ limit: BURST_LIMIT, window: 10 });

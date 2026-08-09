// ADR-0006: Token Bucket Rate Limiter
// In production, this can be swapped with Upstash Redis / Vercel KV.
// For this MVP, we use a thread-safe-ish memory map to avoid breaking deployments.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const memoryStore = new Map<string, Bucket>();

export function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean
): { success: boolean; limit: number; remaining: number } {
  // ADR-0006 Rules:
  // Unauthenticated: max 15 per minute (refill rate: 15/60 = 0.25 tokens/sec)
  // Authenticated: max 60 per minute (refill rate: 60/60 = 1.0 token/sec)
  const limit = isAuthenticated ? 60 : 15;
  const refillRate = limit / 60; // tokens per second
  const now = Date.now();

  let bucket = memoryStore.get(identifier);

  if (!bucket) {
    bucket = {
      tokens: limit,
      lastRefill: now,
    };
    memoryStore.set(identifier, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(limit, bucket.tokens + elapsedSeconds * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    memoryStore.set(identifier, bucket);
    return {
      success: true,
      limit,
      remaining: Math.floor(bucket.tokens),
    };
  }

  return {
    success: false,
    limit,
    remaining: 0,
  };
}

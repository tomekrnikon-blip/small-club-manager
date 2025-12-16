/**
 * Rate Limiting Service
 * Prevents abuse by limiting API request frequency
 */

import { getDb } from "../db";
import { rateLimits } from "../../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
}

// Default rate limits
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // SMS endpoints - 100 per hour per club
  "sms.send": { endpoint: "sms.send", maxRequests: 100, windowSeconds: 3600 },
  
  // Login attempts - 5 per 15 minutes per IP
  "auth.login": { endpoint: "auth.login", maxRequests: 5, windowSeconds: 900 },
  
  // Password reset - 3 per hour per email
  "auth.reset": { endpoint: "auth.reset", maxRequests: 3, windowSeconds: 3600 },
  
  // API general - 1000 per minute per user
  "api.general": { endpoint: "api.general", maxRequests: 1000, windowSeconds: 60 },
  
  // Invitation sending - 20 per hour per club
  "invitation.send": { endpoint: "invitation.send", maxRequests: 20, windowSeconds: 3600 },
  
  // Report generation - 10 per hour per user
  "report.generate": { endpoint: "report.generate", maxRequests: 10, windowSeconds: 3600 },
  
  // Export - 20 per hour per user
  "export.data": { endpoint: "export.data", maxRequests: 20, windowSeconds: 3600 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until reset
}

/**
 * Check if a request is allowed under rate limits
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const db = await getDb();
  if (!db) {
    // If DB is unavailable, allow the request but log warning
    console.warn("[RateLimit] Database unavailable, allowing request");
    return { allowed: true, remaining: 999, resetAt: new Date() };
  }
  
  const limitConfig = config || RATE_LIMITS[endpoint] || RATE_LIMITS["api.general"];
  const now = new Date();
  
  // Find existing rate limit record
  const existing = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.identifier, identifier),
        eq(rateLimits.endpoint, endpoint),
        gte(rateLimits.windowEnd, now)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    const record = existing[0];
    const remaining = limitConfig.maxRequests - record.count;
    
    if (record.count >= limitConfig.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.windowEnd.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.windowEnd,
        retryAfter,
      };
    }
    
    // Increment counter
    await db
      .update(rateLimits)
      .set({ count: record.count + 1 })
      .where(eq(rateLimits.id, record.id));
    
    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt: record.windowEnd,
    };
  }
  
  // Create new rate limit window
  const windowEnd = new Date(now.getTime() + limitConfig.windowSeconds * 1000);
  
  await db.insert(rateLimits).values({
    identifier,
    endpoint,
    count: 1,
    windowStart: now,
    windowEnd,
  });
  
  return {
    allowed: true,
    remaining: limitConfig.maxRequests - 1,
    resetAt: windowEnd,
  };
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(identifier: string, endpoint?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  if (endpoint) {
    await db
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.endpoint, endpoint)
        )
      );
  } else {
    await db
      .delete(rateLimits)
      .where(eq(rateLimits.identifier, identifier));
  }
}

/**
 * Clean up expired rate limit records
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  const result = await db
    .delete(rateLimits)
    .where(eq(rateLimits.windowEnd, now));
  
  return 0; // MySQL doesn't return affected rows easily
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
    ...(result.retryAfter ? { "Retry-After": String(result.retryAfter) } : {}),
  };
}

/**
 * Create identifier from user context
 */
export function createRateLimitIdentifier(options: {
  userId?: number;
  clubId?: number;
  ip?: string;
  email?: string;
}): string {
  if (options.userId) return `user:${options.userId}`;
  if (options.clubId) return `club:${options.clubId}`;
  if (options.email) return `email:${options.email}`;
  if (options.ip) return `ip:${options.ip}`;
  return "anonymous";
}

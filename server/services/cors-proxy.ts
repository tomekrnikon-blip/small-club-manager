/**
 * CORS Proxy Service
 * Server-side proxy to bypass CORS restrictions when fetching external data
 */

import * as cheerio from 'cheerio';

// Cache for fetched pages (in production, use Redis)
interface CacheEntry {
  html: string;
  fetchedAt: number;
  expiresAt: number;
}

const pageCache: Map<string, CacheEntry> = new Map();

// Default cache TTL: 5 minutes
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

// Rate limiting
const rateLimitMap: Map<string, number[]> = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per domain

/**
 * Check if request is rate limited
 */
function isRateLimited(domain: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(domain) || [];
  
  // Filter out old requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  rateLimitMap.set(domain, recentRequests);
  
  return recentRequests.length >= RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Record a request for rate limiting
 */
function recordRequest(domain: string): void {
  const requests = rateLimitMap.get(domain) || [];
  requests.push(Date.now());
  rateLimitMap.set(domain, requests);
}

/**
 * Get domain from URL
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Fetch a page through the proxy with caching
 */
export async function fetchPage(url: string, options?: {
  cacheTtl?: number;
  forceRefresh?: boolean;
  userAgent?: string;
}): Promise<{ html: string; fromCache: boolean; fetchedAt: Date }> {
  const {
    cacheTtl = DEFAULT_CACHE_TTL,
    forceRefresh = false,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  } = options || {};

  const domain = getDomain(url);
  const now = Date.now();

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = pageCache.get(url);
    if (cached && cached.expiresAt > now) {
      console.log(`[CORS Proxy] Cache hit for ${url}`);
      return {
        html: cached.html,
        fromCache: true,
        fetchedAt: new Date(cached.fetchedAt),
      };
    }
  }

  // Check rate limit
  if (isRateLimited(domain)) {
    throw new Error(`Rate limit exceeded for ${domain}. Please try again later.`);
  }

  // Record this request
  recordRequest(domain);

  console.log(`[CORS Proxy] Fetching ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Cache the result
    pageCache.set(url, {
      html,
      fetchedAt: now,
      expiresAt: now + cacheTtl,
    });

    console.log(`[CORS Proxy] Successfully fetched ${url} (${html.length} bytes)`);

    return {
      html,
      fromCache: false,
      fetchedAt: new Date(now),
    };
  } catch (error) {
    console.error(`[CORS Proxy] Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch and parse a page, returning cheerio instance
 */
export async function fetchAndParse(url: string, options?: {
  cacheTtl?: number;
  forceRefresh?: boolean;
}): Promise<{ $: cheerio.CheerioAPI; fromCache: boolean; fetchedAt: Date }> {
  const result = await fetchPage(url, options);
  const $ = cheerio.load(result.html);
  
  return {
    $,
    fromCache: result.fromCache,
    fetchedAt: result.fetchedAt,
  };
}

/**
 * Clear cache for a specific URL or all URLs
 */
export function clearCache(url?: string): void {
  if (url) {
    pageCache.delete(url);
    console.log(`[CORS Proxy] Cleared cache for ${url}`);
  } else {
    pageCache.clear();
    console.log('[CORS Proxy] Cleared all cache');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
} {
  let totalSize = 0;
  let oldestTime: number | null = null;
  let newestTime: number | null = null;

  for (const entry of pageCache.values()) {
    totalSize += entry.html.length;
    
    if (oldestTime === null || entry.fetchedAt < oldestTime) {
      oldestTime = entry.fetchedAt;
    }
    if (newestTime === null || entry.fetchedAt > newestTime) {
      newestTime = entry.fetchedAt;
    }
  }

  return {
    totalEntries: pageCache.size,
    totalSize,
    oldestEntry: oldestTime ? new Date(oldestTime) : null,
    newestEntry: newestTime ? new Date(newestTime) : null,
  };
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let removed = 0;

  for (const [url, entry] of pageCache.entries()) {
    if (entry.expiresAt < now) {
      pageCache.delete(url);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`[CORS Proxy] Cleaned up ${removed} expired cache entries`);
  }

  return removed;
}

// Run cache cleanup every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);

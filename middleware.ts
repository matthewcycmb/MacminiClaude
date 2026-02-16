import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// In-memory fallback rate limiter when Redis is unavailable
const memoryRateLimit = new Map<string, { count: number; resetAt: number }>()
const MEMORY_LIMIT = 60 // requests per window
const MEMORY_WINDOW_MS = 60_000 // 1 minute

function checkMemoryRateLimit(identifier: string): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryRateLimit.get(identifier)

  if (!entry || now > entry.resetAt) {
    memoryRateLimit.set(identifier, { count: 1, resetAt: now + MEMORY_WINDOW_MS })
    return { success: true, remaining: MEMORY_LIMIT - 1 }
  }

  entry.count++
  if (entry.count > MEMORY_LIMIT) {
    return { success: false, remaining: 0 }
  }
  return { success: true, remaining: MEMORY_LIMIT - entry.count }
}

// Periodically clean up expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryRateLimit) {
    if (now > entry.resetAt) memoryRateLimit.delete(key)
  }
}, 300_000)

export async function middleware(request: NextRequest) {
  // Only rate limit API routes (excluding auth)
  if (
    !request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next()
  }

  // Identify user by JWT email or IP
  const token = await getToken({ req: request })
  const identifier = token?.email || request.headers.get("x-forwarded-for") || "anonymous"

  // Try Redis-based rate limiting first
  try {
    const { apiLimiter } = await import("@/lib/rate-limit/limiter")

    if (apiLimiter) {
      const { success, remaining, reset } = await apiLimiter.limit(identifier as string)

      if (!success) {
        const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Remaining": "0",
              "Retry-After": retryAfterSeconds.toString(),
            },
          }
        )
      }

      const response = NextResponse.next()
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      return response
    }
  } catch {
    // Redis unavailable — fall through to in-memory limiter
  }

  // Fallback: in-memory rate limiting
  const { success, remaining } = checkMemoryRateLimit(identifier as string)
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0", "Retry-After": "60" } }
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Remaining", remaining.toString())
  return response
}

export const config = {
  matcher: "/api/:path*",
}

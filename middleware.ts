import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Only rate limit API routes (excluding auth)
  if (
    !request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next()
  }

  // Dynamically import to avoid issues when Redis is not configured
  const { apiLimiter } = await import("@/lib/rate-limit/limiter")

  // If Redis is not configured, allow the request
  if (!apiLimiter) {
    return NextResponse.next()
  }

  // Identify user by JWT email or IP
  const token = await getToken({ req: request })
  const identifier = token?.email || request.headers.get("x-forwarded-for") || "anonymous"

  try {
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
  } catch (error) {
    // If Redis fails, allow the request (graceful degradation)
    console.error("Rate limit check failed:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: "/api/:path*",
}

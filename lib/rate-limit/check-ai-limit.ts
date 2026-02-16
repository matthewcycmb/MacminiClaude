import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { aiLimiterFree, aiLimiterPremium } from "./limiter"

// In-memory fallback for AI rate limiting when Redis is unavailable
const memoryAiLimit = new Map<string, { count: number; resetAt: number }>()
const AI_MEMORY_LIMIT_FREE = 15
const AI_MEMORY_LIMIT_PREMIUM = 100
const AI_MEMORY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

interface RateLimitResult {
  allowed: boolean
  response?: NextResponse
  userId?: string
}

/**
 * Check AI rate limit for the current user.
 * Call this at the top of every AI endpoint handler.
 * Returns { allowed: true, userId } if OK, or { allowed: false, response } with a 429 response.
 */
export async function checkAiLimit(): Promise<RateLimitResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, subscriptionTier: true },
  })

  if (!user) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    }
  }

  // Try Redis-based rate limiting first
  let success = true
  let reset = Date.now() + AI_MEMORY_WINDOW_MS

  if (aiLimiterFree && aiLimiterPremium) {
    const limiter = user.subscriptionTier === "premium" ? aiLimiterPremium : aiLimiterFree
    try {
      const result = await limiter.limit(user.id)
      success = result.success
      reset = result.reset
    } catch {
      // Redis unavailable — fall back to in-memory rate limiting
      const limit = user.subscriptionTier === "premium" ? AI_MEMORY_LIMIT_PREMIUM : AI_MEMORY_LIMIT_FREE
      const now = Date.now()
      const entry = memoryAiLimit.get(user.id)
      if (!entry || now > entry.resetAt) {
        memoryAiLimit.set(user.id, { count: 1, resetAt: now + AI_MEMORY_WINDOW_MS })
        return { allowed: true, userId: user.id }
      }
      entry.count++
      if (entry.count > limit) {
        success = false
        reset = entry.resetAt
      } else {
        return { allowed: true, userId: user.id }
      }
    }
  }

  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: user.subscriptionTier === "premium"
            ? "Daily AI limit reached. Please try again tomorrow."
            : "Daily AI limit reached. Upgrade to Premium for more requests.",
          remaining: 0,
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "Retry-After": retryAfterSeconds.toString(),
          },
        }
      ),
    }
  }

  return { allowed: true, userId: user.id }
}

/**
 * Log API usage to the database for tracking.
 */
export async function logApiUsage(userId: string, endpoint: string, tokens: number = 0) {
  try {
    await prisma.apiUsage.create({
      data: { userId, endpoint, tokens },
    })
  } catch (error) {
    // Don't fail the request if logging fails
    console.error("Failed to log API usage:", error)
  }
}

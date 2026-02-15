import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { aiLimiterFree, aiLimiterPremium } from "./limiter"

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

  // If Redis is not configured, allow the request (graceful fallback)
  if (!aiLimiterFree || !aiLimiterPremium) {
    return { allowed: true, userId: user.id }
  }

  const limiter = user.subscriptionTier === "premium" ? aiLimiterPremium : aiLimiterFree
  const { success, remaining, reset } = await limiter.limit(user.id)

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

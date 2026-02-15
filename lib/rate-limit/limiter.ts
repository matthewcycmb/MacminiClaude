import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

// General API rate limiter: 300 requests per hour
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, "1 h"),
      prefix: "api_general",
    })
  : null

// AI rate limiter for free tier: 15 calls per day
export const aiLimiterFree = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, "24 h"),
      prefix: "ai_free",
    })
  : null

// AI rate limiter for premium tier: 100 calls per day
export const aiLimiterPremium = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "24 h"),
      prefix: "ai_premium",
    })
  : null

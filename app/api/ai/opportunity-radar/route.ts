import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  OPPORTUNITY_RADAR_SYSTEM_PROMPT,
  buildOpportunityContext,
} from "@/lib/ai/prompts/opportunity-radar"
import { prisma } from "@/lib/db/prisma"
import { checkAiLimit } from "@/lib/rate-limit/check-ai-limit"

// Server-side in-memory cache: userId -> { data, timestamp }
const opportunityCache = new Map<
  string,
  { data: Record<string, unknown>[]; timestamp: number }
>()
const SERVER_CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_ENTRIES = 200

function setCacheEntry(key: string, data: Record<string, unknown>[]) {
  // Evict expired entries first, then oldest if still over limit
  if (opportunityCache.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now()
    for (const [k, v] of opportunityCache) {
      if (now - v.timestamp > SERVER_CACHE_TTL) opportunityCache.delete(k)
    }
    // If still over limit, delete oldest entry
    if (opportunityCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = opportunityCache.keys().next().value
      if (oldestKey) opportunityCache.delete(oldestKey)
    }
  }
  opportunityCache.set(key, { data, timestamp: Date.now() })
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit check
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
      },
    })

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding first." },
        { status: 404 }
      )
    }

    // Check server cache (skip if ?refresh=1)
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1"
    const cached = opportunityCache.get(user.id)
    if (
      !forceRefresh &&
      cached &&
      Date.now() - cached.timestamp < SERVER_CACHE_TTL
    ) {
      console.log("Opportunity Radar: serving from server cache for", user.id)
      return NextResponse.json({
        success: true,
        opportunities: cached.data,
        _cached: true,
      })
    }

    const profileData = {
      gradeLevel: user.profile.gradeLevel,
      graduationYear: user.profile.graduationYear,
      location: user.profile.location,
      gpa: user.profile.gpa,
      gpaScale: user.profile.gpaScale,
      satScore: user.profile.satScore,
      actScore: user.profile.actScore,
      intendedMajors: user.profile.intendedMajors || [],
      careerInterests: user.profile.careerInterests || [],
      extracurriculars: user.profile.extracurriculars || [],
      apCourses: user.profile.apCourses || [],
      awards: user.profile.awards || [],
      leadership: user.profile.leadership || [],
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not set — returning mock opportunities")
      return NextResponse.json({
        success: true,
        opportunities: getMockOpportunities(profileData),
        _mock: true,
      })
    }

    const userContext = buildOpportunityContext(profileData)

    const startTime = Date.now()
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: OPPORTUNITY_RADAR_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" } as never,
        },
        {
          type: "text",
          text: userContext,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate personalized opportunity recommendations for this student in JSON format. Today's date is ${new Date().toISOString().split("T")[0]}.`,
        },
      ],
    })
    const duration = Date.now() - startTime

    console.log("Opportunity Radar API Usage:", {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      durationMs: duration,
    })

    // Check if the response was truncated
    if (message.stop_reason === "max_tokens") {
      console.error("Opportunity radar response was truncated (max_tokens reached)")
      return NextResponse.json({
        success: true,
        opportunities: getMockOpportunities(profileData),
        _truncated: true,
      })
    }

    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let jsonText = content.text.trim()

    if (jsonText.includes("```json")) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    } else if (jsonText.includes("```")) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    }

    if (!jsonText.startsWith("{") && !jsonText.startsWith("[")) {
      const match = jsonText.match(/\{[\s\S]*\}/)
      if (match) jsonText = match[0]
    }

    let data
    try {
      data = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Raw response (first 500):", jsonText.substring(0, 500))
      // Fall back to mock data instead of crashing
      return NextResponse.json({
        success: true,
        opportunities: getMockOpportunities(profileData),
        _parseError: true,
      })
    }

    // Handle both {opportunities: [...]} and direct array formats
    const rawOpportunities = Array.isArray(data)
      ? data
      : data.opportunities || []

    // Validate and filter: every opportunity must have a real URL
    const validOpportunities = rawOpportunities.map(
      (opp: Record<string, unknown>) => ({
        ...opp,
        // Ensure url is always a non-empty string or null
        url:
          typeof opp.url === "string" && opp.url.startsWith("http")
            ? opp.url
            : null,
      })
    )

    // Store in server cache (bounded)
    setCacheEntry(user.id, validOpportunities)

    return NextResponse.json({
      success: true,
      opportunities: validOpportunities,
      _usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("Error generating opportunities:", error)
    return NextResponse.json(
      {
        error: "Failed to generate opportunities",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

function getMockOpportunities(profile: {
  intendedMajors?: string[]
  careerInterests?: string[]
  gradeLevel?: string | null
  location?: string | null
}) {
  const majors = profile.intendedMajors || []
  const interests = profile.careerInterests || []
  const allInterests = [...majors, ...interests].map((s) => s.toLowerCase())

  const isTech = allInterests.some((i) =>
    ["computer", "tech", "engineering", "software", "cs", "coding", "programming"].some((k) => i.includes(k))
  )
  const isScience = allInterests.some((i) =>
    ["bio", "chem", "physics", "science", "med", "health", "research"].some((k) => i.includes(k))
  )
  const isArts = allInterests.some((i) =>
    ["art", "design", "music", "theater", "film", "creative", "writing"].some((k) => i.includes(k))
  )
  const isBusiness = allInterests.some((i) =>
    ["business", "entrepreneur", "finance", "economics", "marketing"].some((k) => i.includes(k))
  )

  const opportunities = []

  if (isTech) {
    opportunities.push(
      {
        title: "USACO (USA Computing Olympiad)",
        description:
          "The premier competitive programming contest for high school students. Highly valued by top CS programs at MIT, Stanford, and CMU.",
        category: "STEM",
        type: "competition",
        matchPercentage: 95,
        deadline: "Ongoing (monthly contests)",
        icon: "terminal",
        iconColor: "indigo",
        whyMatch: "Directly aligns with your interest in computer science and technology.",
        url: "https://usaco.org",
        difficulty: "intermediate",
        scope: "national",
      },
      {
        title: "Congressional App Challenge",
        description:
          "Create an app to address a problem in your community. Winners present to Congress and get national recognition.",
        category: "STEM",
        type: "competition",
        matchPercentage: 88,
        deadline: "November 1, 2025",
        icon: "phone_iphone",
        iconColor: "blue",
        whyMatch: "Combines your coding skills with community impact.",
        url: "https://congressionalappchallenge.us",
        difficulty: "beginner",
        scope: "national",
      }
    )
  }

  if (isScience) {
    opportunities.push(
      {
        title: "Regeneron Science Talent Search",
        description:
          "America's oldest and most prestigious science and math competition for high school seniors. Winners receive up to $250,000.",
        category: "Research",
        type: "competition",
        matchPercentage: 92,
        deadline: "November 12, 2025",
        icon: "science",
        iconColor: "emerald",
        whyMatch: "Perfect for students passionate about scientific research.",
        url: "https://www.societyforscience.org/regeneron-sts/",
        difficulty: "elite",
        scope: "national",
      },
      {
        title: "Research Science Institute (RSI)",
        description:
          "A prestigious free 6-week summer research program at MIT for rising seniors. One of the most selective programs in the country.",
        category: "Research",
        type: "program",
        matchPercentage: 90,
        deadline: "January 15, 2026",
        icon: "biotech",
        iconColor: "cyan",
        whyMatch: "Provides hands-on research experience at a world-class institution.",
        url: "https://www.cee.org/programs/rsi",
        difficulty: "elite",
        scope: "national",
      }
    )
  }

  if (isArts) {
    opportunities.push(
      {
        title: "Scholastic Art & Writing Awards",
        description:
          "The nation's longest-running recognition program for creative teens. Winners earn scholarships and national exhibition.",
        category: "Arts",
        type: "competition",
        matchPercentage: 89,
        deadline: "January 5, 2026",
        icon: "edit_note",
        iconColor: "rose",
        whyMatch: "Aligns with your creative interests and builds your arts portfolio.",
        url: "https://www.artandwriting.org",
        difficulty: "intermediate",
        scope: "national",
      }
    )
  }

  if (isBusiness) {
    opportunities.push(
      {
        title: "DECA International Career Development Conference",
        description:
          "Compete in business-related challenges covering marketing, finance, hospitality, and management. Top performers earn college scholarships.",
        category: "Business",
        type: "competition",
        matchPercentage: 91,
        deadline: "Ongoing (through local chapters)",
        icon: "business_center",
        iconColor: "amber",
        whyMatch: "Directly supports your business and entrepreneurship interests.",
        url: "https://www.deca.org",
        difficulty: "intermediate",
        scope: "national",
      }
    )
  }

  // Always include these general opportunities
  opportunities.push(
    {
      title: "National Honor Society",
      description:
        "Demonstrates academic excellence, leadership, service, and character. Recognized by virtually all college admissions offices.",
      category: "Leadership",
      type: "milestone",
      matchPercentage: 82,
      deadline: "Ongoing (school-based)",
      icon: "groups",
      iconColor: "cyan",
      whyMatch: "Strengthens your leadership profile and demonstrates well-roundedness.",
      url: "https://www.nhs.us",
      difficulty: "beginner",
      scope: "local",
    },
    {
      title: "QuestBridge National College Match",
      description:
        "Connects high-achieving, low-income students with full four-year scholarships to top colleges including Yale, Stanford, and MIT.",
      category: "Service",
      type: "scholarship",
      matchPercentage: 75,
      deadline: "September 26, 2025",
      icon: "school",
      iconColor: "purple",
      whyMatch: "Provides access to top-tier college scholarships for qualified students.",
      url: "https://www.questbridge.org",
      difficulty: "advanced",
      scope: "national",
    },
    {
      title: "AMC/AIME Math Competitions",
      description:
        "A series of increasingly challenging math competitions run by the Mathematical Association of America. Strong performance (especially AIME qualification) is highly valued by STEM programs.",
      category: "STEM",
      type: "competition",
      matchPercentage: 78,
      deadline: "November 2025",
      icon: "functions",
      iconColor: "amber",
      whyMatch: "Demonstrates quantitative problem-solving ability valued by top schools.",
      url: "https://www.maa.org/math-competitions",
      difficulty: "intermediate",
      scope: "national",
    },
    {
      title: "Key Club International",
      description:
        "The oldest and largest service program for high school students. Build leadership skills through community service projects and develop a track record of civic engagement.",
      category: "Leadership",
      type: "program",
      matchPercentage: 72,
      deadline: "Ongoing (through local chapters)",
      icon: "public",
      iconColor: "cyan",
      whyMatch: "Builds leadership skills and community impact — key factors in admissions.",
      url: "https://www.keyclub.org",
      difficulty: "beginner",
      scope: "local",
    },
    {
      title: "VolunteerMatch",
      description:
        "Find meaningful volunteer opportunities in your community matched to your interests and skills. Sustained service demonstrates character and commitment to making a difference.",
      category: "Service",
      type: "volunteering",
      matchPercentage: 68,
      deadline: "Ongoing",
      icon: "volunteer_activism",
      iconColor: "emerald",
      whyMatch: "Shows community engagement and personal growth — essential for well-rounded applications.",
      url: "https://www.volunteermatch.org",
      difficulty: "beginner",
      scope: "local",
    }
  )

  // Add location-based opportunities
  const location = profile.location || ""
  if (location) {
    opportunities.push(
      {
        title: `${location} Regional Science Fair`,
        description: `Compete in the regional science fair serving the ${location} area. Winners advance to state and international levels. An excellent way to showcase original research locally.`,
        category: "Research",
        type: "competition",
        matchPercentage: 80,
        deadline: "Ongoing (check local chapter)",
        icon: "science",
        iconColor: "emerald",
        whyMatch: `A regional opportunity near ${location} that demonstrates research initiative to admissions officers.`,
        url: "https://www.societyforscience.org/isef/",
        difficulty: "intermediate",
        scope: "regional",
      },
      {
        title: `${location} Community Youth Council`,
        description: `Join a local youth advisory council in the ${location} area. Advise local government on youth issues, plan community events, and develop real leadership experience.`,
        category: "Leadership",
        type: "program",
        matchPercentage: 76,
        deadline: "Rolling admissions",
        icon: "groups",
        iconColor: "cyan",
        whyMatch: `Local leadership in ${location} shows deep community roots — highly valued by admissions officers.`,
        url: "https://www.youthgovt.org",
        difficulty: "beginner",
        scope: "local",
      },
      {
        title: `Habitat for Humanity — ${location} Chapter`,
        description: `Build homes and hope in the ${location} community. Sustained volunteering with Habitat shows commitment to service and hands-on community impact.`,
        category: "Service",
        type: "volunteering",
        matchPercentage: 74,
        deadline: "Ongoing",
        icon: "volunteer_activism",
        iconColor: "emerald",
        whyMatch: `Local service in ${location} demonstrates genuine community commitment beyond just padding a resume.`,
        url: "https://www.habitat.org",
        difficulty: "beginner",
        scope: "local",
      }
    )
  }

  // Sort by match percentage descending
  return opportunities.sort((a, b) => b.matchPercentage - a.matchPercentage)
}

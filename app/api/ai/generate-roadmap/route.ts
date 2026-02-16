import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import { ROADMAP_SYSTEM_PROMPT, buildUserContext } from "@/lib/ai/prompts/roadmap-generator"
import { prisma } from "@/lib/db/prisma"
import { checkAiLimit, logApiUsage } from "@/lib/rate-limit/check-ai-limit"

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    // Get user session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile from database with colleges
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        StudentCollege: {
          include: {
            College: true,
          },
        },
      },
    })

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding first." },
        { status: 404 }
      )
    }

    // Build profile data from database
    const profileData = {
      gradeLevel: user.profile.gradeLevel || "11",
      graduationYear: user.profile.graduationYear || new Date().getFullYear() + 2,
      location: user.profile.location || "United States",
      gpa: user.profile.gpa || 0,
      gpaScale: user.profile.gpaScale || 4.0,
      satScore: user.profile.satScore ?? undefined,
      actScore: user.profile.actScore ?? undefined,
      intendedMajors: user.profile.intendedMajors || [],
      careerInterests: user.profile.careerInterests || [],
      extracurriculars: user.profile.extracurriculars || [],
    }

    // Extract college list
    const colleges = user.StudentCollege.map((sc) => ({
      name: sc.College.name,
      type: sc.College.type,
      acceptanceRate: sc.College.acceptanceRate,
      listCategory: sc.listCategory,
      readinessPercentage: sc.readinessPercentage,
      applicationDeadline: sc.College.applicationDeadlineRegular,
    }))

    console.log("Generating roadmap for profile:", profileData)
    console.log("Student has", colleges.length, "colleges selected")

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("CRITICAL: ANTHROPIC_API_KEY not set - returning mock roadmap")
      console.error("Check: 1) .env file exists, 2) dev server restarted, 3) no .env.local override")
      return NextResponse.json({
        success: false,
        error: "AI service not configured - API key missing",
        message: "The development server may need to be restarted to load environment variables",
        roadmap: getMockRoadmap(),
      })
    }

    // Build context with prompt caching
    const userContext = buildUserContext(profileData, colleges)

    // Log what data is being sent to AI
    console.log("User context preview:", userContext.substring(0, 300))
    console.log("Profile summary:", {
      grade: profileData.gradeLevel,
      gpa: profileData.gpa,
      majors: profileData.intendedMajors,
      numColleges: colleges.length
    })

    // Generate unique request ID to prevent caching
    const requestId = crypto.randomUUID()
    console.log(`Roadmap generation request ID: ${requestId}`)

    // Call Claude API with timing
    const startTime = Date.now()
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      system: [
        {
          type: "text",
          text: ROADMAP_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" } as any, // Cache system prompt only
        },
        {
          type: "text",
          text: userContext,
          // User context is NOT cached because:
          // 1. Each user has different profile data
          // 2. Profile data changes when users update their information
          // 3. Caching would cause stale/incorrect personalization
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate my personalized college application roadmap in JSON format.\n\nRequest ID: ${requestId}\nGeneration requested at: ${new Date().toISOString()}`,
        },
      ],
    })
    const duration = Date.now() - startTime

    // Log API usage and cache statistics
    console.log("API Usage:", {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheCreationTokens: (message.usage as any).cache_creation_input_tokens || 0,
      cacheReadTokens: (message.usage as any).cache_read_input_tokens || 0,
      durationMs: duration
    })
    console.log(`Roadmap generated in ${duration}ms`)

    // Parse AI response
    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    // Extract JSON from response
    let jsonText = content.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.includes("```json")) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    } else if (jsonText.includes("```")) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    }

    // Try to find JSON object if wrapped in text
    if (!jsonText.startsWith("{")) {
      const match = jsonText.match(/\{[\s\S]*\}/)
      if (match) jsonText = match[0]
    }

    console.log("Attempting to parse JSON (first 500 chars):", jsonText.substring(0, 500))

    let roadmapData
    try {
      roadmapData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Failed JSON (first 1000 chars):", jsonText.substring(0, 1000))
      throw new Error(`Failed to parse Claude's response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`)
    }

    console.log("Roadmap generated successfully:", roadmapData.roadmap.title)

    // TODO: Save to database
    // const userId = await getUserIdFromSession(req)
    // await saveRoadmapToDatabase(userId, roadmapData)

    return NextResponse.json({
      success: true,
      roadmap: roadmapData.roadmap,
      _usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    })
  } catch (error) {
    console.error("Error generating roadmap:", error)
    return NextResponse.json(
      { error: "Failed to generate roadmap", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

function getMockRoadmap() {
  return {
    title: "Your College Application Roadmap",
    description: "Personalized plan for Junior Year student",
    phases: [
      {
        title: "Junior Year Spring (Now - June 2026)",
        description: "Focus on testing, college research, and building your profile",
        startDate: new Date().toISOString(),
        endDate: new Date(2026, 5, 30).toISOString(),
        tasks: [
          {
            title: "Browse 10 colleges on Common App",
            description: "Explore different types of schools to understand what you're looking for",
            category: "research",
            priority: "medium",
            dueDate: null,
            isQuickWin: true,
            pointsValue: 10,
          },
          {
            title: "Take SAT or ACT practice test",
            description: "Establish baseline score and identify areas for improvement",
            category: "testing",
            priority: "high",
            dueDate: new Date(2026, 3, 15).toISOString(),
            isQuickWin: false,
            pointsValue: 25,
          },
          {
            title: "Research 10 Computer Science programs",
            description: "Look for schools with strong CS programs that match your profile",
            category: "research",
            priority: "medium",
            dueDate: null,
            isQuickWin: false,
            pointsValue: 25,
          },
        ],
      },
    ],
  }
}

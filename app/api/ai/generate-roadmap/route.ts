import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import { ROADMAP_SYSTEM_PROMPT, buildUserContext } from "@/lib/ai/prompts/roadmap-generator"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: NextRequest) {
  try {
    // TODO: Get user ID and profile from session
    // For now, use mock data
    const mockProfile = {
      gradeLevel: "11",
      graduationYear: 2026,
      location: "Los Angeles, CA",
      gpa: 3.8,
      gpaScale: 4.0,
      satScore: 1450,
      intendedMajors: ["Computer Science"],
      careerInterests: ["Software Engineering"],
    }

    console.log("Generating roadmap for profile:", mockProfile)

    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("ANTHROPIC_API_KEY not set, returning mock roadmap")
      return NextResponse.json({
        success: true,
        message: "Mock roadmap generated (API key not configured)",
        roadmap: getMockRoadmap(),
      })
    }

    // Build context with prompt caching
    const userContext = buildUserContext(mockProfile)

    // Call Claude API
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: ROADMAP_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" } as any, // Cache system prompt
        },
        {
          type: "text",
          text: userContext,
          cache_control: { type: "ephemeral" } as any, // Cache user context
        },
      ],
      messages: [
        {
          role: "user",
          content: "Generate my personalized college application roadmap in JSON format.",
        },
      ],
    })

    // Parse AI response
    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").trim()
    }

    const roadmapData = JSON.parse(jsonText)

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

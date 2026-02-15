import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import { EXTRACURRICULAR_SYSTEM_PROMPT, type ExtracurricularActivity } from "@/lib/ai/prompts/extracurricular-structurer"
import { checkAiLimit } from "@/lib/rate-limit/check-ai-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    const { transcript } = await request.json()

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("⚠️  ANTHROPIC_API_KEY not configured, using mock data")

      // Return mock structured data
      const mockActivities: ExtracurricularActivity[] = [
        {
          name: "Robotics Club",
          role: "President",
          category: "academic",
          hoursPerWeek: 10,
          yearsParticipated: 2,
          description: "Lead the school robotics club, organizing meetings and coordinating team projects for regional competitions."
        },
        {
          name: "Community Library Volunteer",
          role: "Volunteer",
          category: "community_service",
          hoursPerWeek: 3,
          yearsParticipated: 1,
          description: "Volunteer at the local library on weekends, assisting with book organization and helping patrons find resources."
        }
      ]

      return NextResponse.json({ activities: mockActivities })
    }

    // Call Claude API to structure the extracurriculars
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent structured output
      system: EXTRACURRICULAR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: transcript,
        },
      ],
    })

    // Parse the response
    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let activities: ExtracurricularActivity[]
    try {
      activities = JSON.parse(content.text)
    } catch (parseError) {
      console.error("Failed to parse Claude response:", content.text)
      throw new Error("Failed to parse structured activities from AI response")
    }

    // Validate the structure
    if (!Array.isArray(activities)) {
      throw new Error("AI response is not an array")
    }

    // Validate each activity has required fields
    const validActivities = activities.filter((activity) => {
      return (
        activity.name &&
        activity.role &&
        activity.category &&
        typeof activity.hoursPerWeek === "number" &&
        typeof activity.yearsParticipated === "number" &&
        activity.description
      )
    })

    return NextResponse.json({ activities: validActivities })
  } catch (error) {
    console.error("Error structuring extracurriculars:", error)
    return NextResponse.json(
      {
        error: "Failed to structure extracurriculars",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

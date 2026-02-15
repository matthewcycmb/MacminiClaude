import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  ACTIVITY_ORGANIZER_SYSTEM_PROMPT,
  type OrganizedActivity,
} from "@/lib/ai/prompts/activity-organizer"
import { checkAiLimit, logApiUsage } from "@/lib/rate-limit/check-ai-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("ANTHROPIC_API_KEY not configured, using mock data")

      const mockActivity: OrganizedActivity = {
        name: "Robotics Club",
        role: "Lead Programmer",
        category: "academic",
        hoursPerWeek: 10,
        yearsParticipated: 2,
        description:
          "Lead the programming team for the school's competitive robotics club, developing robot control software and mentoring underclassmen.",
        achievements: [
          "Led programming team to Regional Championship victory",
          "Mentored 8 freshman programmers in Python and Java fundamentals",
          "Implemented version control workflow that reduced software bugs by 40%",
        ],
        status: "ongoing",
      }

      return NextResponse.json({ activity: mockActivity })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.3,
      system: ACTIVITY_ORGANIZER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let parsed: OrganizedActivity | { error: string }
    try {
      // Strip markdown code fences if present
      let jsonText = content.text.trim()
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      }
      parsed = JSON.parse(jsonText)
    } catch {
      console.error("Failed to parse Claude response:", content.text)
      throw new Error("Failed to parse organized activity from AI response")
    }

    if ("error" in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 422 }
      )
    }

    // Validate required fields
    const activity = parsed as OrganizedActivity
    if (!activity.name || !activity.role || !activity.category) {
      throw new Error("AI response missing required fields")
    }

    // Ensure achievements is an array
    if (!Array.isArray(activity.achievements)) {
      activity.achievements = []
    }

    // Log usage
    if (limitResult.userId) {
      const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      await logApiUsage(limitResult.userId, "/api/ai/organize-activity", totalTokens)
    }

    return NextResponse.json({ activity })
  } catch (error) {
    console.error("Error organizing activity:", error)
    return NextResponse.json(
      {
        error: "Failed to organize activity",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

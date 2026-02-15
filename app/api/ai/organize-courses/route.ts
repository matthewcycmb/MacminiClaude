import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  ACADEMIC_ORGANIZER_SYSTEM_PROMPT,
  type OrganizedCourse,
} from "@/lib/ai/prompts/academic-organizer"
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

      const mockCourses: OrganizedCourse[] = [
        {
          name: "AP Calculus BC",
          type: "AP",
          semester: null,
          year: null,
          status: "in_progress",
          letterGrade: "A",
          percentage: 95,
          credits: 1.0,
          iconColor: "blue",
        },
      ]

      return NextResponse.json({ courses: mockCourses })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.3,
      system: ACADEMIC_ORGANIZER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let parsed: { courses: OrganizedCourse[] } | { error: string }
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      }
      parsed = JSON.parse(jsonText)
    } catch {
      console.error("Failed to parse Claude response:", content.text)
      throw new Error("Failed to parse organized courses from AI response")
    }

    if ("error" in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 422 }
      )
    }

    const courses = (parsed as { courses: OrganizedCourse[] }).courses
    if (!Array.isArray(courses) || courses.length === 0) {
      throw new Error("AI response contained no courses")
    }

    // Validate each course has at least a name
    for (const course of courses) {
      if (!course.name) {
        throw new Error("AI response contains a course without a name")
      }
    }

    // Log usage
    if (limitResult.userId) {
      const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      await logApiUsage(limitResult.userId, "/api/ai/organize-courses", totalTokens)
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Error organizing courses:", error)
    return NextResponse.json(
      {
        error: "Failed to organize courses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

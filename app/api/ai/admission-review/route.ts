import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  ADMISSION_REVIEW_SYSTEM_PROMPT,
  type AdmissionReview,
} from "@/lib/ai/prompts/admission-review"
import { checkAiLimit, logApiUsage } from "@/lib/rate-limit/check-ai-limit"

export async function GET() {
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
        courses: true,
        StudentCollege: {
          include: { College: true },
        },
      },
    })

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "Profile not found. Complete onboarding first." },
        { status: 404 }
      )
    }

    const profile = user.profile

    // Check for cached review (less than 24 hours old)
    if (profile.admissionReview && profile.admissionReviewAt) {
      const hoursSinceReview =
        (Date.now() - new Date(profile.admissionReviewAt).getTime()) / (1000 * 60 * 60)
      if (hoursSinceReview < 24) {
        return NextResponse.json({
          review: profile.admissionReview as unknown as AdmissionReview,
          cached: true,
          generatedAt: profile.admissionReviewAt,
        })
      }
    }

    // Build context for the AI
    const courses = user.courses
    const colleges = user.StudentCollege

    const extracurriculars = Array.isArray(profile.extracurriculars)
      ? (profile.extracurriculars as Array<Record<string, unknown>>)
      : []

    const contextParts: string[] = []

    // Academics
    contextParts.push("=== ACADEMIC PROFILE ===")
    if (profile.gpa) {
      contextParts.push(`GPA: ${profile.gpa}/${profile.gpaScale || 4.0}`)
    }
    if (profile.satScore) contextParts.push(`SAT Score: ${profile.satScore}`)
    if (profile.actScore) contextParts.push(`ACT Score: ${profile.actScore}`)
    if (profile.gradeLevel) contextParts.push(`Grade Level: ${profile.gradeLevel}`)
    if (profile.graduationYear) contextParts.push(`Graduation Year: ${profile.graduationYear}`)

    if (courses.length > 0) {
      contextParts.push(`\nCurrent Courses (${courses.length}):`)
      for (const c of courses) {
        const grade = c.letterGrade ? ` — Grade: ${c.letterGrade}` : ""
        const pct = c.percentage ? ` (${c.percentage}%)` : ""
        contextParts.push(`  - ${c.type ? c.type + " " : ""}${c.name}${grade}${pct}`)
      }
    }

    if (profile.apCourses.length > 0) {
      contextParts.push(`\nAP Courses: ${profile.apCourses.join(", ")}`)
    }
    if (profile.honors.length > 0) {
      contextParts.push(`Honors: ${profile.honors.join(", ")}`)
    }
    if (profile.awards.length > 0) {
      contextParts.push(`Awards: ${profile.awards.join(", ")}`)
    }

    // Extracurriculars
    if (extracurriculars.length > 0) {
      contextParts.push("\n=== EXTRACURRICULAR ACTIVITIES ===")
      for (const ec of extracurriculars) {
        const hours = ec.hoursPerWeek ? `${ec.hoursPerWeek} hrs/week` : ""
        const years = ec.yearsParticipated ? `${ec.yearsParticipated} years` : ""
        const role = ec.role ? ` (${ec.role})` : ""
        contextParts.push(`  - ${ec.name}${role}: ${[hours, years].filter(Boolean).join(", ")}`)
        if (ec.description) contextParts.push(`    ${ec.description}`)
        if (Array.isArray(ec.achievements) && ec.achievements.length > 0) {
          contextParts.push(`    Achievements: ${ec.achievements.join("; ")}`)
        }
      }
    }

    if (profile.leadership.length > 0) {
      contextParts.push(`\nLeadership Roles: ${profile.leadership.join(", ")}`)
    }

    // Goals
    if (profile.intendedMajors.length > 0 || profile.careerInterests.length > 0) {
      contextParts.push("\n=== GOALS & INTERESTS ===")
      if (profile.intendedMajors.length > 0) {
        contextParts.push(`Intended Majors: ${profile.intendedMajors.join(", ")}`)
      }
      if (profile.careerInterests.length > 0) {
        contextParts.push(`Career Interests: ${profile.careerInterests.join(", ")}`)
      }
    }

    // Target colleges
    if (colleges.length > 0) {
      contextParts.push("\n=== TARGET COLLEGES ===")
      for (const sc of colleges) {
        const category = sc.listCategory ? ` [${sc.listCategory}]` : ""
        contextParts.push(`  - ${sc.College.name}${category}`)
      }
    }

    const profileContext = contextParts.join("\n")

    if (!process.env.ANTHROPIC_API_KEY) {
      const mockReview: AdmissionReview = {
        summary:
          "This student shows promise but needs to develop a clearer narrative thread. The academic foundation is there, but top-30 schools will want to see more depth in extracurriculars.",
        strengths: [
          "Solid GPA foundation that shows consistent academic effort",
          "Course selection shows willingness to challenge themselves",
        ],
        weaknesses: [
          "Extracurricular profile lacks a clear 'spike' — admissions officers want to see deep commitment in one area rather than surface-level involvement in many",
          "No standardized test scores on file, which limits competitiveness at test-required schools",
        ],
        improvements: [
          "Take a leadership role in your strongest extracurricular within the next semester",
          "Register for the SAT/ACT and aim for a score in the 75th percentile of your target schools",
          "Start a personal project related to your intended major to demonstrate genuine passion",
        ],
      }
      return NextResponse.json({ review: mockReview, cached: false, generatedAt: new Date() })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      temperature: 0.4,
      system: ADMISSION_REVIEW_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Please review this student's college application profile and provide your honest assessment:\n\n${profileContext}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let parsed: AdmissionReview
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
      }
      parsed = JSON.parse(jsonText)
    } catch {
      console.error("Failed to parse admission review:", content.text)
      throw new Error("Failed to parse admission review from AI response")
    }

    // Validate
    if (!parsed.summary || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.weaknesses) || !Array.isArray(parsed.improvements)) {
      throw new Error("AI response missing required fields")
    }

    // Cache the review on the profile
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        admissionReview: JSON.parse(JSON.stringify(parsed)),
        admissionReviewAt: new Date(),
      },
    })

    // Log usage
    const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
    await logApiUsage(user.id, "/api/ai/admission-review", totalTokens)

    return NextResponse.json({
      review: parsed,
      cached: false,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error("Error generating admission review:", error)
    return NextResponse.json(
      {
        error: "Failed to generate admission review",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

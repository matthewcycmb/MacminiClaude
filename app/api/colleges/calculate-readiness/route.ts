import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  READINESS_CALCULATOR_SYSTEM_PROMPT,
  type ReadinessAssessment,
  type ReadinessCalculationInput,
} from "@/lib/ai/prompts/readiness-calculator"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studentCollegeId } = await request.json()

    if (!studentCollegeId) {
      return NextResponse.json(
        { error: "Student college ID is required" },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the student college relationship with college data
    const studentCollege = await prisma.studentCollege.findFirst({
      where: {
        id: studentCollegeId,
        userId: user.id,
      },
      include: {
        College: true,
      },
    })

    if (!studentCollege) {
      return NextResponse.json(
        { error: "College not found in your list" },
        { status: 404 }
      )
    }

    const college = studentCollege.College
    const profile = user.profile

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("⚠️  ANTHROPIC_API_KEY not configured, using mock data")

      // Return mock readiness data
      const mockAssessment: ReadinessAssessment = {
        readinessPercentage: 68,
        category: "target",
        scores: {
          academics: 28,
          testScores: 19,
          extracurriculars: 15,
          applicationProgress: 5,
        },
        strengths: [
          "Your GPA is competitive for this college",
          "You have meaningful extracurricular involvement",
          "You've completed your profile setup",
        ],
        gaps: [
          "Test scores could be stronger to reach the 75th percentile",
          "Consider adding more leadership roles to your activities",
        ],
        nextSteps: [
          "Complete the college's supplemental essays",
          "Consider retaking standardized tests if below college's median",
          "Add one more extracurricular in a different category",
          "Research this college's specific programs that match your interests",
        ],
      }

      // Update database with mock data
      await prisma.studentCollege.update({
        where: { id: studentCollegeId },
        data: {
          readinessPercentage: mockAssessment.readinessPercentage,
          listCategory: mockAssessment.category,
          lastReadinessUpdate: new Date(),
        },
      })

      return NextResponse.json({ assessment: mockAssessment })
    }

    // Prepare input for AI
    const calculationInput: ReadinessCalculationInput = {
      student: {
        gpa: profile?.gpa ?? undefined,
        gpaScale: profile?.gpaScale ?? 4.0,
        satScore: profile?.satScore ?? undefined,
        actScore: profile?.actScore ?? undefined,
        extracurriculars: profile?.extracurriculars
          ? (profile.extracurriculars as any)
          : undefined,
        gradeLevel: profile?.gradeLevel ?? undefined,
        intendedMajors: profile?.intendedMajors ?? undefined,
      },
      college: {
        name: college.name,
        avgGPA: college.avgGPA ?? undefined,
        gpa25thPercentile: college.gpa25thPercentile ?? undefined,
        gpa75thPercentile: college.gpa75thPercentile ?? undefined,
        sat25thPercentile: college.sat25thPercentile ?? undefined,
        sat75thPercentile: college.sat75thPercentile ?? undefined,
        act25thPercentile: college.act25thPercentile ?? undefined,
        act75thPercentile: college.act75thPercentile ?? undefined,
        acceptanceRate: college.acceptanceRate ?? undefined,
        type: college.type,
      },
    }

    // Call Claude API to calculate readiness
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      temperature: 0.3, // Lower temperature for consistent structured output
      system: READINESS_CALCULATOR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify(calculationInput, null, 2),
        },
      ],
    })

    // Parse the response
    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let assessment: ReadinessAssessment
    try {
      assessment = JSON.parse(content.text)
    } catch (parseError) {
      console.error("Failed to parse Claude response:", content.text)
      throw new Error("Failed to parse readiness assessment from AI response")
    }

    // Validate the structure
    if (
      typeof assessment.readinessPercentage !== "number" ||
      !assessment.category ||
      !assessment.scores ||
      !Array.isArray(assessment.strengths) ||
      !Array.isArray(assessment.gaps) ||
      !Array.isArray(assessment.nextSteps)
    ) {
      throw new Error("Invalid assessment structure from AI")
    }

    // Update StudentCollege with calculated readiness
    await prisma.studentCollege.update({
      where: { id: studentCollegeId },
      data: {
        readinessPercentage: assessment.readinessPercentage,
        listCategory: assessment.category,
        lastReadinessUpdate: new Date(),
      },
    })

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error calculating readiness:", error)
    return NextResponse.json(
      {
        error: "Failed to calculate readiness",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

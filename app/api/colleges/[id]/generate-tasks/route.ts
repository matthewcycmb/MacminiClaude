import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  COLLEGE_TASK_GENERATOR_SYSTEM_PROMPT,
  type CollegeTaskGenerationResult,
  type CollegeTaskGenerationInput,
  buildCollegeTaskContext,
} from "@/lib/ai/prompts/college-task-generator"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: studentCollegeId } = await params

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

      // Return mock college tasks
      const mockResult: CollegeTaskGenerationResult = {
        tasks: [
          {
            title: `Watch ${college.name} virtual tour (quick win)`,
            description: `Take ${college.name}'s virtual campus tour to get familiar with facilities, student life, and academic buildings.`,
            category: "visits",
            priority: "medium",
            dueDate: null,
            isQuickWin: true,
            pointsValue: 10,
            estimatedMinutes: 12,
            resources: [`${college.name} virtual tour`, "admissions website"],
          },
          {
            title: `Research ${college.name} programs in ${profile?.intendedMajors?.[0] || "your major"}`,
            description: `Explore ${college.name}'s academic programs, faculty, and research opportunities that align with your interests. You'll reference these in your essays.`,
            category: "research",
            priority: "high",
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            isQuickWin: false,
            pointsValue: 25,
            estimatedMinutes: 60,
            resources: [`${college.name} academic programs`, "department website"],
          },
          {
            title: `Draft 'Why ${college.name}' supplemental essay`,
            description: `Write your first draft of the 'Why ${college.name}' essay. Focus on specific programs, professors, and opportunities that excite you. Be authentic and specific.`,
            category: "essays",
            priority: "high",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isQuickWin: false,
            pointsValue: 50,
            estimatedMinutes: 120,
            resources: ["Common App portal", "supplemental essay guide"],
          },
          {
            title: `Attend ${college.name} virtual information session`,
            description: `Register for and attend a virtual info session. Prepare 2-3 questions about academics, student life, or specific programs you're interested in.`,
            category: "visits",
            priority: "medium",
            dueDate: null,
            isQuickWin: false,
            pointsValue: 25,
            estimatedMinutes: 75,
            resources: [`${college.name} admissions events`],
          },
          {
            title: `Connect with current ${college.name} student`,
            description: `Find a current student on LinkedIn or through your network. Ask about their experience, particularly in your intended major. Be respectful and specific in your questions.`,
            category: "networking",
            priority: "low",
            dueDate: null,
            isQuickWin: false,
            pointsValue: 25,
            estimatedMinutes: 30,
            resources: ["LinkedIn", "college student directory"],
          },
          {
            title: `Complete ${college.name} application sections`,
            description: `Fill out all required sections in the Common App or college-specific application. Double-check deadlines and requirements.`,
            category: "applications",
            priority: "urgent",
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            isQuickWin: false,
            pointsValue: 50,
            estimatedMinutes: 90,
            resources: ["Application portal", "checklist"],
          },
        ],
        applicationDeadline: college.applicationDeadline || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        essayPrompts: [
          {
            prompt: `Why do you want to attend ${college.name}? What specific programs, opportunities, or aspects of the college community appeal to you?`,
            wordLimit: 250,
            type: "why_this_college",
          },
          {
            prompt: `Describe how your background, interests, or experiences would contribute to the ${college.name} community.`,
            wordLimit: 300,
            type: "supplemental",
          },
        ],
        collegeSpecificNotes: `${college.name} has a ${college.acceptanceRate ? `${college.acceptanceRate}% acceptance rate` : 'competitive admissions process'}. Focus on demonstrating genuine interest through specific research and authentic essays. Pay close attention to application deadlines and requirements.`,
      }

      // Create tasks in database
      const createdTasks = await Promise.all(
        mockResult.tasks.map((task) =>
          prisma.task.create({
            data: {
              title: task.title,
              description: task.description,
              category: task.category as any,
              priority: task.priority as any,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              isQuickWin: task.isQuickWin,
              pointsValue: task.pointsValue,
              status: "pending",
              userId: user.id,
              collegeId: college.id,
            },
          })
        )
      )

      return NextResponse.json({
        result: mockResult,
        tasksCreated: createdTasks.length,
      })
    }

    // Prepare input for AI
    const generationInput: CollegeTaskGenerationInput = {
      student: {
        gradeLevel: profile?.gradeLevel ?? undefined,
        graduationYear: profile?.graduationYear ?? undefined,
        gpa: profile?.gpa ?? undefined,
        gpaScale: profile?.gpaScale ?? 4.0,
        satScore: profile?.satScore ?? undefined,
        actScore: profile?.actScore ?? undefined,
        extracurriculars: profile?.extracurriculars
          ? (profile.extracurriculars as any)
          : undefined,
        intendedMajors: profile?.intendedMajors ?? undefined,
        careerInterests: profile?.careerInterests ?? undefined,
      },
      college: {
        id: college.id,
        name: college.name,
        location: college.location ?? undefined,
        type: college.type,
        acceptanceRate: college.acceptanceRate ?? undefined,
        avgGPA: college.avgGPA ?? undefined,
        sat25thPercentile: college.sat25thPercentile ?? undefined,
        sat75thPercentile: college.sat75thPercentile ?? undefined,
        applicationDeadline: college.applicationDeadline ?? undefined,
        earlyDeadline: college.earlyDeadline ?? undefined,
        supplementalEssaysRequired: college.supplementalEssaysRequired ?? undefined,
      },
      readinessData: studentCollege.readinessPercentage
        ? {
            readinessPercentage: studentCollege.readinessPercentage,
            category: (studentCollege.listCategory as "reach" | "target" | "safety") ?? "target",
            gaps: [], // We don't store these in DB, but could fetch from last calculation
            nextSteps: [],
          }
        : undefined,
    }

    // Build context and call Claude API
    const contextPrompt = buildCollegeTaskContext(generationInput)

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      temperature: 0.4,
      system: COLLEGE_TASK_GENERATOR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: contextPrompt,
        },
      ],
    })

    // Parse the response
    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let result: CollegeTaskGenerationResult
    try {
      result = JSON.parse(content.text)
    } catch (parseError) {
      console.error("Failed to parse Claude response:", content.text)
      throw new Error("Failed to parse task generation result from AI response")
    }

    // Validate the structure
    if (
      !Array.isArray(result.tasks) ||
      result.tasks.length === 0 ||
      !result.applicationDeadline
    ) {
      throw new Error("Invalid task generation result structure from AI")
    }

    // Create tasks in database
    const createdTasks = await Promise.all(
      result.tasks.map((task) =>
        prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            category: task.category as any,
            priority: task.priority as any,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            isQuickWin: task.isQuickWin,
            pointsValue: task.pointsValue,
            status: "pending",
            userId: user.id,
            collegeId: college.id,
          },
        })
      )
    )

    return NextResponse.json({
      result,
      tasksCreated: createdTasks.length,
    })
  } catch (error) {
    console.error("Error generating college tasks:", error)
    return NextResponse.json(
      {
        error: "Failed to generate college tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

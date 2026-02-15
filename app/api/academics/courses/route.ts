import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

const GRADE_TO_GPA: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "D-": 0.7,
  "F": 0.0,
}

function calculateSemesterGPA(courses: Array<{ letterGrade: string | null; credits: number; status: string }>) {
  const gradedCourses = courses.filter(
    (c) => c.status !== "dropped" && c.letterGrade && GRADE_TO_GPA[c.letterGrade] !== undefined
  )

  if (gradedCourses.length === 0) return null

  let totalPoints = 0
  let totalCredits = 0
  for (const c of gradedCourses) {
    totalPoints += GRADE_TO_GPA[c.letterGrade!] * c.credits
    totalCredits += c.credits
  }

  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        courses: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = user.profile
    const courses = user.courses

    // Cumulative GPA = what the user entered during onboarding (their real cumulative)
    const cumulativeGPA = profile?.gpa ?? null

    // Semester GPA = calculated from tracked courses only
    const semesterGPA = calculateSemesterGPA(courses)

    // Build semester label from profile
    const gradeLevel = profile?.gradeLevel || "12"
    const gradeLabels: Record<string, string> = {
      "9": "Freshman Year",
      "10": "Sophomore Year",
      "11": "Junior Year",
      "12": "Senior Year",
    }
    const yearLabel = gradeLabels[gradeLevel] || "Senior Year"
    const month = new Date().getMonth()
    const semesterLabel = month >= 7 ? "Fall" : "Spring"
    const calendarYear = new Date().getFullYear()

    return NextResponse.json({
      courses,
      profile: {
        cumulativeGpa: cumulativeGPA,
        semesterGpa: semesterGPA,
        gradeLevel,
        graduationYear: profile?.graduationYear || new Date().getFullYear() + 1,
        awards: profile?.awards || [],
        satScore: profile?.satScore,
        actScore: profile?.actScore,
      },
      user: {
        name: user.name,
        image: user.image,
      },
      semesterInfo: `${semesterLabel} Semester ${calendarYear} • ${yearLabel}`,
    })
  } catch (error) {
    console.error("Error fetching academics:", error)
    return NextResponse.json({ error: "Failed to fetch academics data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { name, type, semester, year, status, letterGrade, percentage, credits, iconColor } = body

    if (!name) {
      return NextResponse.json({ error: "Course name is required" }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        userId: user.id,
        name,
        type: type || null,
        semester: semester || null,
        year: year || null,
        status: status || "in_progress",
        letterGrade: letterGrade || null,
        percentage: percentage ? parseFloat(percentage) : null,
        credits: credits ? parseFloat(credits) : 1.0,
        iconColor: iconColor || null,
      },
    })

    // Recalculate semester GPA from courses (does NOT touch profile.gpa)
    const allCourses = await prisma.course.findMany({ where: { userId: user.id } })
    const semesterGpa = calculateSemesterGPA(allCourses)

    return NextResponse.json({ course, semesterGpa }, { status: 201 })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}

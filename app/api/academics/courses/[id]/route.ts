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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const existing = await prisma.course.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const body = await req.json()
    const { name, type, semester, year, status, letterGrade, percentage, credits, iconColor } = body

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(semester !== undefined && { semester }),
        ...(year !== undefined && { year }),
        ...(status !== undefined && { status }),
        ...(letterGrade !== undefined && { letterGrade }),
        ...(percentage !== undefined && { percentage: percentage ? parseFloat(percentage) : null }),
        ...(credits !== undefined && { credits: credits ? parseFloat(credits) : 1.0 }),
        ...(iconColor !== undefined && { iconColor }),
      },
    })

    // Recalculate semester GPA (does NOT touch profile.gpa)
    const allCourses = await prisma.course.findMany({ where: { userId: user.id } })
    const semesterGpa = calculateSemesterGPA(allCourses)

    return NextResponse.json({ course, semesterGpa })
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const existing = await prisma.course.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    await prisma.course.delete({ where: { id } })

    const allCourses = await prisma.course.findMany({ where: { userId: user.id } })
    const semesterGpa = calculateSemesterGPA(allCourses)

    return NextResponse.json({ success: true, semesterGpa })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}

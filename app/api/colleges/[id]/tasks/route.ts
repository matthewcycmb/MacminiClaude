import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

// GET /api/colleges/[id]/tasks - Get tasks for a specific college
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const studentCollegeId = id

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the studentCollege to verify ownership and get collegeId
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

    // Fetch tasks for this college
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        collegeId: studentCollege.College.id,
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching college tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch college tasks" },
      { status: 500 }
    )
  }
}

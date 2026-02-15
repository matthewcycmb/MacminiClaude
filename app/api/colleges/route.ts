import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

// GET /api/colleges - Get user's selected colleges
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        StudentCollege: {
          include: {
            College: true,
          },
          orderBy: {
            priority: "desc",
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ colleges: user.StudentCollege })
  } catch (error) {
    console.error("Error fetching colleges:", error)
    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 }
    )
  }
}

// POST /api/colleges - Add college to user's list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { collegeId } = await request.json()

    if (!collegeId) {
      return NextResponse.json(
        { error: "College ID is required" },
        { status: 400 }
      )
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if college exists
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    })

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 })
    }

    // Check if user already has this college
    const existing = await prisma.studentCollege.findUnique({
      where: {
        userId_collegeId: {
          userId: user.id,
          collegeId: collegeId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "College already in your list" },
        { status: 400 }
      )
    }

    // Check college limit (12-15 max)
    const collegeCount = await prisma.studentCollege.count({
      where: { userId: user.id },
    })

    if (collegeCount >= 15) {
      return NextResponse.json(
        { error: "Maximum 15 colleges allowed. Remove a college to add more." },
        { status: 400 }
      )
    }

    // Add college to user's list
    const studentCollege = await prisma.studentCollege.create({
      data: {
        userId: user.id,
        collegeId: collegeId,
        applicationStatus: "researching",
        priority: "0",
      },
      include: {
        College: true,
      },
    })

    return NextResponse.json({ studentCollege }, { status: 201 })
  } catch (error) {
    console.error("Error adding college:", error)
    return NextResponse.json(
      { error: "Failed to add college" },
      { status: 500 }
    )
  }
}

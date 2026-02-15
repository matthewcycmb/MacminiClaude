import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

// GET /api/colleges/[id] - Get college details
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

    // Get the studentCollege with college data
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

    return NextResponse.json({ studentCollege })
  } catch (error) {
    console.error("Error fetching college details:", error)
    return NextResponse.json(
      { error: "Failed to fetch college details" },
      { status: 500 }
    )
  }
}

// DELETE /api/colleges/[id] - Remove college from user's list
export async function DELETE(
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

    // Check if this studentCollege belongs to the user
    const studentCollege = await prisma.studentCollege.findUnique({
      where: { id: studentCollegeId },
    })

    if (!studentCollege) {
      return NextResponse.json(
        { error: "College not found in your list" },
        { status: 404 }
      )
    }

    if (studentCollege.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this college" },
        { status: 403 }
      )
    }

    // Delete the studentCollege
    await prisma.studentCollege.delete({
      where: { id: studentCollegeId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting college:", error)
    return NextResponse.json(
      { error: "Failed to delete college" },
      { status: 500 }
    )
  }
}

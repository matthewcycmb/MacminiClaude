import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { Prisma } from "@prisma/client"

interface Activity {
  id: string
  name: string
  role: string
  category: string
  hoursPerWeek: number
  yearsParticipated: number
  description: string
  achievements: string[]
  status: "ongoing" | "seasonal" | "completed"
}

function normalizeActivity(raw: Record<string, unknown>): Activity {
  return {
    id: (raw.id as string) || crypto.randomUUID(),
    name: (raw.name as string) || "",
    role: (raw.role as string) || "Member",
    category: (raw.category as string) || "other",
    hoursPerWeek: (raw.hoursPerWeek as number) || 0,
    yearsParticipated: (raw.yearsParticipated as number) || 1,
    description: (raw.description as string) || "",
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    status: (["ongoing", "seasonal", "completed"].includes(raw.status as string)
      ? raw.status
      : "ongoing") as Activity["status"],
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const raw = (user.profile?.extracurriculars as Record<string, unknown>[] | null) || []
    const activities = Array.isArray(raw) ? raw.map(normalizeActivity) : []

    return NextResponse.json({ activities })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
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

    const { activities } = await req.json()

    if (!Array.isArray(activities)) {
      return NextResponse.json(
        { error: "Activities must be an array" },
        { status: 400 }
      )
    }

    const normalized = activities.map(normalizeActivity)

    await prisma.profile.update({
      where: { userId: user.id },
      data: { extracurriculars: normalized as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ success: true, activities: normalized })
  } catch (error) {
    console.error("Error saving activities:", error)
    return NextResponse.json(
      { error: "Failed to save activities" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const activityId = searchParams.get("id")

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity id is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const raw = (user.profile?.extracurriculars as Record<string, unknown>[] | null) || []
    const activities = Array.isArray(raw) ? raw.map(normalizeActivity) : []
    const filtered = activities.filter((a) => a.id !== activityId)

    await prisma.profile.update({
      where: { userId: user.id },
      data: { extracurriculars: filtered as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting activity:", error)
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    )
  }
}

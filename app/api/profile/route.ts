import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
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

    return NextResponse.json({ profile: user.profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("Profile data received:", body)

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Upsert profile (create or update)
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        gradeLevel: body.gradeLevel,
        graduationYear: body.graduationYear,
        location: body.location,
        gpa: body.gpa,
        gpaScale: body.gpaScale,
        satScore: body.satScore,
        actScore: body.actScore,
        intendedMajors: body.intendedMajors || [],
        careerInterests: body.careerInterests || [],
        extracurriculars: body.extracurriculars || null,
      },
      update: {
        gradeLevel: body.gradeLevel,
        graduationYear: body.graduationYear,
        location: body.location,
        gpa: body.gpa,
        gpaScale: body.gpaScale,
        satScore: body.satScore,
        actScore: body.actScore,
        intendedMajors: body.intendedMajors || [],
        careerInterests: body.careerInterests || [],
        extracurriculars: body.extracurriculars || null,
      },
    })

    // Update user onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        onboardingStep: 4, // Completed all steps
        totalPoints: { increment: 50 },
      },
    })

    console.log("Profile saved successfully for user:", user.email)

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully"
    })
  } catch (error) {
    console.error("Error saving profile:", error)
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    )
  }
}

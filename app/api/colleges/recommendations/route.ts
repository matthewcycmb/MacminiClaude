import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

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
        StudentCollege: { select: { collegeId: true } },
      },
    })

    if (!user?.profile) {
      return NextResponse.json({ recommendations: [] })
    }

    const profile = user.profile
    const alreadyAddedIds = new Set(user.StudentCollege.map((sc) => sc.collegeId))

    const allColleges = await prisma.college.findMany()
    const candidates = allColleges.filter((c) => !alreadyAddedIds.has(c.id))

    const scored = candidates.map((college) => {
      let fitScore = 0
      let factorsUsed = 0

      // GPA fit (0-40 points)
      if (profile.gpa && college.gpa25thPercentile && college.gpa75thPercentile) {
        const userGPA =
          profile.gpaScale === 5.0 ? (profile.gpa / 5.0) * 4.0 : profile.gpa
        const midGPA = (college.gpa25thPercentile + college.gpa75thPercentile) / 2
        const diff = Math.abs(userGPA - midGPA)
        fitScore += Math.max(0, 40 - diff * 40)
        factorsUsed++
      }

      // SAT fit (0-30 points)
      if (profile.satScore && college.sat25thPercentile && college.sat75thPercentile) {
        const midSAT = (college.sat25thPercentile + college.sat75thPercentile) / 2
        const diff = Math.abs(profile.satScore - midSAT)
        fitScore += Math.max(0, 30 - (diff / 200) * 30)
        factorsUsed++
      }

      // ACT fit (0-30 points) - only if no SAT
      if (
        !profile.satScore &&
        profile.actScore &&
        college.act25thPercentile &&
        college.act75thPercentile
      ) {
        const midACT = (college.act25thPercentile + college.act75thPercentile) / 2
        const diff = Math.abs(profile.actScore - midACT)
        fitScore += Math.max(0, 30 - (diff / 6) * 30)
        factorsUsed++
      }

      // Major alignment (0-30 points)
      if (profile.intendedMajors.length > 0 && college.strongPrograms.length > 0) {
        const userMajorsLower = profile.intendedMajors.map((m) => m.toLowerCase())
        let matchCount = 0
        for (const program of college.strongPrograms) {
          const programLower = program.toLowerCase()
          for (const major of userMajorsLower) {
            if (programLower.includes(major) || major.includes(programLower)) {
              matchCount++
              break
            }
          }
        }
        if (matchCount >= 2) fitScore += 30
        else if (matchCount >= 1) fitScore += 20
        factorsUsed++
      }

      // Normalize when fewer factors available
      if (factorsUsed > 0 && factorsUsed < 3) {
        fitScore = (fitScore / (factorsUsed * (100 / 3))) * 100
      }

      // Categorize: reach / target / safety
      let category: "reach" | "target" | "safety" = "target"

      if (profile.gpa && college.gpa25thPercentile && college.gpa75thPercentile) {
        const userGPA =
          profile.gpaScale === 5.0 ? (profile.gpa / 5.0) * 4.0 : profile.gpa

        if (userGPA < college.gpa25thPercentile) {
          category = "reach"
        } else if (userGPA >= college.gpa75thPercentile) {
          category = "safety"
        } else {
          category = "target"
        }
      } else if (college.acceptanceRate) {
        if (college.acceptanceRate < 15) category = "reach"
        else if (college.acceptanceRate < 40) category = "target"
        else category = "safety"
      }

      // Sub-10% acceptance is always a reach
      if (college.acceptanceRate && college.acceptanceRate < 10) {
        category = "reach"
      }

      return {
        id: college.id,
        name: college.name,
        shortName: college.shortName,
        location: college.location,
        type: college.type,
        acceptanceRate: college.acceptanceRate,
        avgGPA: college.avgGPA,
        strongPrograms: college.strongPrograms,
        fitScore,
        category,
      }
    })

    // Pick top 2 per category by fit score
    const reach = scored
      .filter((c) => c.category === "reach")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 2)
    const target = scored
      .filter((c) => c.category === "target")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 2)
    const safety = scored
      .filter((c) => c.category === "safety")
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 2)

    return NextResponse.json({
      recommendations: [...reach, ...target, ...safety],
    })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    )
  }
}

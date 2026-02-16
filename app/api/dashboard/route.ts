import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"

// Helper: Calculate fit score between a student profile and a college
function computeFitScore(
  profile: {
    gpa: number | null
    gpaScale: number | null
    satScore: number | null
    actScore: number | null
    intendedMajors: string[]
  },
  college: {
    gpa25thPercentile: number | null
    gpa75thPercentile: number | null
    sat25thPercentile: number | null
    sat75thPercentile: number | null
    act25thPercentile: number | null
    act75thPercentile: number | null
    acceptanceRate: number | null
    strongPrograms: string[]
  }
): number {
  let score = 0
  let factors = 0

  if (profile.gpa && college.gpa25thPercentile && college.gpa75thPercentile) {
    const userGPA = profile.gpaScale === 5.0 ? (profile.gpa / 5.0) * 4.0 : profile.gpa
    const midGPA = (college.gpa25thPercentile + college.gpa75thPercentile) / 2
    const diff = Math.abs(userGPA - midGPA)
    score += Math.max(0, 40 - diff * 40)
    factors++
  }

  if (profile.satScore && college.sat25thPercentile && college.sat75thPercentile) {
    const midSAT = (college.sat25thPercentile + college.sat75thPercentile) / 2
    const diff = Math.abs(profile.satScore - midSAT)
    score += Math.max(0, 30 - (diff / 200) * 30)
    factors++
  }

  if (!profile.satScore && profile.actScore && college.act25thPercentile && college.act75thPercentile) {
    const midACT = (college.act25thPercentile + college.act75thPercentile) / 2
    const diff = Math.abs(profile.actScore - midACT)
    score += Math.max(0, 30 - (diff / 6) * 30)
    factors++
  }

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
    if (matchCount >= 2) score += 30
    else if (matchCount >= 1) score += 20
    factors++
  }

  if (factors > 0 && factors < 3) {
    score = (score / (factors * (100 / 3))) * 100
  }

  let rawScore = Math.round(Math.min(score, 100))

  // Apply acceptance-rate ceiling so fit scores stay realistic
  if (college.acceptanceRate != null) {
    let ceiling = 100
    if (college.acceptanceRate < 10) ceiling = 40
    else if (college.acceptanceRate < 20) ceiling = 55
    else if (college.acceptanceRate < 40) ceiling = 75
    rawScore = Math.min(rawScore, ceiling)
  }

  return rawScore
}

// Helper: Categorize a college as reach/target/safety
function categorizeCollege(
  profile: {
    gpa: number | null
    gpaScale: number | null
    satScore: number | null
    actScore: number | null
  },
  college: {
    gpa25thPercentile: number | null
    gpa75thPercentile: number | null
    sat25thPercentile: number | null
    sat75thPercentile: number | null
    act25thPercentile: number | null
    act75thPercentile: number | null
    acceptanceRate: number | null
  }
): string {
  const rate = college.acceptanceRate
  const userGPA = profile.gpa
    ? profile.gpaScale === 5.0 ? (profile.gpa / 5.0) * 4.0 : profile.gpa
    : null

  const testAbove75 =
    (profile.satScore && college.sat75thPercentile && profile.satScore >= college.sat75thPercentile) ||
    (profile.actScore && college.act75thPercentile && profile.actScore >= college.act75thPercentile)
  const gpaAbove75 = userGPA && college.gpa75thPercentile && userGPA >= college.gpa75thPercentile
  const gpaAbove25 = userGPA && college.gpa25thPercentile && userGPA >= college.gpa25thPercentile

  // Under 15% acceptance = always reach
  if (rate != null && rate < 15) return "reach"
  // 15-30%: reach by default, target only if GPA AND tests above 75th
  if (rate != null && rate < 30) {
    if (gpaAbove75 && testAbove75) return "target"
    return "reach"
  }
  // 30-50%: target by default, safety only if GPA AND tests above 75th
  if (rate != null && rate < 50) {
    if (gpaAbove75 && testAbove75) return "safety"
    return "target"
  }
  // 50%+: safety if GPA above 25th, otherwise target
  if (rate != null && rate >= 50) {
    if (gpaAbove25) return "safety"
    return "target"
  }

  // Fallback when no acceptance rate data
  if (userGPA && college.gpa25thPercentile && college.gpa75thPercentile) {
    if (userGPA < college.gpa25thPercentile) return "reach"
    if (gpaAbove75 && testAbove75) return "safety"
    return "target"
  }

  return "target"
}

// Helper: Generate personalized AI insight for a college
function generateCollegeInsight(
  profile: {
    intendedMajors: string[]
    gpa: number | null
    gpaScale: number | null
    extracurriculars: unknown
  },
  college: {
    strongPrograms: string[]
    gpa25thPercentile: number | null
    gpa75thPercentile: number | null
  },
  narrativeTheme: string,
  category: string
): string {
  const userMajors = (profile.intendedMajors || []).map((m) => m.toLowerCase())
  const matchingPrograms = college.strongPrograms.filter((p) =>
    userMajors.some((m) => p.toLowerCase().includes(m) || m.includes(p.toLowerCase()))
  )

  const gpa = profile.gpa
  const normalizedGpa = profile.gpaScale === 5.0 && gpa ? (gpa / 5.0) * 4.0 : gpa
  const gpaAbove75 = normalizedGpa && college.gpa75thPercentile && normalizedGpa >= college.gpa75thPercentile
  const gpaAbove25 = normalizedGpa && college.gpa25thPercentile && normalizedGpa >= college.gpa25thPercentile

  const activities = Array.isArray(profile.extracurriculars) ? profile.extracurriculars : []
  const activityCount = activities.length

  if (matchingPrograms.length > 0 && gpaAbove75) {
    return `Strong alignment with your ${narrativeTheme} profile. Their ${matchingPrograms[0]} program matches your interests, and your academic profile places you in the top tier of admitted students.`
  }

  if (matchingPrograms.length > 0 && activityCount >= 3) {
    return `Good program fit with your ${narrativeTheme} focus. Your ${activityCount} extracurricular activities strengthen your application to their ${matchingPrograms[0]} program.`
  }

  if (matchingPrograms.length > 0) {
    return `Their ${matchingPrograms.slice(0, 2).join(" and ")} programs align with your ${narrativeTheme} interests. Highlighting your unique perspective in supplemental essays will strengthen your candidacy.`
  }

  if (gpaAbove75) {
    return `Your academic performance exceeds the 75th percentile of admitted students. A compelling ${narrativeTheme} narrative in your essays will set you apart.`
  }

  if (gpaAbove25 && activityCount >= 2) {
    return `A balanced match for your profile. Your academics and ${activityCount} extracurricular activities create a well-rounded application.`
  }

  if (category === "reach") {
    return `A competitive institution where your ${narrativeTheme} profile and dedication position you as a strong candidate. Focus on demonstrating genuine interest.`
  }

  if (category === "safety") {
    return `A strong option that complements your ${narrativeTheme} focus. You're well-positioned academically — use your application to showcase your unique story.`
  }

  return `Research their ${college.strongPrograms.slice(0, 2).join(" and ")} programs to find opportunities that align with your ${narrativeTheme} goals.`
}

// Helper: Generate a brief admissions officer perspective per college
function generateOfficerTake(
  profile: {
    gpa: number | null
    gpaScale: number | null
    satScore: number | null
    actScore: number | null
    intendedMajors: string[]
  },
  college: {
    acceptanceRate: number | null
    gpa75thPercentile: number | null
    strongPrograms: string[]
  },
  category: string
): string {
  const userGPA = profile.gpa
    ? profile.gpaScale === 5.0 ? (profile.gpa / 5.0) * 4.0 : profile.gpa
    : null
  const gpaStrong = userGPA && college.gpa75thPercentile && userGPA >= college.gpa75thPercentile
  const rateStr = college.acceptanceRate ? `${college.acceptanceRate}%` : "very low"

  const userMajors = (profile.intendedMajors || []).map((m) => m.toLowerCase())
  const hasMatch = college.strongPrograms.some((p) =>
    userMajors.some((m) => p.toLowerCase().includes(m) || m.includes(p.toLowerCase()))
  )

  if (category === "reach" && gpaStrong) {
    return `Your academics are competitive, but at ${rateStr} acceptance, you'll need standout essays and a compelling narrative to differentiate yourself.`
  }
  if (category === "reach") {
    return `This is a significant stretch at ${rateStr} acceptance. Focus on demonstrating genuine interest and a unique perspective in your application.`
  }
  if (category === "target" && hasMatch) {
    return `Good match for your interests. Your profile sits within their admitted student range — a strong application should make you competitive here.`
  }
  if (category === "target") {
    return `You're in the running here. Tailor your essays to show why this specific school fits your goals, and you'll be a solid contender.`
  }
  if (hasMatch) {
    return `You're well-positioned academically, and their ${college.strongPrograms[0]} program aligns with your interests. Show genuine enthusiasm in your application.`
  }
  return `You're well-positioned here. Use your application to show why this school specifically fits your goals — don't treat it as a backup in your essays.`
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
        StudentCollege: {
          include: {
            College: true,
          },
        },
        tasks: {
          where: { status: { not: "skipped" } },
          orderBy: { dueDate: "asc" },
          take: 10,
        },
        roadmaps: {
          where: { isActive: true },
          include: {
            phases: {
              include: { tasks: true },
              orderBy: { order: "asc" },
            },
          },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = user.profile
    const colleges = user.StudentCollege
    const tasks = user.tasks

    // === Calculate admission readiness ===
    let readinessScore = 0
    let readinessFactors = 0

    if (profile?.gpa) {
      readinessScore += Math.min((profile.gpa / 4.0) * 25, 25)
      readinessFactors++
    }
    if (profile?.satScore) {
      readinessScore += Math.min((profile.satScore / 1600) * 25, 25)
      readinessFactors++
    }
    if (profile?.extracurriculars) {
      const activities = Array.isArray(profile.extracurriculars)
        ? profile.extracurriculars
        : []
      readinessScore += Math.min(activities.length * 5, 20)
      readinessFactors++
    }
    if (colleges.length > 0) {
      readinessScore += Math.min(colleges.length * 3, 15)
      readinessFactors++
    }

    const completedTasks = tasks.filter((t) => t.status === "completed").length
    if (tasks.length > 0) {
      readinessScore += (completedTasks / tasks.length) * 15
      readinessFactors++
    }

    const readinessPercentage = readinessFactors > 0
      ? Math.round(Math.min(readinessScore, 100))
      : 0

    // === Readiness delta (estimated from recent task completions) ===
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCompletions = tasks.filter(
      (t) => t.status === "completed" && t.completedAt && new Date(t.completedAt) > thirtyDaysAgo
    ).length
    const readinessDelta = tasks.length > 0
      ? Math.round((recentCompletions / Math.max(tasks.length, 1)) * 15)
      : 0

    // === Compute total impact hours from extracurriculars ===
    let impactHours = 0
    if (profile?.extracurriculars && Array.isArray(profile.extracurriculars)) {
      for (const activity of profile.extracurriculars as Array<{ hoursPerWeek?: number; years?: number }>) {
        const weeklyHours = activity.hoursPerWeek || 0
        const years = activity.years || 0
        impactHours += Math.round(weeklyHours * 40 * years)
      }
    }

    // === Determine narrative theme from interests ===
    const majors = profile?.intendedMajors || []
    const careers = profile?.careerInterests || []
    const allInterests = [
      ...majors.map((m: string) => m.toLowerCase()),
      ...careers.map((c: string) => c.toLowerCase()),
    ]

    const hasTech = allInterests.some(
      (i) =>
        i.includes("computer") ||
        i.includes("tech") ||
        i.includes("engineering") ||
        i.includes("software")
    )
    const hasBusiness = allInterests.some(
      (i) =>
        i.includes("business") ||
        i.includes("entrepreneur") ||
        i.includes("startup") ||
        i.includes("finance")
    )
    const hasArts = allInterests.some(
      (i) =>
        i.includes("art") ||
        i.includes("design") ||
        i.includes("film") ||
        i.includes("music")
    )
    const hasHealthcare = allInterests.some(
      (i) =>
        i.includes("bio") ||
        i.includes("med") ||
        i.includes("health") ||
        i.includes("science") ||
        i.includes("research")
    )

    let narrativeTheme = "Academic Excellence"
    if (hasTech && hasBusiness) narrativeTheme = "Tech + Entrepreneurship"
    else if (hasTech) narrativeTheme = "Tech + Engineering"
    else if (hasBusiness) narrativeTheme = "Business + Leadership"
    else if (hasArts) narrativeTheme = "Creative Arts + Design"
    else if (hasHealthcare) narrativeTheme = "STEM + Healthcare"

    // === Narrative description ===
    let narrativeDescription = ""
    switch (narrativeTheme) {
      case "Tech + Engineering":
        narrativeDescription = "Focusing on high-impact engineering projects and technical research."
        break
      case "Tech + Entrepreneurship":
        narrativeDescription = "Focusing on high-impact software projects and startup initiatives."
        break
      case "Business + Leadership":
        narrativeDescription = "Focusing on leadership initiatives and strategic business projects."
        break
      case "Creative Arts + Design":
        narrativeDescription = "Focusing on creative projects and portfolio development."
        break
      case "STEM + Healthcare":
        narrativeDescription = "Focusing on research initiatives and clinical experiences."
        break
      default:
        narrativeDescription = "Focusing on academic excellence and leadership development."
    }

    if (readinessPercentage >= 70) {
      narrativeDescription += " Your profile is currently trending towards competitive Ivy+ benchmarks."
    } else if (readinessPercentage >= 50) {
      narrativeDescription += " Continue building to reach competitive benchmark levels."
    } else {
      narrativeDescription += " Focus on your next moves to strengthen your positioning."
    }

    // === Profile rank ===
    let profileRank = "B"
    if (readinessPercentage >= 90) profileRank = "A+"
    else if (readinessPercentage >= 80) profileRank = "A"
    else if (readinessPercentage >= 70) profileRank = "A-"
    else if (readinessPercentage >= 60) profileRank = "B+"
    else if (readinessPercentage >= 50) profileRank = "B"

    // === Competitiveness percentile ===
    let competitivenessPercentile = "Building"
    if (readinessPercentage >= 90) competitivenessPercentile = "Top 1%"
    else if (readinessPercentage >= 80) competitivenessPercentile = "Top 5%"
    else if (readinessPercentage >= 70) competitivenessPercentile = "Top 10%"
    else if (readinessPercentage >= 60) competitivenessPercentile = "Top 15%"
    else if (readinessPercentage >= 50) competitivenessPercentile = "Top 25%"
    else if (readinessPercentage >= 40) competitivenessPercentile = "Top 40%"

    // === Next 3 most important tasks ===
    const pendingTasks = tasks
      .filter((t) => t.status === "pending" || t.status === "in_progress")
      .slice(0, 3)

    // === Identify admission gaps ===
    const gaps: Array<{ title: string; description: string }> = []
    if (!profile?.satScore && !profile?.actScore) {
      gaps.push({
        title: "Standardized Testing",
        description: "No SAT or ACT scores on file. Register for upcoming test dates.",
      })
    }
    if (!profile?.extracurriculars || (Array.isArray(profile.extracurriculars) && (profile.extracurriculars as unknown[]).length < 3)) {
      gaps.push({
        title: "Extracurricular Depth",
        description: "Add more activities to demonstrate well-rounded engagement.",
      })
    }
    if (colleges.length < 5) {
      gaps.push({
        title: "College List Balance",
        description: "Build a balanced list with reach, target, and safety schools.",
      })
    }
    if (profile?.gpa && profile.gpa < 3.5) {
      gaps.push({
        title: "Academic Rigor Balance",
        description: "Focus on strengthening GPA through honors or AP coursework.",
      })
    }

    // === College Insights ===
    const profileData = {
      gpa: profile?.gpa || null,
      gpaScale: profile?.gpaScale || null,
      satScore: profile?.satScore || null,
      actScore: profile?.actScore || null,
      intendedMajors: profile?.intendedMajors || [],
      extracurriculars: profile?.extracurriculars,
    }

    type CollegeInsight = {
      id: string
      name: string
      shortName: string | null
      location: string | null
      websiteUrl: string | null
      category: string
      fitScore: number
      aiInsight: string
      strongPrograms: string[]
      officerTake: string
    }

    // Start with user's saved colleges
    let collegeInsights: CollegeInsight[] = colleges.map((sc) => {
      const category = sc.listCategory || categorizeCollege(profileData, sc.College)
      return {
        id: sc.College.id,
        name: sc.College.name,
        shortName: sc.College.shortName,
        location: sc.College.location,
        websiteUrl: sc.College.websiteUrl || sc.College.website || null,
        category,
        fitScore: computeFitScore(profileData, sc.College),
        aiInsight: generateCollegeInsight(profileData, sc.College, narrativeTheme, category),
        strongPrograms: sc.College.strongPrograms,
        officerTake: generateOfficerTake(profileData, sc.College, category),
      }
    })

    // Sort by fit score descending
    collegeInsights.sort((a, b) => b.fitScore - a.fitScore)

    // If fewer than 3, supplement with recommendations
    if (collegeInsights.length < 3 && profile) {
      const alreadyAddedIds = new Set(colleges.map((sc) => sc.collegeId))
      const allColleges = await prisma.college.findMany({ take: 50 })
      const candidates = allColleges
        .filter((c) => !alreadyAddedIds.has(c.id))
        .map((c) => {
          const category = categorizeCollege(profileData, c)
          return {
            id: c.id,
            name: c.name,
            shortName: c.shortName,
            location: c.location,
            websiteUrl: c.websiteUrl || c.website || null,
            category,
            fitScore: computeFitScore(profileData, c),
            aiInsight: generateCollegeInsight(profileData, c, narrativeTheme, category),
            strongPrograms: c.strongPrograms,
            officerTake: generateOfficerTake(profileData, c, category),
          }
        })
        .sort((a, b) => b.fitScore - a.fitScore)

      for (const candidate of candidates) {
        if (collegeInsights.length >= 3) break
        collegeInsights.push(candidate)
      }
    }

    // Take top 3
    collegeInsights = collegeInsights.slice(0, 3)

    return NextResponse.json({
      user: {
        name: user.name,
        image: user.image,
        email: user.email,
        totalPoints: user.totalPoints,
        currentLevel: user.currentLevel,
        loginStreak: user.loginStreak,
      },
      profile: {
        gradeLevel: profile?.gradeLevel,
        graduationYear: profile?.graduationYear,
        gpa: profile?.gpa,
        gpaScale: profile?.gpaScale,
        intendedMajors: profile?.intendedMajors || [],
        careerInterests: profile?.careerInterests || [],
        location: profile?.location,
      },
      stats: {
        readinessPercentage,
        readinessDelta,
        profileRank,
        competitivenessPercentile,
        impactHours,
        targetSchools: colleges.length,
        narrativeTheme,
        narrativeDescription,
        completedTasks,
        totalTasks: tasks.length,
      },
      nextMoves: pendingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        dueDate: t.dueDate,
        isQuickWin: t.isQuickWin,
        pointsValue: t.pointsValue,
      })),
      gaps: gaps.slice(0, 2),
      colleges: colleges.map((sc) => ({
        id: sc.id,
        name: sc.College.name,
        listCategory: sc.listCategory,
        readinessPercentage: sc.readinessPercentage,
      })),
      collegeInsights,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

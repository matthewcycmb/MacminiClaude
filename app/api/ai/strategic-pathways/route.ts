import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import {
  STRATEGIC_PATHWAYS_SYSTEM_PROMPT,
  PATHWAY_ROADMAP_SYSTEM_PROMPT,
  buildStrategicPathwaysContext,
  buildPathwayRoadmapContext,
} from "@/lib/ai/prompts/strategic-pathways"
import type { StrategicPathway } from "@/lib/ai/prompts/strategic-pathways"
import { prisma } from "@/lib/db/prisma"
import { checkAiLimit } from "@/lib/rate-limit/check-ai-limit"

export async function GET() {
  try {
    // Rate limit check
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        courses: true,
        StudentCollege: {
          include: {
            College: true,
          },
        },
      },
    })

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding first." },
        { status: 404 }
      )
    }

    // Build profile data from database
    const profileData = {
      gradeLevel: user.profile.gradeLevel || "11",
      graduationYear: user.profile.graduationYear || new Date().getFullYear() + 2,
      location: user.profile.location || "United States",
      gpa: user.profile.gpa || 0,
      gpaScale: user.profile.gpaScale || 4.0,
      satScore: user.profile.satScore ?? undefined,
      actScore: user.profile.actScore ?? undefined,
      apCourses: user.profile.apCourses || [],
      intendedMajors: user.profile.intendedMajors || [],
      careerInterests: user.profile.careerInterests || [],
      extracurriculars: user.profile.extracurriculars || [],
    }

    // Extract college list
    const colleges = user.StudentCollege.map((sc) => ({
      name: sc.College.name,
      type: sc.College.type,
      acceptanceRate: sc.College.acceptanceRate,
      listCategory: sc.listCategory,
      readinessPercentage: sc.readinessPercentage,
      applicationDeadline: sc.College.applicationDeadlineRegular,
    }))

    // Also return college info for the "Your Target Colleges" section
    const userColleges = user.StudentCollege.map((sc) => ({
      id: sc.id,
      name: sc.College.name,
      type: sc.College.type,
      listCategory: sc.listCategory,
      readinessPercentage: sc.readinessPercentage,
      acceptanceRate: sc.College.acceptanceRate,
    }))

    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not set - returning mock pathways")
      return NextResponse.json({
        success: true,
        pathways: getMockPathways(profileData),
        colleges: userColleges,
        profile: {
          name: user.name,
          intendedMajors: profileData.intendedMajors,
          careerInterests: profileData.careerInterests,
          gradeLevel: profileData.gradeLevel,
        },
      })
    }

    // Build enriched context with courses, honors, awards, leadership
    const courseData = (user.courses || []).map((c) => ({
      name: c.name,
      type: c.type,
      letterGrade: c.letterGrade,
      percentage: c.percentage,
    }))
    const userContext = buildStrategicPathwaysContext(
      profileData,
      colleges,
      courseData,
      user.profile.honors || [],
      user.profile.awards || [],
      user.profile.leadership || []
    )

    console.log("Generating strategic pathways for:", {
      grade: profileData.gradeLevel,
      gpa: profileData.gpa,
      majors: profileData.intendedMajors,
      numColleges: colleges.length,
    })

    // Call Claude API
    const requestId = crypto.randomUUID()
    const startTime = Date.now()

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: STRATEGIC_PATHWAYS_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" } as any,
        },
        {
          type: "text",
          text: userContext,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate 3 personalized strategic pathway recommendations based on my profile.\n\nRequest ID: ${requestId}\nGenerated at: ${new Date().toISOString()}`,
        },
      ],
    })

    const duration = Date.now() - startTime
    console.log(`Strategic pathways generated in ${duration}ms`)

    // Check if the response was truncated
    if (message.stop_reason === "max_tokens") {
      console.error("Strategic pathways response was truncated (max_tokens reached)")
      // Fall back to mock data on truncation
      return NextResponse.json({
        success: true,
        pathways: getMockPathways(profileData),
        colleges: userColleges,
        profile: {
          name: user.name,
          intendedMajors: profileData.intendedMajors,
          careerInterests: profileData.careerInterests,
          gradeLevel: profileData.gradeLevel,
        },
        _truncated: true,
      })
    }

    // Parse AI response
    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    // Extract JSON from response
    let jsonText = content.text.trim()

    if (jsonText.includes("```json")) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    } else if (jsonText.includes("```")) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    }

    if (!jsonText.startsWith("{") && !jsonText.startsWith("[")) {
      const match = jsonText.match(/\{[\s\S]*\}/)
      if (match) jsonText = match[0]
    }

    let pathwaysData
    try {
      pathwaysData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Failed JSON:", jsonText.substring(0, 1000))
      // Fall back to mock data instead of crashing
      return NextResponse.json({
        success: true,
        pathways: getMockPathways(profileData),
        colleges: userColleges,
        profile: {
          name: user.name,
          intendedMajors: profileData.intendedMajors,
          careerInterests: profileData.careerInterests,
          gradeLevel: profileData.gradeLevel,
        },
        _parseError: true,
      })
    }

    // Handle multiple response formats: {pathways: [...]}, [...], or direct pathway objects
    const extractedPathways = Array.isArray(pathwaysData)
      ? pathwaysData
      : pathwaysData.pathways || []

    return NextResponse.json({
      success: true,
      pathways: extractedPathways,
      colleges: userColleges,
      profile: {
        name: user.name,
        intendedMajors: profileData.intendedMajors,
        careerInterests: profileData.careerInterests,
        gradeLevel: profileData.gradeLevel,
      },
      _usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("Error generating strategic pathways:", error)
    return NextResponse.json(
      {
        error: "Failed to generate strategic pathways",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// ── POST: Generate detailed roadmap for a selected pathway ──

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const postLimitResult = await checkAiLimit()
    if (!postLimitResult.allowed) return postLimitResult.response!

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const pathway: StrategicPathway = body.pathway

    if (!pathway || !pathway.title) {
      return NextResponse.json(
        { error: "Missing pathway data" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        StudentCollege: {
          include: { College: true },
        },
      },
    })

    if (!user || !user.profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      )
    }

    const profileData = {
      gradeLevel: user.profile.gradeLevel || "11",
      graduationYear:
        user.profile.graduationYear || new Date().getFullYear() + 2,
      location: user.profile.location || "United States",
      gpa: user.profile.gpa || 0,
      gpaScale: user.profile.gpaScale || 4.0,
      satScore: user.profile.satScore ?? undefined,
      actScore: user.profile.actScore ?? undefined,
      apCourses: user.profile.apCourses || [],
      intendedMajors: user.profile.intendedMajors || [],
      careerInterests: user.profile.careerInterests || [],
      extracurriculars: user.profile.extracurriculars || [],
    }

    const colleges = user.StudentCollege.map((sc) => ({
      name: sc.College.name,
      type: sc.College.type,
      acceptanceRate: sc.College.acceptanceRate,
      listCategory: sc.listCategory,
      readinessPercentage: sc.readinessPercentage,
      applicationDeadline: sc.College.applicationDeadlineRegular,
    }))

    // Check for API key – return mock roadmap if missing
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not set – returning mock pathway roadmap")
      return NextResponse.json({
        success: true,
        roadmap: getMockPathwayRoadmap(pathway, profileData),
      })
    }

    const userContext = buildPathwayRoadmapContext(
      pathway,
      profileData,
      colleges
    )

    console.log("Generating detailed pathway roadmap for:", pathway.title)

    const requestId = crypto.randomUUID()
    const startTime = Date.now()

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: [
        {
          type: "text",
          text: PATHWAY_ROADMAP_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" } as any,
        },
        {
          type: "text",
          text: userContext,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate my detailed pathway roadmap for the "${pathway.title}" direction.\n\nRequest ID: ${requestId}\nGenerated at: ${new Date().toISOString()}`,
        },
      ],
    })

    const duration = Date.now() - startTime
    console.log(`Pathway roadmap generated in ${duration}ms`)

    const content = message.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude")
    }

    let jsonText = content.text.trim()

    if (jsonText.includes("```json")) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    } else if (jsonText.includes("```")) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (match) jsonText = match[1].trim()
    }
    if (!jsonText.startsWith("{")) {
      const match = jsonText.match(/\{[\s\S]*\}/)
      if (match) jsonText = match[0]
    }

    let roadmapData
    try {
      roadmapData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Failed JSON:", jsonText.substring(0, 1000))
      throw new Error(
        `Failed to parse roadmap response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      )
    }

    // Handle both {"roadmap": {...}} and direct {...pathwayTitle, summary, phases} formats
    const roadmap = roadmapData.roadmap
      ? roadmapData.roadmap
      : roadmapData.pathwayTitle && roadmapData.phases
        ? roadmapData
        : null

    if (!roadmap || !roadmap.phases) {
      console.error("Unexpected roadmap structure:", JSON.stringify(roadmapData).substring(0, 500))
      throw new Error("AI returned an unexpected roadmap format")
    }

    return NextResponse.json({
      success: true,
      roadmap,
      _usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        duration_ms: duration,
      },
    })
  } catch (error) {
    console.error("Error generating pathway roadmap:", error)
    return NextResponse.json(
      {
        error: "Failed to generate pathway roadmap",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

function getMockPathwayRoadmap(
  pathway: StrategicPathway,
  profile: { gradeLevel: string; intendedMajors: string[] }
) {
  const gradeNum = parseInt(profile.gradeLevel) || 11
  const isJunior = gradeNum === 11
  return {
    pathwayTitle: pathway.title,
    summary: `This roadmap transforms your profile into a compelling "${pathway.title}" narrative by building on your existing strengths in ${pathway.relatedMajors.join(" and ")}. Over the next 6-12 months you will deepen your involvement, create tangible evidence of impact, and position yourself as a standout candidate for ${pathway.targetTier} programs.`,
    phases: [
      {
        title: isJunior ? "Spring Foundation" : "Immediate Actions",
        timeframe: "Next 1-3 Months",
        description:
          "Establish the core building blocks of your pathway narrative by starting key activities and laying groundwork.",
        milestones: [
          {
            title: `Research 5 ${pathway.relatedMajors[0] || "target"} programs at your top colleges`,
            description:
              "Go beyond rankings. Read faculty research pages, look at course catalogs, and identify 2-3 professors whose work excites you. Save specific details for supplemental essays later.",
            category: "research",
            priority: "critical",
            resource: "College websites, department pages",
          },
          {
            title: "Start a personal project or independent study",
            description: `Launch a self-directed project related to ${pathway.relatedMajors.join(" / ")}. This could be a research paper, an app, a community initiative, or an experiment. Colleges want to see initiative beyond coursework.`,
            category: "portfolio",
            priority: "critical",
            resource: "GitHub, Google Scholar, local library",
          },
          {
            title:
              "Identify and reach out to a mentor in your field of interest",
            description:
              "Email a local professor, professional, or alumni working in this space. A 20-minute informational interview can open doors to research opportunities, internships, and recommendation letters.",
            category: "networking",
            priority: "high",
          },
          {
            title:
              "Register for a relevant competition or summer program",
            description: `Find a competition, hackathon, science fair, or selective summer program aligned with ${pathway.title}. Early registration matters - many programs have spring deadlines.`,
            category: "competitions",
            priority: "high",
            resource: "MIT THINK, MOSTEC, RSI, local science fairs",
          },
        ],
      },
      {
        title: isJunior ? "Summer Deep Dive" : "Building Momentum",
        timeframe: "3-6 Months Out",
        description:
          "Deepen your engagement and create measurable impact that admissions officers will notice.",
        milestones: [
          {
            title: "Complete a summer research or internship experience",
            description: `Secure a position in a lab, company, or organization related to ${pathway.relatedMajors[0] || "your field"}. Even a 4-week experience demonstrates serious commitment. Document your work and contributions meticulously.`,
            category: "research",
            priority: "critical",
          },
          {
            title: "Publish or present your project work",
            description:
              "Submit your project to a journal, blog, conference, or school publication. Having tangible output (a paper, article, presentation, or live project) separates you from students who only list activities.",
            category: "portfolio",
            priority: "high",
            resource:
              "Journal of Student Research, Medium, school newspaper, local conferences",
          },
          {
            title: "Take a leadership role in a related club or organization",
            description:
              "Don't just be a member. Propose a new initiative, organize an event, or start a new chapter. Admissions officers look for demonstrated leadership with measurable results.",
            category: "extracurriculars",
            priority: "high",
          },
          {
            title: "Draft your Common App essay with this pathway as your narrative thread",
            description: `Start brainstorming and drafting your personal statement. Weave your ${pathway.title} journey into a compelling story. Focus on a specific moment of growth or realization, not a resume summary.`,
            category: "applications",
            priority: "medium",
            resource: "College Essay Guy, Khan Academy essay course",
          },
          {
            title: "Enroll in advanced coursework aligned with this pathway",
            description: `If available, take AP or honors courses in ${pathway.relatedMajors.join(", ")} or related subjects for senior year. Academic rigor in your area of interest signals genuine commitment to admissions.`,
            category: "academics",
            priority: "medium",
          },
        ],
      },
      {
        title: isJunior
          ? "Senior Year Positioning"
          : "Application-Ready Sprint",
        timeframe: "6-12 Months Out",
        description:
          "Finalize your application narrative, secure strong recommendations, and polish every touchpoint.",
        milestones: [
          {
            title: "Request recommendation letters from aligned mentors",
            description:
              "Ask teachers and mentors who have directly witnessed your pathway-related growth. Give them a one-page summary of your activities, goals, and the story you want your application to tell.",
            category: "applications",
            priority: "critical",
          },
          {
            title:
              "Write supplemental essays that connect this pathway to each college",
            description: `For each target school, write a "Why this college" essay that references specific professors, labs, programs, or courses you researched in Phase 1. Show you've done the homework and have a clear vision.`,
            category: "applications",
            priority: "critical",
          },
          {
            title: "Compile a portfolio or activity supplement",
            description:
              "Gather all your project work, publications, presentations, and awards into a clean portfolio. Many schools accept supplemental materials. This tangible evidence of your work is what makes your application unforgettable.",
            category: "portfolio",
            priority: "high",
          },
          {
            title: "Quantify your impact across all activities",
            description:
              "Go through your activities list and attach numbers everywhere. People served, funds raised, hours contributed, users reached, awards won. Concrete metrics make your application stand out.",
            category: "applications",
            priority: "high",
          },
        ],
      },
    ],
  }
}

function getMockPathways(profile: {
  intendedMajors: string[]
  careerInterests: string[]
  gpa?: number
  extracurriculars?: any
}) {
  // Generate contextually relevant mock pathways based on available profile data
  const majors = profile.intendedMajors || []
  const careers = profile.careerInterests || []
  const hasTechInterest = [...majors, ...careers].some(
    (s) =>
      s.toLowerCase().includes("computer") ||
      s.toLowerCase().includes("tech") ||
      s.toLowerCase().includes("engineering") ||
      s.toLowerCase().includes("software")
  )
  const hasBioInterest = [...majors, ...careers].some(
    (s) =>
      s.toLowerCase().includes("bio") ||
      s.toLowerCase().includes("med") ||
      s.toLowerCase().includes("health")
  )
  const hasBusinessInterest = [...majors, ...careers].some(
    (s) =>
      s.toLowerCase().includes("business") ||
      s.toLowerCase().includes("finance") ||
      s.toLowerCase().includes("econ")
  )

  const pathways = []

  if (hasTechInterest) {
    pathways.push({
      title: "Tech Innovator",
      description:
        "Leveraging your technical interests to build at the intersection of software and real-world impact.",
      confidence: 92,
      icon: "code",
      colorTheme: "blue",
      relatedMajors: ["Computer Science", "Data Science"],
      targetTier: "Top Research Universities",
      keyStrengths: [
        "Strong technical interest alignment",
        "Growing field with high demand",
      ],
      nextSteps: [
        "Build a portfolio project showcasing your skills",
        "Seek a summer research or internship opportunity",
      ],
    })
  }

  if (hasBioInterest) {
    pathways.push({
      title: "Biomedical Pioneer",
      description:
        "Combining life sciences with cutting-edge research to drive healthcare innovation forward.",
      confidence: 89,
      icon: "biotech",
      colorTheme: "emerald",
      relatedMajors: ["Bioengineering", "Molecular Biology"],
      targetTier: "Ivy Plus, Tier 1 Research",
      keyStrengths: [
        "Profile aligned with life sciences",
        "Interdisciplinary research potential",
      ],
      nextSteps: [
        "Shadow a researcher or healthcare professional",
        "Join a science olympiad or biology competition",
      ],
    })
  }

  if (hasBusinessInterest) {
    pathways.push({
      title: "Business Strategist",
      description:
        "Merging analytical thinking with entrepreneurial vision to create lasting economic impact.",
      confidence: 85,
      icon: "trending_up",
      colorTheme: "amber",
      relatedMajors: ["Economics", "Business Administration"],
      targetTier: "Top Business Programs",
      keyStrengths: [
        "Business-oriented interests",
        "Strong analytical foundation",
      ],
      nextSteps: [
        "Launch a small business or nonprofit initiative",
        "Take on a leadership role in a business club",
      ],
    })
  }

  // Fill remaining slots with generic but profile-aware pathways
  if (pathways.length < 3) {
    const genericPathways = [
      {
        title: "Research Scholar",
        description:
          "Pursuing deep intellectual curiosity through academic research and scholarly contributions.",
        confidence: 82,
        icon: "science",
        colorTheme: "purple",
        relatedMajors: majors.length > 0 ? majors.slice(0, 2) : ["Liberal Arts", "Sciences"],
        targetTier: "Research Universities",
        keyStrengths: [
          "Academic curiosity and dedication",
          "Strong GPA foundation",
        ],
        nextSteps: [
          "Reach out to a professor for mentorship",
          "Submit work to a student research journal",
        ],
      },
      {
        title: "Community Leader",
        description:
          "Channeling passion for social impact into transformative community-driven initiatives.",
        confidence: 78,
        icon: "diversity_3",
        colorTheme: "rose",
        relatedMajors: ["Public Policy", "Sociology"],
        targetTier: "Top Liberal Arts Colleges",
        keyStrengths: [
          "Community engagement potential",
          "Well-rounded profile",
        ],
        nextSteps: [
          "Start or grow a community service project",
          "Document measurable impact of your initiatives",
        ],
      },
      {
        title: "Creative Innovator",
        description:
          "Blending creativity with analytical skills to solve problems through design thinking.",
        confidence: 75,
        icon: "palette",
        colorTheme: "cyan",
        relatedMajors: ["Design", "Communications"],
        targetTier: "Creative Programs, Top Publics",
        keyStrengths: [
          "Creative problem-solving ability",
          "Interdisciplinary thinking",
        ],
        nextSteps: [
          "Build a creative portfolio or passion project",
          "Enter a design or innovation competition",
        ],
      },
    ]

    for (const gp of genericPathways) {
      if (pathways.length >= 3) break
      // Don't duplicate color themes
      if (!pathways.some((p) => p.colorTheme === gp.colorTheme)) {
        pathways.push(gp)
      }
    }
  }

  return pathways.slice(0, 3)
}

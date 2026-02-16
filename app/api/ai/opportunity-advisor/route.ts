import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import { OPPORTUNITY_ADVISOR_SYSTEM_PROMPT } from "@/lib/ai/prompts/opportunity-advisor"
import { checkAiLimit } from "@/lib/rate-limit/check-ai-limit"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages } = (await request.json()) as {
      messages: ChatMessage[]
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        courses: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = user.profile

    // Build rich student context
    const extracurricularsText = profile?.extracurriculars
      ? Array.isArray(profile.extracurriculars)
        ? (profile.extracurriculars as Array<{
            name?: string
            role?: string
            category?: string
            hoursPerWeek?: number
            years?: number
          }>)
            .map(
              (a) =>
                `- ${a.name || "Activity"} (${a.role || "Member"}, ${a.hoursPerWeek || 0}hrs/wk, ${a.years || 0}yrs)`
            )
            .join("\n")
        : JSON.stringify(profile.extracurriculars)
      : "None listed"

    const coursesText = user.courses?.length
      ? user.courses
          .map((c) => {
            let line = `- ${c.name}`
            if (c.type) line += ` (${c.type})`
            if (c.letterGrade) line += ` — ${c.letterGrade}`
            return line
          })
          .join("\n")
      : "None listed"

    const contextBlock = `
STUDENT CONTEXT:
- Name: ${user.name || "Student"}
- Grade Level: ${profile?.gradeLevel || "Unknown"}
- Graduation Year: ${profile?.graduationYear || "Unknown"}
- Location: ${profile?.location || "Not specified"}
- GPA: ${profile?.gpa ? `${profile.gpa}/${profile.gpaScale || 4.0}` : "Not provided"}
- SAT: ${profile?.satScore || "Not taken"}
- ACT: ${profile?.actScore || "Not taken"}
- Intended Majors: ${profile?.intendedMajors?.join(", ") || "Undecided"}
- Career Interests: ${profile?.careerInterests?.join(", ") || "Not specified"}
- Honors: ${profile?.honors?.join(", ") || "None listed"}
- Awards: ${profile?.awards?.join(", ") || "None listed"}

CURRENT COURSEWORK:
${coursesText}

EXTRACURRICULAR ACTIVITIES:
${extracurricularsText}
`.trim()

    // Mock response if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      const lastMsg = messages[messages.length - 1].content
      return NextResponse.json({
        message: getMockResponse(lastMsg, profile?.location || null),
      })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      system: `${OPPORTUNITY_ADVISOR_SYSTEM_PROMPT}\n\n${contextBlock}`,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    return NextResponse.json({ message: content.text })
  } catch (error) {
    console.error("Error in opportunity advisor:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

function getMockResponse(userMessage: string, location: string | null): string {
  const lowerMsg = userMessage.toLowerCase()

  if (lowerMsg.includes("deca")) {
    return `Great question! Here's how to get involved with **DECA**:\n\n1. **Check if your school has a chapter** — Ask your business teacher or guidance counselor. Most high schools with business programs have an active DECA chapter.\n\n2. **If your school doesn't have one, start one** — You'll need a faculty advisor and at least 5 interested students. Visit **deca.org/start-a-chapter** for the guide.\n\n3. **Register for competitions** — DECA runs events in marketing, finance, hospitality, and management. Your chapter advisor will register your team for the district competition (usually October-December).\n\n4. **Prepare for events** — Choose a competitive event category that matches your interests. DECA has role-plays, written projects, and case studies. Practice materials are on the DECA website.\n\n5. **Timeline**: District → State → International Career Development Conference (ICDC) in April\n\n${location ? `Since you're in **${location}**, check your state DECA association website for local competition dates and registration deadlines.` : ""}\n\nDECA is highly valued by business programs at schools like **Wharton, Ross, and Stern**. Would you like help choosing which DECA event category fits your profile best?`
  }

  if (lowerMsg.includes("research") || lowerMsg.includes("summer program")) {
    return `Here are some top research opportunities to consider:\n\n**Elite Programs (highly selective):**\n- **RSI (Research Science Institute)** — Free 6-week program at MIT for rising seniors. Apply by January. Extremely competitive but one of the most prestigious.\n- **SSTP (Summer Science Training Program)** at University of Florida — 7-week residential program for rising seniors.\n\n**More Accessible Options:**\n- **Local university labs** — Email professors directly! Many welcome motivated high school students as research assistants.\n- **Lumiere Research Scholar Program** — Work 1-on-1 with a research mentor remotely.\n\n${location ? `For your location in **${location}**, I'd recommend reaching out to nearby universities about summer research positions — local professors are often more receptive to students from their community.` : ""}\n\nWould you like help drafting a cold email to a professor, or would you prefer more details on any of these programs?`
  }

  if (lowerMsg.includes("competition") || lowerMsg.includes("contest")) {
    return `Here are competitions that could strengthen your college application:\n\n**STEM:**\n- **AMC/AIME** — Math competitions. AMC 10/12 in November, AIME qualification is a strong credential.\n- **USACO** — Programming contests, monthly online. Bronze → Silver → Gold → Platinum.\n- **Science Olympiad** — Team-based STEM events, school-based.\n\n**Humanities:**\n- **Scholastic Art & Writing Awards** — Deadline typically January. National recognition for creative work.\n- **National History Day** — Year-long research project competition.\n\n**Business:**\n- **DECA** — Business case studies and role-plays.\n- **FBLA** — Similar to DECA with a broader business focus.\n\nWhich area interests you most? I can give you more specific recommendations based on your profile.`
  }

  return `I'd be happy to help you explore opportunities! Based on your profile, I can help with:\n\n- **Finding specific programs** — Tell me a program name and I'll explain how to apply\n- **Competition recommendations** — I can suggest competitions that match your interests\n- **Summer program advice** — Research programs, internships, and pre-college experiences\n- **Local opportunities** ${location ? `near **${location}**` : ""} — Community-based activities that admissions officers value\n\nWhat would you like to know more about?`
}

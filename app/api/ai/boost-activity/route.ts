import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/db/prisma"
import { anthropic, CLAUDE_MODEL } from "@/lib/ai/anthropic-client"
import { ACTIVITY_BOOSTER_SYSTEM_PROMPT } from "@/lib/ai/prompts/activity-booster"
import { checkAiLimit, logApiUsage } from "@/lib/rate-limit/check-ai-limit"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface Activity {
  name: string
  role: string
  category: string
  hoursPerWeek: number
  yearsParticipated: number
  description: string
  achievements: string[]
  status: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const limitResult = await checkAiLimit()
    if (!limitResult.allowed) return limitResult.response!

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, activity } = (await request.json()) as {
      messages: ChatMessage[]
      activity: Activity
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    if (!activity || !activity.name) {
      return NextResponse.json(
        { error: "Activity is required" },
        { status: 400 }
      )
    }

    // Fetch user profile for context
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const profile = user.profile

    // Build context about the student and activity
    const contextBlock = `
STUDENT CONTEXT:
- Name: ${user.name || "Student"}
- Grade Level: ${profile?.gradeLevel || "Unknown"}
- Graduation Year: ${profile?.graduationYear || "Unknown"}
- GPA: ${profile?.gpa || "Not provided"}
- Intended Majors: ${profile?.intendedMajors?.join(", ") || "Undecided"}
- Career Interests: ${profile?.careerInterests?.join(", ") || "Not specified"}

SELECTED ACTIVITY:
- Name: ${activity.name}
- Role: ${activity.role}
- Category: ${activity.category}
- Hours/Week: ${activity.hoursPerWeek}
- Years Participated: ${activity.yearsParticipated}
- Status: ${activity.status}
- Description: ${activity.description || "None provided"}
- Achievements: ${activity.achievements?.length > 0 ? activity.achievements.join("; ") : "None listed yet"}
`.trim()

    // Mock response if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      const mockResponse = getMockResponse(activity, messages[messages.length - 1].content)
      return NextResponse.json({ message: mockResponse })
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      system: `${ACTIVITY_BOOSTER_SYSTEM_PROMPT}\n\n${contextBlock}`,
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
    console.error("Error in activity booster:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

function getMockResponse(activity: Activity, userMessage: string): string {
  const lowerMsg = userMessage.toLowerCase()

  if (lowerMsg.includes("quality") || lowerMsg.includes("improve")) {
    return `Great question! To improve the quality of your **${activity.name}** involvement, here are some concrete strategies:\n\n1. **Document your impact with numbers** — Track metrics like members recruited, events organized, or people served. Admissions officers love quantifiable results.\n\n2. **Create something new within the activity** — Start a new initiative, program, or project. For example, you could launch a mentorship program for newer members or organize a community outreach event.\n\n3. **Seek external recognition** — Submit your work to competitions, apply for awards, or get featured in local media. External validation shows your activity has real-world impact.\n\n**This week's action item:** Write down 3 specific metrics that capture your contribution so far, and identify one area where you can start tracking impact going forward.`
  }

  if (lowerMsg.includes("leadership")) {
    return `Here are some powerful leadership moves for **${activity.name}**:\n\n1. **Propose a new role or committee** — Don't wait for existing positions. Create a "Director of Outreach" or "Training Coordinator" role and pitch it to your advisor.\n\n2. **Mentor younger members** — Formalize a mentorship system where experienced members guide newcomers. This shows initiative and multiplies your impact.\n\n3. **Bridge to the community** — Partner with a local organization or school to expand your activity's reach. This transforms you from a participant to a connector.\n\n**This week's action item:** Schedule a meeting with your club advisor or coach to propose one new initiative you can lead.`
  }

  if (lowerMsg.includes("community") || lowerMsg.includes("impact")) {
    return `Increasing community impact is one of the most powerful ways to stand out. Here's how to do it with **${activity.name}**:\n\n1. **Partner with local organizations** — Reach out to nonprofits, schools, or community centers that align with your activity. Joint events create real, visible impact.\n\n2. **Teach or share your skills** — Organize free workshops, create tutorial content, or start a program at a local community center. This shows you're not just participating — you're giving back.\n\n3. **Measure and communicate your impact** — Keep a log of people helped, events held, and outcomes achieved. A "we served 200 students" story is more compelling than "we did volunteer work."\n\n**This week's action item:** Identify one local organization you could partner with and draft a short email proposing a collaboration.`
  }

  return `I'd love to help you enhance your **${activity.name}** experience! Based on your role as **${activity.role}** with ${activity.yearsParticipated} year(s) of experience, here's my analysis:\n\n**Current Strengths:**\n- You have sustained commitment (${activity.yearsParticipated} years)\n- Active involvement at ${activity.hoursPerWeek} hours/week shows dedication\n\n**Growth Opportunities:**\n1. **Quantify your impact** — Start tracking specific metrics related to your contributions\n2. **Take on a leadership initiative** — Propose a new project or program within the activity\n3. **Connect to your academic interests** — Find ways to tie this activity to your intended field of study\n\nWhat specific aspect would you like to focus on? I can give you more targeted advice on improving quality, developing leadership, or increasing community impact.`
}

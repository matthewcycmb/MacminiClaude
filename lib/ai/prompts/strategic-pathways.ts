import { ProfileData, CollegeData } from "./roadmap-generator"

export const STRATEGIC_PATHWAYS_SYSTEM_PROMPT = `
You are an expert college admissions strategist who creates DEEPLY PERSONALIZED pathway recommendations. You analyze every detail of a student's profile — their specific activities, years of commitment, location, coursework, grades, and test scores — to craft pathways that feel like they were written by a counselor who knows this student personally.

Each pathway represents a coherent narrative direction the student could pursue to strengthen their college application.

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY 3 pathway recommendations
2. The first pathway should be the strongest match (highest confidence)
3. Each pathway must be DISTINCT — different narrative angles on the same profile
4. Confidence scores must reflect actual profile alignment, not aspirational fit

PERSONALIZATION RULES (MANDATORY — pathways that ignore these will be rejected):
1. DESCRIPTION must reference at least 1 specific activity or academic strength BY NAME (e.g., "Building on your 2 years leading Robotics Club" not "Building on your technical interests")
2. KEY STRENGTHS must cite concrete evidence from the profile (e.g., "3.9 GPA with AP Chemistry and AP Bio" not "Strong academic record")
3. NEXT STEPS must be actionable and location-aware when relevant (e.g., "Apply to UBC summer research program near Vancouver" not "Find a summer program")
4. Use the student's actual years of experience, hours committed, and roles held to calibrate confidence scores
5. If the student has a specific location, at least 1 pathway's nextSteps should reference local opportunities

BAD EXAMPLE (too generic — DO NOT do this):
{
  "title": "Tech Innovator",
  "description": "Leveraging your technical interests to build innovative solutions",
  "keyStrengths": ["Strong technical aptitude", "Growing field with high demand"],
  "nextSteps": ["Build a portfolio project", "Seek a summer internship"]
}

GOOD EXAMPLE (deeply personalized — DO THIS):
{
  "title": "Civic Technologist",
  "description": "Your 2 years in Robotics Club plus community tutoring uniquely positions you to build tech that serves communities",
  "keyStrengths": ["2yr robotics commitment at 8hrs/wk shows deep technical skill", "3.8 GPA with AP CS and AP Calc demonstrates quantitative rigor"],
  "nextSteps": ["Apply to Vancouver's CityHacks civic hackathon this spring", "Propose a tutoring-app project to your Robotics Club advisor"]
}

PATHWAY CONFIDENCE SCORING:
- 90-99%: Strong existing alignment (multiple interests/activities already point here)
- 80-89%: Good alignment (some interests/activities match, with growth potential)
- 70-79%: Moderate alignment (interesting direction based on partial profile fit)
- 60-69%: Exploratory (creative stretch based on profile patterns)

ICON SELECTION - Use ONLY these Material Symbols Outlined icon names:
- biotech, science, psychology, neurology, health_and_safety (STEM/Health)
- eco, park, water_drop, energy_savings_leaf (Environmental)
- currency_bitcoin, account_balance, analytics, trending_up (Business/Finance)
- code, terminal, memory, smart_toy, cloud (Tech/CS)
- palette, music_note, theater_comedy, draw (Arts)
- gavel, policy, campaign (Law/Policy)
- school, history_edu, menu_book (Education/Humanities)
- rocket_launch, engineering, precision_manufacturing (Engineering)
- public, language, diversity_3 (International/Social)

COLOR THEMES (use one per pathway, do NOT repeat):
- emerald, blue, amber, purple, rose, cyan

OUTPUT FORMAT: You MUST respond with ONLY valid JSON. No explanations, no markdown, no extra text.

CRITICAL JSON RULES:
- Use only plain ASCII text in all strings (no special characters, no em-dashes, no fancy quotes)
- Escape all quotes inside strings
- Keep title to 2-3 words max
- Keep description under 150 characters — but it MUST reference specific profile details
- Keep relatedMajors to 2-3 items max
- Keep targetTier to a short phrase
- Keep keyStrengths to 2-3 items, each under 80 characters, citing specific profile data
- Keep nextSteps to 2-3 items, each under 80 characters, with actionable specifics
- No newlines inside string values

{
  "pathways": [
    {
      "title": "Creative 2-3 word pathway name",
      "description": "Description referencing specific activities, courses, or strengths by name",
      "confidence": 94,
      "icon": "material_symbol_name",
      "colorTheme": "emerald",
      "relatedMajors": ["Major 1", "Major 2"],
      "targetTier": "Ideal college tier description",
      "keyStrengths": ["Specific evidence from profile", "Another concrete strength"],
      "nextSteps": ["Specific, actionable step with names/locations", "Another concrete action"]
    }
  ]
}
`

export interface StrategicPathway {
  title: string
  description: string
  confidence: number
  icon: string
  colorTheme: string
  relatedMajors: string[]
  targetTier: string
  keyStrengths: string[]
  nextSteps: string[]
}

// ── Detailed pathway roadmap generation ──

export const PATHWAY_ROADMAP_SYSTEM_PROMPT = `
You are an elite college admissions counselor. A student has selected a strategic pathway direction and you must now create a DETAILED, ACTIONABLE roadmap that guides them step-by-step through pursuing this direction over the next 6-12 months.

This is NOT a vague overview. This is a concrete battle plan. Every item should be specific enough that the student knows exactly what to do, where to go, and what the outcome looks like.

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY 3 phases, ordered chronologically
2. Each phase has EXACTLY 4-5 milestones (specific, measurable actions)
3. Each milestone must include a detailed description (2-3 sentences), a category, and a priority
4. Include at least one "recommended program" or "resource" per phase (name real competitions, programs, platforms, or organizations when possible)
5. Tailor EVERYTHING to the student's grade level, location, existing activities, and chosen pathway
6. Make the roadmap PROGRESSIVE: Phase 1 = foundation building, Phase 2 = deepening impact, Phase 3 = application-ready positioning

PHASE TITLES should reflect the student's timeline (e.g., "Spring Semester", "Summer Intensive", "Senior Fall Push")

MILESTONE CATEGORIES:
- academics: Coursework, AP classes, independent study
- extracurriculars: Clubs, teams, organizations to join or lead
- research: Independent projects, lab positions, mentorships
- competitions: Science fairs, olympiads, hackathons, essay contests
- networking: Reaching out to professors, professionals, alumni
- portfolio: Building tangible work samples, publications, projects
- applications: College-specific prep, essays, interviews

PRIORITY LEVELS:
- critical: Must-do, foundational to the pathway
- high: Very important for standing out
- medium: Strengthens the profile
- low: Nice-to-have polish

OUTPUT FORMAT: Respond with ONLY valid JSON. No explanations, no markdown.

CRITICAL JSON RULES:
- Use only plain ASCII text (no special characters, no em-dashes, no fancy quotes)
- Escape all quotes inside strings
- No newlines inside string values

{
  "roadmap": {
    "pathwayTitle": "Name of the selected pathway",
    "summary": "One paragraph explaining how this roadmap transforms the student's profile (2-3 sentences max)",
    "phases": [
      {
        "title": "Phase name reflecting timeline",
        "timeframe": "e.g., March - May 2026",
        "description": "What this phase accomplishes overall",
        "milestones": [
          {
            "title": "Specific action title",
            "description": "Detailed 2-3 sentence explanation of what to do, why it matters, and what success looks like",
            "category": "one of: academics|extracurriculars|research|competitions|networking|portfolio|applications",
            "priority": "one of: critical|high|medium|low",
            "resource": "Optional: specific program, platform, organization, or competition name"
          }
        ]
      }
    ]
  }
}
`

export interface PathwayMilestone {
  title: string
  description: string
  category: string
  priority: string
  resource?: string
}

export interface PathwayPhase {
  title: string
  timeframe: string
  description: string
  milestones: PathwayMilestone[]
}

export interface PathwayRoadmap {
  pathwayTitle: string
  summary: string
  phases: PathwayPhase[]
}

export function buildPathwayRoadmapContext(
  pathway: StrategicPathway,
  profile: ProfileData,
  colleges?: CollegeData[]
): string {
  const currentDate = new Date().toISOString().split("T")[0]

  const extracurricularsText = profile.extracurriculars
    ? Array.isArray(profile.extracurriculars)
      ? (profile.extracurriculars as Array<{ name?: string; role?: string; category?: string; hoursPerWeek?: number; years?: number }>)
          .map(
            (a) =>
              `- ${a.name || "Activity"} (${a.role || "Member"}, ${a.category || "other"}, ${a.hoursPerWeek || 0}hrs/wk, ${a.years || 0}yrs)`
          )
          .join("\n")
      : JSON.stringify(profile.extracurriculars)
    : "None specified"

  return `
SELECTED PATHWAY: "${pathway.title}"
Pathway description: ${pathway.description}
Related majors: ${pathway.relatedMajors.join(", ")}
Target tier: ${pathway.targetTier}
Confidence: ${pathway.confidence}%
Key strengths identified: ${pathway.keyStrengths.join("; ")}

STUDENT PROFILE (as of ${currentDate}):

BASIC INFO:
- Current Grade: ${profile.gradeLevel || "Not specified"} grade
- Expected Graduation: ${profile.graduationYear || "Not specified"}
- Location: ${profile.location || "Not specified"}

ACADEMICS:
- GPA: ${profile.gpa ? `${profile.gpa}/${profile.gpaScale || 4.0}` : "Not provided yet"}
- SAT Score: ${profile.satScore || "Not taken yet"}
- ACT Score: ${profile.actScore || "Not taken yet"}
- AP Courses: ${profile.apCourses?.length ? profile.apCourses.join(", ") : "Not specified"}

INTERESTS & GOALS:
- Intended Major(s): ${profile.intendedMajors?.length ? profile.intendedMajors.join(", ") : "Undecided"}
- Career Interests: ${profile.careerInterests?.length ? profile.careerInterests.join(", ") : "Exploring options"}

EXTRACURRICULAR ACTIVITIES:
${extracurricularsText}

COLLEGE LIST (${colleges?.length || 0} colleges):
${
  colleges && colleges.length > 0
    ? colleges
        .map((c) => `- ${c.name} (${c.type || "unknown"}) - ${(c.listCategory || "uncategorized").toUpperCase()}`)
        .join("\n")
    : "- No colleges selected yet"
}

---

Create a DETAILED 3-phase roadmap for this student to pursue the "${pathway.title}" pathway. The roadmap should:
1. Start from TODAY and cover the next 6-12 months
2. Be grade-appropriate (a junior needs different things than a sophomore)
3. Build on their EXISTING activities and interests - don't ignore what they already do
4. Include SPECIFIC program names, competition names, and resources whenever possible
5. Each milestone should be concrete enough that the student can act on it immediately
6. Reference their actual college list when suggesting application-related tasks
`
}

export interface CourseData {
  name: string
  type?: string | null
  letterGrade?: string | null
  percentage?: number | null
}

export function buildStrategicPathwaysContext(
  profile: ProfileData,
  colleges?: CollegeData[],
  courses?: CourseData[],
  honors?: string[],
  awards?: string[],
  leadership?: string[]
): string {
  const currentDate = new Date().toISOString().split("T")[0]

  // Build rich extracurricular details including descriptions and achievements
  const extracurricularsText = profile.extracurriculars
    ? Array.isArray(profile.extracurriculars)
      ? (profile.extracurriculars as Array<{
          name?: string
          role?: string
          category?: string
          hoursPerWeek?: number
          years?: number
          description?: string
          achievements?: string[]
          status?: string
        }>)
          .map((a) => {
            let line = `- ${a.name || "Activity"}: ${a.role || "Member"}, ${a.category || "other"}, ${a.hoursPerWeek || 0}hrs/wk, ${a.years || 0}yrs`
            if (a.status) line += `, ${a.status}`
            if (a.description) line += `\n  Description: ${a.description}`
            if (a.achievements?.length) line += `\n  Achievements: ${a.achievements.join("; ")}`
            return line
          })
          .join("\n")
      : JSON.stringify(profile.extracurriculars)
    : "None specified"

  // Build coursework section with grades
  const courseworkText = courses?.length
    ? courses
        .map((c) => {
          let line = `- ${c.name}`
          if (c.type) line += ` (${c.type})`
          if (c.letterGrade) line += ` — Grade: ${c.letterGrade}`
          else if (c.percentage) line += ` — ${c.percentage}%`
          return line
        })
        .join("\n")
    : null

  // Build honors/awards/leadership sections
  const honorsText = honors?.length ? honors.join(", ") : null
  const awardsText = awards?.length ? awards.join(", ") : null
  const leadershipText = leadership?.length ? leadership.join(", ") : null

  return `
STUDENT PROFILE (as of ${currentDate}):

BASIC INFO:
- Current Grade: ${profile.gradeLevel || "Not specified"} grade
- Expected Graduation: ${profile.graduationYear || "Not specified"}
- Location: ${profile.location || "Not specified"}

ACADEMICS:
- GPA: ${profile.gpa ? `${profile.gpa}/${profile.gpaScale || 4.0}` : "Not provided yet"}
- SAT Score: ${profile.satScore || "Not taken yet"}
- ACT Score: ${profile.actScore || "Not taken yet"}
- AP Courses: ${profile.apCourses?.length ? profile.apCourses.join(", ") : "Not specified"}
${courseworkText ? `\nCURRENT/RECENT COURSEWORK:\n${courseworkText}` : ""}
${honorsText ? `\nHONORS: ${honorsText}` : ""}
${awardsText ? `\nAWARDS: ${awardsText}` : ""}
${leadershipText ? `\nLEADERSHIP POSITIONS: ${leadershipText}` : ""}

INTERESTS & GOALS:
- Intended Major(s): ${profile.intendedMajors?.length ? profile.intendedMajors.join(", ") : "Undecided"}
- Career Interests: ${profile.careerInterests?.length ? profile.careerInterests.join(", ") : "Exploring options"}

EXTRACURRICULAR ACTIVITIES (with full details):
${extracurricularsText}

COLLEGE LIST (${colleges?.length || 0} colleges):
${
  colleges && colleges.length > 0
    ? colleges
        .map((c) => {
          const category = c.listCategory || "Not categorized"
          return `- ${c.name} (${c.type || "unknown"}) - ${category.toUpperCase()}`
        })
        .join("\n")
    : "- No colleges selected yet"
}

---

Based on this student's COMPLETE profile above, generate 3 DEEPLY PERSONALIZED strategic pathway recommendations. You MUST:
1. Reference this student's SPECIFIC activities, courses, and achievements by name
2. Use their location (${profile.location || "unknown"}) to suggest local opportunities in nextSteps
3. Ground keyStrengths in actual profile data (GPA, specific courses, activity durations)
4. Make nextSteps concrete enough to act on immediately — name real programs, competitions, or organizations
5. Each pathway must tell a different story about who this student could become
`
}

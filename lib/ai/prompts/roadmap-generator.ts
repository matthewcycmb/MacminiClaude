export const ROADMAP_SYSTEM_PROMPT = `
You are an expert college admissions counselor with 10+ years of experience helping students get into top universities including Ivy League schools. Your role is to create personalized, actionable college application roadmaps that break down the overwhelming process into clear, achievable steps.

CRITICAL INSTRUCTIONS:
1. Generate a timeline from the student's current grade through application submission
2. Break the timeline into EXACTLY 3 phases (e.g., "Junior Year Fall", "Summer Before Senior Year", "Senior Year Fall")
3. For EACH phase, create EXACTLY 3 specific, actionable tasks (NO MORE, NO LESS!)
4. Mark 1 task per phase as a "quick win" (completable in <15 minutes)
5. Prioritize tasks that keep students engaged weekly (not just one-time tasks)
6. Include variety across categories: testing, essays, research, college visits, extracurriculars, financial aid, applications
7. KEEP IT CONCISE - task descriptions must be under 80 characters - NO EXCEPTIONS!

TASK CATEGORIES:
- testing: SAT, ACT, AP exams, test prep
- essays: Personal statements, supplemental essays, brainstorming
- research: College research, major exploration, scholarship searches
- applications: Common App, UC App, Coalition App setup and submission
- financial_aid: FAFSA, CSS Profile, scholarship applications
- extracurriculars: Leadership positions, awards, community service
- recommendations: Teacher/counselor letters of recommendation
- visits: Campus visits, virtual tours, college fairs

PRIORITY LEVELS:
- urgent: Must be done immediately (deadlines within 2 weeks)
- high: Very important (key milestones, deadlines within 1-2 months)
- medium: Important but flexible timing
- low: Helpful but not critical

OUTPUT FORMAT: You MUST respond with ONLY valid JSON. No explanations, no markdown, no extra text. Just the raw JSON matching this exact schema.

CRITICAL JSON RULES:
- Use only plain ASCII text in descriptions (no special characters, no em-dashes, no fancy quotes)
- Escape all quotes inside strings (use \" not ")
- Keep descriptions under 100 characters
- No newlines inside string values
{
  "roadmap": {
    "title": "Your College Application Roadmap",
    "description": "Personalized plan based on your profile",
    "phases": [
      {
        "title": "Phase name (e.g., Junior Year Fall)",
        "description": "What to focus on during this phase",
        "startDate": "ISO 8601 date string",
        "endDate": "ISO 8601 date string",
        "tasks": [
          {
            "title": "Clear, actionable task title",
            "description": "Detailed instructions on how to complete this task",
            "category": "one of: testing|essays|research|applications|financial_aid|extracurriculars|recommendations|visits",
            "priority": "one of: low|medium|high|urgent",
            "dueDate": "ISO 8601 date string or null",
            "isQuickWin": true or false,
            "pointsValue": 10 for quick wins, 25 for regular, 50 for high-priority
          }
        ]
      }
    ]
  }
}

IMPORTANT GUIDELINES:
- Be specific (not "Research colleges" but "Research 10 colleges that offer Computer Science programs and match your GPA range")
- Make quick wins actually quick (browse 5 colleges, bookmark websites, draft an essay hook)
- Space out tasks realistically (don't overload any single phase)
- Include deadlines for time-sensitive tasks
- Adapt to the student's grade level (freshmen focus on building profile, juniors on testing/research, seniors on applications)
- Consider the student's intended major when suggesting extracurriculars and colleges
`

export interface ProfileData {
  gradeLevel?: string
  graduationYear?: number
  location?: string
  gpa?: number
  gpaScale?: number
  satScore?: number
  actScore?: number
  apCourses?: string[]
  intendedMajors?: string[]
  careerInterests?: string[]
  extracurriculars?: any
}

export interface CollegeData {
  name: string
  type?: string
  acceptanceRate?: number | null
  listCategory?: string | null
  readinessPercentage?: number | null
  applicationDeadline?: Date | null
}

export function buildUserContext(profile: ProfileData, colleges?: CollegeData[]): string {
  const currentDate = new Date().toISOString().split('T')[0]

  return `
STUDENT PROFILE (as of ${currentDate}):

BASIC INFO:
- Current Grade: ${profile.gradeLevel || 'Not specified'} grade
- Expected Graduation: ${profile.graduationYear || 'Not specified'}
- Location: ${profile.location || 'Not specified'}

ACADEMICS:
- GPA: ${profile.gpa ? `${profile.gpa}/${profile.gpaScale}` : 'Not provided yet'}
- SAT Score: ${profile.satScore || 'Not taken yet'}
- ACT Score: ${profile.actScore || 'Not taken yet'}
- AP Courses: ${profile.apCourses?.length ? profile.apCourses.join(', ') : 'Not specified'}

INTERESTS & GOALS:
- Intended Major(s): ${profile.intendedMajors?.length ? profile.intendedMajors.join(', ') : 'Undecided'}
- Career Interests: ${profile.careerInterests?.length ? profile.careerInterests.join(', ') : 'Exploring options'}

EXTRACURRICULARS:
${profile.extracurriculars ? JSON.stringify(profile.extracurriculars, null, 2) : 'Not specified yet'}

COLLEGE LIST (${colleges?.length || 0} colleges selected):
${colleges && colleges.length > 0
  ? colleges.map((c) => {
      const deadline = c.applicationDeadline ? new Date(c.applicationDeadline).toLocaleDateString() : 'TBD'
      const readiness = c.readinessPercentage ? `${c.readinessPercentage}% ready` : 'Not calculated'
      const category = c.listCategory || 'Not categorized'
      return `- ${c.name} (${c.type || 'unknown'}) - ${category.toUpperCase()} - ${readiness} - Deadline: ${deadline}`
    }).join('\n')
  : '- No colleges selected yet'
}

---

Based on this profile, create a detailed, personalized roadmap. Focus on:
1. Their current grade level (they need tasks appropriate for where they are NOW)
2. Their intended major (suggest relevant extracurriculars, research opportunities, colleges)
3. Their testing status (if no scores, prioritize test prep; if scores exist, focus on other areas)
4. Realistic timeline (don't suggest junior year tasks to a senior!)
5. ${colleges && colleges.length > 0
    ? `Their college list (${colleges.length} colleges) - Include college-specific tasks like:\n   - Researching specific programs at ${colleges[0]?.name || 'their colleges'}\n   - Writing supplemental essays for each college\n   - Visiting campuses or attending virtual tours\n   - Meeting application deadlines (earliest: ${colleges.find(c => c.applicationDeadline)?.applicationDeadline ? new Date(colleges.find(c => c.applicationDeadline)!.applicationDeadline!).toLocaleDateString() : 'TBD'})`
    : 'College research (they haven\'t selected colleges yet - include tasks to help them build a balanced college list)'}

Start the roadmap from TODAY and plan through application submission season.
`
}

export function buildPartialUserContext(gradeLevel: string, graduationYear: number, location: string): string {
  return `
STUDENT PROFILE (Partial - Step 1 of onboarding):

- Current Grade: ${gradeLevel} grade
- Expected Graduation: ${graduationYear}
- Location: ${location}

NOTE: This student has only completed Step 1 of onboarding. Create a BASIC roadmap based on their grade level that includes general tasks. Once they complete their full profile (GPA, test scores, intended major), the roadmap will be regenerated with more personalized recommendations.

For now, focus on:
1. Grade-appropriate general tasks
2. Exploration activities (major exploration, college research basics)
3. Timeline awareness (teach them what's coming up)
4. Building good habits (regular planning, staying organized)
`
}

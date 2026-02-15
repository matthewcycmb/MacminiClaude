# Kairo — Complete Codebase Context

> **Purpose of this file:** Paste or reference this at the start of every new Claude conversation to skip codebase scanning and save tokens. Last updated: Feb 15, 2026.

---

## 1. Project Overview

**Kairo** is a college admissions tracking app with AI-powered features for high school students. It provides personalized roadmaps, activity coaching, college readiness assessment, and opportunity discovery.

**Tech Stack:**
- Next.js 15.1.6 + React 19 + TypeScript
- Prisma 6.2.0 + PostgreSQL
- NextAuth 4.24.13 (JWT sessions, Google OAuth)
- Anthropic Claude SDK (`claude-sonnet-4-5-20250929`)
- TanStack React Query 5.62
- Upstash Redis + Rate Limiting
- Tailwind CSS 3.4.1 + tailwindcss-animate
- Radix UI (Progress), Lucide React (icons), Material Symbols Outlined (CDN)

---

## 2. Directory Structure

```
MacminiClaude/
├── app/
│   ├── layout.tsx                    # Root layout (fonts, providers, Material Symbols CDN)
│   ├── page.tsx                      # Landing page (hero, features, FAQ, quick-start)
│   ├── providers.tsx                 # SessionProvider + QueryClientProvider (60s staleTime)
│   ├── globals.css                   # Tailwind + vapor blobs + grain texture + glass utilities
│   ├── (auth)/
│   │   ├── layout.tsx                # Pass-through layout
│   │   ├── login/page.tsx            # Google OAuth sign-in → /dashboard
│   │   └── signup/page.tsx           # Google OAuth sign-up → /onboarding
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Auth guard + Sidebar (hidden on /onboarding)
│   │   ├── onboarding/page.tsx       # 4-step form (basics, academics, interests, activities)
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Main overview (readiness, narrative, next moves, colleges)
│   │   │   ├── academics/page.tsx    # Course tracking (add/edit/delete, GPA calc, AI brain dump)
│   │   │   ├── activities/page.tsx   # Activity management (cards, modal, impact hours)
│   │   │   └── activity-booster/page.tsx  # AI chat coaching for selected activity
│   │   ├── roadmap/page.tsx          # 3-phase AI roadmap (tasks, priorities, quick wins)
│   │   ├── colleges/
│   │   │   ├── page.tsx              # College list (search, add, readiness calc, max 15)
│   │   │   └── [id]/page.tsx         # College detail (stats, tasks, readiness breakdown)
│   │   ├── opportunity-radar/page.tsx # AI opportunity discovery (filtered, bookmarkable)
│   │   └── strategic-path/page.tsx   # 3 strategic pathways with milestones
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── profile/route.ts                    # GET/POST user profile
│       ├── dashboard/route.ts                  # GET dashboard aggregation
│       ├── academics/courses/route.ts          # GET/POST courses
│       ├── academics/courses/[id]/route.ts     # PATCH/DELETE course
│       ├── activities/route.ts                 # GET/PUT/DELETE activities
│       ├── colleges/route.ts                   # GET/POST student colleges
│       ├── colleges/[id]/route.ts              # GET/DELETE student college
│       ├── colleges/[id]/tasks/route.ts        # GET college tasks
│       ├── colleges/[id]/generate-tasks/route.ts  # POST AI task generation
│       ├── colleges/search/route.ts            # GET search by name
│       ├── colleges/calculate-readiness/route.ts  # POST AI readiness score
│       ├── ai/generate-roadmap/route.ts        # POST 3-phase roadmap
│       ├── ai/admission-review/route.ts        # GET AI admissions officer review
│       ├── ai/boost-activity/route.ts          # POST conversational activity coaching
│       ├── ai/opportunity-radar/route.ts       # GET personalized opportunities
│       ├── ai/strategic-pathways/route.ts      # GET 3 strategic pathways
│       ├── ai/organize-courses/route.ts        # POST brain dump → structured courses
│       ├── ai/organize-activity/route.ts       # POST brain dump → structured activity
│       └── ai/structure-extracurriculars/route.ts # POST transcript → activity array
├── components/
│   ├── ui/                           # Primitives: Button, Card, Input, Label, Badge, Progress
│   ├── dashboard/
│   │   └── Sidebar.tsx               # 280px nav sidebar (7 items + settings)
│   ├── academics/
│   │   └── AcademicBrainDump.tsx     # Voice/text → AI course extraction
│   ├── activities/
│   │   ├── ActivityCard.tsx           # Activity display with category colors
│   │   └── ActivityModal.tsx          # Create/edit modal with AI brain dump
│   ├── colleges/
│   │   ├── CollegeCard.tsx            # College with readiness + action buttons
│   │   ├── CollegeSearchModal.tsx     # Debounced search + add modal
│   │   ├── ReadinessModal.tsx         # Readiness assessment wrapper
│   │   └── ReadinessBreakdown.tsx     # Detailed score breakdown display
│   └── voice/
│       ├── VoiceRecorder.tsx          # Speech-to-text with transcript display
│       └── ExtracurricularForm.tsx    # Activity list editor
├── lib/
│   ├── utils.ts                      # cn() (clsx+twMerge), formatDate(), getDaysUntil()
│   ├── db/prisma.ts                  # Prisma singleton client
│   ├── auth/
│   │   ├── auth-config.ts            # NextAuth config (Google OAuth, JWT, login streak)
│   │   └── session-helpers.ts        # Placeholder (getCurrentUser, requireAuth → not implemented)
│   ├── ai/
│   │   ├── anthropic-client.ts       # Anthropic SDK client + CLAUDE_MODEL constant
│   │   └── prompts/
│   │       ├── roadmap-generator.ts          # 3-phase roadmap (buildUserContext helper)
│   │       ├── admission-review.ts           # Admissions officer review
│   │       ├── activity-booster.ts           # Conversational activity coaching
│   │       ├── activity-organizer.ts         # Brain dump → single structured activity
│   │       ├── academic-organizer.ts         # Brain dump → structured courses
│   │       ├── extracurricular-structurer.ts # Transcript → activity array
│   │       ├── college-task-generator.ts     # College-specific task generation
│   │       ├── readiness-calculator.ts       # 0-100% college readiness scoring
│   │       ├── opportunity-radar.ts          # Personalized opportunity discovery
│   │       └── strategic-pathways.ts         # 3 narrative pathways + detailed roadmap
│   ├── hooks/
│   │   ├── use-dashboard.ts          # useDashboard() → /api/dashboard
│   │   ├── use-courses.ts            # useCourses(), useAddCourse(), useUpdateCourse(), useDeleteCourse()
│   │   └── use-activities.ts         # useActivities(), useSaveActivities(), useDeleteActivity()
│   ├── constants/
│   │   └── brain-dump-questions.ts   # Voice input guiding questions (academic + activity)
│   └── rate-limit/
│       ├── redis.ts                  # Upstash Redis client (null if no credentials)
│       ├── limiter.ts                # apiLimiter (300/hr), aiLimiterFree (15/day), aiLimiterPremium (100/day)
│       └── check-ai-limit.ts        # checkAiLimit() auth+rate check, logApiUsage() tracking
├── prisma/
│   ├── schema.prisma                 # Full database schema (15 models)
│   └── seed-colleges.ts              # Ivy League + top colleges seed data
├── tailwind.config.ts
├── next.config.ts                    # ESLint ignored on build, TS errors NOT ignored
├── tsconfig.json                     # Strict mode, @/* path alias
└── package.json                      # college-tracker v0.1.0
```

---

## 3. Design System

| Token | Value | Usage |
|-------|-------|-------|
| `bg-canvas` | `#FBF9F4` | Main background |
| `charcoal` | `#1d1d1f` | Primary text |
| `subtle-gray` | `#6e6e73` | Secondary text (WCAG AA) |
| `accent-green` | `#34c759` | Primary accent/CTA |
| `forest-700` | `#2D4B3E` | Sidebar active state |
| Font body | Inter (`--font-inter`) | Body text |
| Font display | Outfit (`--font-outfit`) | Headings |
| Icons | Material Symbols Outlined | CDN-loaded in root layout |
| Card radius | `rounded-[32px]` | Glass cards |
| Glass effect | `bg-white/50 backdrop-blur-2xl border border-white/40` | Card surfaces |
| Input style | `bg-white/60 border border-black/10 rounded-xl` | Form inputs |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2` | All interactive |
| Sidebar glass | `bg-white/30 backdrop-blur-xl` | Navigation |
| Background | Green vapor blobs + grain texture overlay | Dashboard bg |

---

## 4. Database Schema (Prisma)

### Core Models

**User** — `id` (cuid), `email` (unique), `name?`, `image?`, `emailVerified?`, `onboardingCompleted` (false), `onboardingStep` (0-3), `subscriptionTier` ("free"/"premium"), `stripeCustomerId?`, `lastLoginAt?`, `loginStreak` (0), `longestLoginStreak`, `totalLogins`, `totalPoints` (0), `currentLevel` (1). Relations: profile, roadmaps, tasks, courses, achievements, StudentCollege, apiUsages, accounts, sessions.

**Profile** — `userId` (unique, cascade). Demographics: `gradeLevel?` ("9"-"12"), `graduationYear?`, `location?`. Academics: `gpa?`, `gpaScale?` (4.0), `satScore?`, `actScore?`, `apCourses[]`, `honors[]`. Extracurriculars: `extracurriculars?` (JSON array), `leadership[]`, `awards[]`. Goals: `intendedMajors[]`, `careerInterests[]`, `collegePreferences?` (JSON). AI cache: `personalStatement?`, `admissionReview?` (JSON), `admissionReviewAt?`.

**Course** — `userId` (cascade). Fields: `name`, `type?` (AP/Honors/Regular), `semester?`, `year?`, `status` ("in_progress"), `letterGrade?`, `percentage?`, `credits` (1.0), `iconColor?`.

**Roadmap** — `userId` (cascade). Fields: `title`, `description?`, `generatedBy` ("claude"), `generatedAt`, `version` (1), `isActive` (true). Relations: phases[].

**Phase** — `roadmapId` (cascade). Fields: `title`, `description?`, `startDate?`, `endDate?`, `order`. Relations: tasks[].

**Task** — `userId` (cascade), `phaseId?` (SetNull), `collegeId?` (SetNull). Fields: `title`, `description?`, `category` (testing/essays/research/applications/financial_aid/extracurriculars/recommendations/visits), `priority` ("medium" — low/medium/high/urgent), `dueDate?`, `startDate?`, `status` ("pending" — pending/in_progress/completed/skipped), `completedAt?`, `isQuickWin` (false), `pointsValue` (10), `aiGenerated` (false), `order` (0).

### College Models

**College** — `name` (unique), `shortName?`, `location?`, `state?`, `type` (public/private/liberal-arts), `size?`, `setting?`. Admissions: `acceptanceRate?`, `applicationDeadline?`, `applicationDeadlineRegular?`, `earlyDeadline?`, `supplementalEssaysRequired` (false), `supplementalEssaysCount?`. Stats: `avgGPA?`, `gpa25th/75thPercentile?`, `sat25th/75thPercentile?`, `act25th/75thPercentile?`, `rankingNational?`, `rankingLibArts?`. Costs: `tuitionInState?`, `tuitionOutOfState?`, `roomAndBoard?`, `financialAidAvailable` (true). Campus: `studentToFacultyRatio?`, `undergraduateEnrollment?`, `graduateEnrollment?`. URLs: `website?`, `websiteUrl?`, `applicationPortal?`, `virtualTourUrl?`, `strongPrograms[]`.

**StudentCollege** — `userId` + `collegeId` (unique composite, both cascade). Fields: `listCategory?` (reach/target/safety), `applicationStatus` ("not_started"), `priority?`, `readinessPercentage?` (0-100), `lastReadinessUpdate?`, `addedAt`, `appliedAt?`, `decisionDate?`, `notes?`.

### Retention & Gamification

**Achievement** — `key` (unique), `name`, `description`, `icon?`, `category` (onboarding/tasks/streaks/milestones), `pointsValue` (0), `tier` (bronze/silver/gold/platinum), `criteria` (JSON).

**UserAchievement** — `userId` + `achievementId` (unique). Fields: `unlockedAt`, `viewed` (false).

**NotificationPreference** — `userId` (unique, cascade). Toggles: `emailEnabled`, `dailyDigest`, `weeklyInsights`, `deadlineReminders`, `milestoneNotifications`. `preferredTimeOfDay` ("morning"), `pushEnabled` (false).

**WeeklyInsight** — `weekStarting` + `category` (unique). Fields: `title`, `content`, `category` (tip/college_spotlight/deadline_reminder/strategy), `generatedBy`, `targetAudience?` (JSON).

**ActivityLog** — `userId`, `eventType` (login/task_completed/profile_updated/roadmap_generated), `eventData?` (JSON), `pointsAwarded?`.

### Auth Models (NextAuth)

**Account**, **Session**, **VerificationToken** — Standard NextAuth schemas with cascade deletes.

**ApiUsage** — `userId`, `endpoint`, `tokens` (0). Indexed by userId+createdAt.

---

## 5. API Endpoints

### Profile & Dashboard
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/profile` | Fetch/save user profile (onboarding data) |
| GET | `/api/dashboard` | Aggregated dashboard (readiness%, narrative, next moves, college insights) |

### Academics
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/academics/courses` | List/create courses (also returns cumulative + semester GPA) |
| PATCH/DELETE | `/api/academics/courses/[id]` | Update/delete course |

### Activities
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/PUT/DELETE | `/api/activities` | Fetch/update all/delete single activity (stored in profile.extracurriculars JSON) |

### Colleges
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/colleges` | List user colleges / add college (max 15) |
| GET/DELETE | `/api/colleges/[id]` | College detail / remove from list |
| GET | `/api/colleges/[id]/tasks` | College-specific tasks |
| POST | `/api/colleges/[id]/generate-tasks` | AI-generate college tasks |
| GET | `/api/colleges/search?q=` | Search colleges by name (top 10) |
| POST | `/api/colleges/calculate-readiness` | AI readiness assessment (24hr cache) |

### AI Endpoints (all rate-limited via checkAiLimit)
| Method | Endpoint | Purpose | Caching |
|--------|----------|---------|---------|
| POST | `/api/ai/generate-roadmap` | 3-phase roadmap generation | sessionStorage |
| GET | `/api/ai/admission-review` | Admissions officer review | 24hr DB cache |
| POST | `/api/ai/boost-activity` | Conversational activity coaching | None (chat) |
| GET | `/api/ai/opportunity-radar` | Personalized opportunities | 30min server + sessionStorage |
| GET | `/api/ai/strategic-pathways` | 3 strategic pathways | sessionStorage |
| POST | `/api/ai/organize-courses` | Brain dump → structured courses | None |
| POST | `/api/ai/organize-activity` | Brain dump → structured activity | None |
| POST | `/api/ai/structure-extracurriculars` | Transcript → activity array | None |

---

## 6. Components

### UI Primitives (`components/ui/`)
- **Button** — CVA variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon.
- **Card** — Compound: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
- **Input** — Standard text input with focus-visible ring.
- **Label** — Form label with peer-disabled states.
- **Badge** — CVA variants: default, secondary, destructive, outline. Rounded-full.
- **Progress** — Radix UI Progress primitive with animated fill.

### Dashboard (`components/dashboard/`)
- **Sidebar** — 280px, 7 nav items (Overview, Academics, Activities, Activity Booster, Strategic Path, Colleges, Opportunity Radar). Active: `bg-forest-700/10 text-forest-700`. Glass: `bg-white/30 backdrop-blur-xl`.

### Academics (`components/academics/`)
- **AcademicBrainDump** — Textarea with mic button → POST `/api/ai/organize-courses` → preview extracted courses → bulk add via `useAddCourse`. Speech-to-text via Web Speech API.

### Activities (`components/activities/`)
- **ActivityCard** — Category-colored card (sports=orange, arts=pink, academic=blue, community=purple, work=amber, leadership=emerald). Shows name, role, hours/week, years, achievements. Edit/delete buttons.
- **ActivityModal** — Full create/edit modal. AI brain dump for new activities (POST `/api/ai/organize-activity`). Form: name, role, category, status, hours, years, description, achievements list. Voice input support.

### Colleges (`components/colleges/`)
- **CollegeCard** — College info + category badge (reach=red, target=blue, safety=green). Stats, readiness bar, action buttons (Calculate Readiness, Generate Tasks, Remove).
- **CollegeSearchModal** — Debounced search (300ms) → `/api/colleges/search`. Auto-focus, scrollable results, add button.
- **ReadinessModal** — Wrapper for ReadinessBreakdown display.
- **ReadinessBreakdown** — Overall % + category + score bars (academics/40, testScores/25, extracurriculars/20, applicationProgress/15) + strengths/gaps/nextSteps.

### Voice (`components/voice/`)
- **VoiceRecorder** — Web Speech API recorder with start/stop, interim text display, word count, clear button.
- **ExtracurricularForm** — Editable activity list with inline edit mode, category color badges, add/remove.

---

## 7. AI Prompts (`lib/ai/prompts/`)

All prompts require JSON-only output (no markdown). Model: `claude-sonnet-4-5-20250929`.

| File | Purpose | Key Output |
|------|---------|------------|
| `roadmap-generator.ts` | 3-phase roadmap with 3 tasks each | `{ phases: [{ title, tasks: [{ title, category, priority, dueDate, isQuickWin }] }] }` |
| `admission-review.ts` | Admissions officer assessment | `{ summary, strengths[], weaknesses[], improvements[] }` |
| `activity-booster.ts` | Conversational activity coaching | Multi-turn chat messages |
| `activity-organizer.ts` | Brain dump → single structured activity | `{ name, role, category, hoursPerWeek, yearsParticipated, description, achievements[], status }` |
| `academic-organizer.ts` | Brain dump → structured courses | `OrganizedCourse[]` (name, type, grade, percentage, credits, iconColor) |
| `extracurricular-structurer.ts` | Transcript → activity array | `ExtracurricularActivity[]` (name, role, category, hours, years, description) |
| `college-task-generator.ts` | College-specific tasks (5-8) | `{ tasks[], applicationDeadline, essayPrompts[], collegeSpecificNotes }` |
| `readiness-calculator.ts` | College readiness 0-100% | `{ readinessPercentage, category, scores: { academics/40, testScores/25, extracurriculars/20, applicationProgress/15 }, strengths[], gaps[], nextSteps[] }` |
| `opportunity-radar.ts` | 10-12 personalized opportunities | `Opportunity[]` (title, category, type, matchPercentage, deadline, difficulty, scope, url) |
| `strategic-pathways.ts` | 3 strategic narrative pathways | `StrategicPathway[]` (title, confidence%, icon, colorTheme, relatedMajors, keyStrengths, nextSteps) |

Helper: `buildUserContext(profile, colleges)` in roadmap-generator.ts assembles full student context for prompts.

---

## 8. Custom Hooks (`lib/hooks/`)

**useDashboard()** → GET `/api/dashboard`. Returns: `{ user, profile, stats (readiness%, narrative, impactHours, profileRank), nextMoves[], gaps[], colleges[], collegeInsights[] }`.

**useCourses()** → GET `/api/academics/courses`. Returns: `{ courses[], profile (gpa, awards, scores), user, semesterInfo }`.
- `useAddCourse()` → POST, invalidates "courses" + "dashboard"
- `useUpdateCourse()` → PUT, invalidates "courses" + "dashboard"
- `useDeleteCourse()` → DELETE, invalidates "courses" + "dashboard"

**useActivities()** → GET `/api/activities`, selects `.activities[]`.
- `useSaveActivities()` → PUT, invalidates "activities" + "dashboard"
- `useDeleteActivity()` → DELETE with `?id=`, invalidates "activities" + "dashboard"

---

## 9. Authentication

- **Provider:** Google OAuth (NextAuth v4, JWT strategy)
- **Session:** JWT-based (no DB sessions). `token.sub` = user.id injected into session.
- **Sign-in callback:** Triggers `trackLogin()` → increments streak, awards 5 points, unlocks achievements (early_bird@3 days, week_warrior@7 days).
- **Pages:** `/login` (sign in → /dashboard), `/signup` (sign up → /onboarding).
- **Dashboard layout:** `useSession()` guard, redirects unauthenticated to `/login`.

---

## 10. Key Data Flows

### Onboarding → Dashboard
1. Landing page quick-start stores grade/year in sessionStorage
2. `/onboarding` 4-step form: basics → academics → interests → activities (voice or text)
3. Step 4 voice transcript → POST `/api/ai/structure-extracurriculars` → parsed activities
4. Submit → POST `/api/profile` (upserts Profile, sets onboardingCompleted=true, awards 50pts)
5. Then → POST `/api/ai/generate-roadmap` → redirects to `/dashboard`

### Dashboard Aggregation
`/api/dashboard` computes: readiness% across colleges, profile rank (A-F), competitiveness percentile, narrative theme/description, impact hours (hoursPerWeek * 40 * years), next moves (prioritized tasks), college insights.

### AI Rate Limiting
1. Every AI endpoint calls `checkAiLimit()`
2. Gets session → fetches user subscriptionTier
3. Free: 15 calls/24hr, Premium: 100 calls/24hr (sliding window via Upstash Redis)
4. Returns 429 with retry-after if exceeded
5. `logApiUsage()` records to ApiUsage table
6. Graceful fallback: allows all if Redis unavailable

### Caching Strategy
- **Prompt caching:** System prompts use `cache_control: "ephemeral"` for reuse
- **DB caching:** Admission review (24hr in profile.admissionReviewAt)
- **Server-side:** Opportunity radar (30min in-memory Map)
- **Client-side:** sessionStorage for roadmaps, pathways, opportunities (survives navigation, not refresh)
- **React Query:** 60s staleTime, auto-refetch on window focus

---

## 11. Environment Variables

```env
DATABASE_URL=                          # PostgreSQL connection string
NEXTAUTH_URL=http://localhost:3000     # Auth callback URL
NEXTAUTH_SECRET=                       # openssl rand -base64 32
GOOGLE_CLIENT_ID=                      # Google OAuth
GOOGLE_CLIENT_SECRET=                  # Google OAuth
ANTHROPIC_API_KEY=                     # Claude API (CRITICAL - AI features fail without)
UPSTASH_REDIS_REST_URL=                # Rate limiting (optional - allows all if missing)
UPSTASH_REDIS_REST_TOKEN=              # Rate limiting
RESEND_API_KEY=                        # Email service
STRIPE_SECRET_KEY=                     # Payments (partially implemented)
STRIPE_WEBHOOK_SECRET=                 # Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=    # Payments
CRON_SECRET=                           # Vercel cron auth
NEXT_PUBLIC_POSTHOG_KEY=               # Analytics (optional)
```

---

## 12. Key Patterns & Conventions

- **All dashboard pages** are client components with `"use client"` + `useSession()`
- **Sidebar** hidden on `/onboarding` route (checked via `usePathname()`)
- **Glass cards:** `bg-white/50 backdrop-blur-2xl border border-white/40 rounded-[32px] p-8`
- **Modals:** Fixed overlay z-[200], glass card, Escape to close, click backdrop to close
- **Voice input:** Web Speech API with `continuous: true`, `interimResults: true`, mic button with pulse animation
- **AI fallback:** All AI endpoints return mock data if `ANTHROPIC_API_KEY` is missing
- **Task cards:** Full-card clickable via `<Link>`, not just chevrons
- **Accessibility:** aria-hidden on decorative icons, role="progressbar" with ARIA attrs, focus-visible rings, min font text-xs (12px), subtle-gray adjusted to #6e6e73 for WCAG AA
- **Category colors:** sports=orange, arts=pink, academic=blue, community_service=purple, work=amber, leadership=emerald, other=gray
- **React Query invalidation:** Mutations always invalidate both the resource query AND "dashboard"
- **Icons:** Material Symbols Outlined (CDN) for navigation, Lucide React for inline icons

---

## 13. Sidebar Navigation Items

| Label | Icon | Route |
|-------|------|-------|
| Overview | grid_view | /dashboard |
| Academics | school | /dashboard/academics |
| Activities | sports_esports | /dashboard/activities |
| Activity Booster | bolt | /dashboard/activity-booster |
| Strategic Path | map | /strategic-path |
| Colleges | account_balance | /colleges |
| Opportunity Radar | radar | /opportunity-radar |
| Settings | settings | (footer) |

---

## 14. Seed Data

`prisma/seed-colleges.ts` populates College table with Ivy League + top universities. Each entry includes: name, shortName, location, state, type, size, setting, avgGPA, GPA/SAT/ACT percentiles, acceptanceRate, applicationDeadlineRegular, supplementalEssaysCount, strongPrograms[], websiteUrl.

Run: `npx prisma db seed`

---

## 15. Development Notes

- `prisma generate` runs on `npm install` (postinstall hook)
- ESLint errors ignored during build (`next.config.ts`)
- TypeScript strict mode enabled
- Path alias: `@/*` → project root
- Dark mode: class-based (toggle on landing page only currently)
- Stripe subscription: config exists but not fully implemented
- `lib/auth/session-helpers.ts`: `getCurrentUser()` and `requireAuth()` are stubs (not implemented)

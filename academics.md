# Academics & Grades Page — Implementation Progress

## Status: Complete & Functional

## What Was Built

### 1. Database — Prisma `Course` Model
**File:** `prisma/schema.prisma` (lines 95-114)

Added a `Course` model with fields:
- `id`, `userId` (relation to User)
- `name` — course name (e.g., "AP Calculus BC")
- `type` — "AP", "Honors", "Regular", "IB", "Dual Enrollment"
- `semester` — "Fall 2024", "Spring 2025", etc.
- `year` — "Senior", "Junior", etc.
- `status` — "in_progress", "completed", "dropped"
- `letterGrade` — "A+", "A", "A-", "B+", ... "F"
- `percentage` — 0-100 float
- `credits` — float, default 1.0
- `iconColor` — UI color key ("blue", "purple", "orange", "emerald", "red", "amber", "pink", "cyan")

Also added `courses Course[]` relation on the `User` model (line 46).

Schema has been pushed to the database (`npx prisma db push` already run).

### 2. API Routes

#### `app/api/academics/courses/route.ts` — GET & POST
- **GET**: Returns all courses for authenticated user, profile data (GPA, awards, grade level, graduation year), user info (name, image), and a computed semester label string
- **POST**: Creates a new course, recalculates cumulative GPA from all non-dropped courses with letter grades, updates `Profile.gpa`
- GPA calculation: letter grade → GPA points (A=4.0, A-=3.7, B+=3.3, etc.), weighted by credits

#### `app/api/academics/courses/[id]/route.ts` — PUT & DELETE
- **PUT**: Updates a course by ID (ownership verified), recalculates GPA
- **DELETE**: Deletes a course by ID (ownership verified), recalculates GPA
- Both return the new GPA after recalculation

### 3. Page Component
**File:** `app/(dashboard)/dashboard/academics/page.tsx`

**Route:** `/dashboard/academics` (already linked in Sidebar.tsx)

#### UI Sections (matching Google Stitch design):
1. **Header** — "Academics & Grades." title + dynamic semester label from profile + user avatar
2. **GPA Summary Card** — glass-card with:
   - Cumulative GPA (calculated from courses, falls back to profile GPA)
   - Dynamic trend badge showing real GPA delta (+0.30, -0.17, etc.) — updates live when courses are added/edited/deleted
   - Sparkline SVG that flips between upward green curve and downward red curve based on trend direction
   - "Add Grade" button (opens modal)
   - "Download Report" button (placeholder)
3. **Current Courses Table** — glass-card with:
   - Color-coded initial icon per course
   - Course name + type badge
   - Status badge (In Progress / Completed / Dropped) with color coding
   - Letter grade display
   - Percentage progress bar with `role="progressbar"` + ARIA attributes
   - Edit button (opens modal pre-filled)
   - Delete button with loading state
   - Empty state with CTA when no courses exist
4. **Documents Sidebar** (right panel, w-80):
   - Official Transcripts section with placeholder PDF card + upload CTA
   - Certificates & Awards pulled from `Profile.awards[]` with smart icon matching (merit → military_tech, scholar → workspace_premium, olympiad → verified)
   - AI Insight card (blue-600 bg) with GPA-based messaging

#### Modal (Add/Edit Course):
- Glassmorphism overlay with backdrop blur
- Fields: Course Name*, Type (select), Icon Color (visual picker), Letter Grade (select), Percentage (number), Semester (text), Status (select), Credits (number)
- Escape key closes modal
- Auto-focuses first input on open
- `role="dialog"` + `aria-modal="true"`
- Color picker buttons have `aria-pressed`

#### Dynamic GPA Behavior:
- `previousGpa` state tracks GPA before each data refresh
- When a course is added/edited/deleted → `fetchData()` saves old GPA → loads new data → computes delta
- Trend badge shows real change (hidden when delta is 0 or on first load)
- Sparkline direction flips based on positive/negative delta

### 4. Accessibility
- All decorative icons: `aria-hidden="true"`
- All interactive elements: `focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2`
- Progress bars: `role="progressbar"` + `aria-valuenow/min/max/label`
- Modal: `role="dialog"`, `aria-modal="true"`, escape key handler, auto-focus
- Color buttons: `aria-pressed` state
- Font sizes: minimum `text-xs` (12px), `text-[11px]` only on uppercase tracking-widest labels (design system pattern)
- Responsive: `flex-col lg:flex-row` layout, `overflow-x-auto` table with `min-w-[700px]`

### 5. Bug Fix (pre-existing)
- Fixed type error in `app/api/activities/route.ts` line 92 — changed `Record<string, unknown>[]` cast to `Prisma.InputJsonValue` to fix build failure

## Files Created/Modified
| File | Action |
|------|--------|
| `prisma/schema.prisma` | Modified — added Course model + User relation |
| `app/api/academics/courses/route.ts` | Created — GET + POST |
| `app/api/academics/courses/[id]/route.ts` | Created — PUT + DELETE |
| `app/(dashboard)/dashboard/academics/page.tsx` | Created — full page component |
| `app/api/activities/route.ts` | Fixed — Prisma type cast bug |

## Design System Compliance
- Glass cards: `glass-card rounded-[32px]`
- Colors: bg-canvas, charcoal, subtle-gray, accent-green
- Fonts: Inter (body), Outfit (display/headings via `font-display`)
- Icons: Material Symbols Outlined (CDN)
- Track labels: `text-[11px] font-bold text-subtle-gray uppercase tracking-widest`

## What's NOT Implemented (Placeholders)
- **Download Report** button — UI exists but no export logic
- **Upload Transcript** — UI exists but no file upload backend
- **Document management** — no CRUD for transcripts/certificates (awards come from Profile)
- **Dark mode** — classes exist in the Stitch design but the dashboard layout doesn't toggle dark mode

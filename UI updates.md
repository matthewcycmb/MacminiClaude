# UI Updates - Dashboard Overview (Feb 2026)

## What Changed

Converted the Google Stitch HTML design into a fully functional Next.js dashboard overview page. The old dashboard (basic card grid with blue theme) was replaced with an Apple-inspired glassmorphism design using a sidebar layout.

---

## Files Created

### `components/dashboard/Sidebar.tsx`
- 280px fixed sidebar with navigation links
- 6 nav items: Overview, Academics, Activities, Activity Booster, Strategic Path, Opportunity Radar
- Settings link at bottom
- Active state highlighting based on current pathname
- Material Symbols icons, focus-visible rings for accessibility

### `app/api/dashboard/route.ts`
- GET endpoint that aggregates all dashboard data in one call
- Computes **admission readiness %** from: GPA (25pts), SAT (25pts), extracurriculars (20pts), colleges (15pts), task completion (15pts)
- Computes **impact hours** from extracurricular hoursPerWeek * 40 weeks * years
- Determines **narrative theme** from intended majors (Tech + Engineering, STEM + Healthcare, Creative Arts, etc.)
- Calculates **profile rank** (A+ through B) based on readiness score
- Identifies **admission gaps** (missing test scores, few activities, small college list, low GPA)
- Returns: user info, profile, stats, next 3 tasks, gaps, colleges

---

## Files Modified

### `app/(dashboard)/layout.tsx`
- **Before**: Top navigation bar with blue theme
- **After**: Sidebar layout with `<Sidebar />` component + green vapor blob backgrounds + grain texture overlay
- Hides sidebar on `/onboarding` page
- Loading state uses branded rocket icon

### `app/(dashboard)/dashboard/page.tsx`
- **Before**: Basic card grid (level, streak, tasks, points) + quick wins + upcoming tasks
- **After**: Full strategic dashboard with sections:
  1. **Header** - "Welcome, {firstName}." with graduation year + avatar
  2. **Current Direction Banner** - Narrative theme, profile rank, global percentile
  3. **Strategy & Focus** - Two cards: AI Strategic Focus (green border) + Key Admission Gaps (orange border)
  4. **Bento Grid** - Admission Readiness (progress bar), Next 3 Moves (task cards), Quick Stats (GPA, hours, schools)
- Fetches from `/api/dashboard` instead of `/api/colleges`
- Error state with retry button
- Empty states with guided CTAs when no data exists

### `app/layout.tsx`
- Added Material Symbols Outlined font via CDN `<link>` in `<head>`
- Added `--font-inter` CSS variable to Inter font config
- Updated metadata title to "Admit AI - Strategic College Admissions"

### `tailwind.config.ts`
- Added `accent-green: "#34c759"`
- Changed `bg-canvas` from `#f5f7f9` to `#fcfdfc`
- Changed `subtle-gray` from `#6e6e73` to `#6b6b70` (WCAG AA contrast fix)
- Added `sans` font family with `--font-inter` variable

### `app/globals.css`
- Updated `glass-card` to `bg-white/50` (was `bg-white/40`)
- Added `bento-grid` utility (12-column CSS grid, 1.5rem gap)
- Added `vapor-green-1` and `vapor-green-2` blob styles (green gradients replacing teal/blue)
- Reduced vapor blob size from 1600px to 1000px, blur from 200px to 140px, opacity from 0.45 to 0.25

---

## Design System Reference

| Token | Value | Usage |
|-------|-------|-------|
| `bg-canvas` | `#fcfdfc` | Page background |
| `charcoal` | `#1d1d1f` | Primary text |
| `subtle-gray` | `#6b6b70` | Secondary text (WCAG AA) |
| `accent-green` | `#34c759` | Badges, progress bars, highlights |
| `font-display` | Outfit | Headings, large text |
| `font-sans` | Inter | Body text |
| Card radius | `rounded-[32px]` | All glass cards |
| Glass card | `glass-card` class | Frosted glass effect |
| Icons | Material Symbols Outlined | 20px default size |

## Accessibility

- All decorative icons have `aria-hidden="true"`
- Progress bars have `role="progressbar"` + `aria-valuenow/min/max`
- Loading state has `role="status"` + `aria-live="polite"`
- All interactive elements have `focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2`
- Task cards are full `<Link>` elements (not just chevron icons)
- Minimum font size is `text-xs` (12px) - no sub-12px text

## Responsive Breakpoints

- **Mobile** (`< 768px`): All bento grid cards stack vertically
- **Tablet** (`md: 768px`): Readiness + Quick Stats side by side, Next 3 Moves full width
- **Desktop** (`lg: 1024px`): 3-column bento (4 + 5 + 3 col spans)

## API Data Flow

```
User logs in -> /api/dashboard (GET)
  -> Fetches: user + profile + colleges + tasks + roadmaps
  -> Computes: readinessPercentage, profileRank, impactHours, narrativeTheme, gaps
  -> Returns: { user, profile, stats, nextMoves, gaps, colleges }
```

## Sidebar Navigation Routes

| Route | Label | Icon | Status |
|-------|-------|------|--------|
| `/dashboard` | Overview | grid_view | Implemented |
| `/dashboard/academics` | Academics | school | Page not yet created |
| `/dashboard/activities` | Activities | sports_esports | Page not yet created |
| `/dashboard/activity-booster` | Activity Booster | bolt | Page not yet created |
| `/roadmap` | Strategic Path | map | Existing page |
| `/colleges` | Opportunity Radar | radar | Existing page |
| `/dashboard/settings` | Settings | settings | Page not yet created |

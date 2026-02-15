# Activities Page Implementation Plan

## Overview
Build a fully functional Activity Portfolio page matching the Google Stitch UI design. Users can view, add, edit, and delete their extracurricular activities with a glassmorphism card-based layout.

## Data Model

Extend the existing `Profile.extracurriculars` JSON field (no Prisma migration needed) to include `achievements` and `status`:

```typescript
interface Activity {
  id: string               // client-generated UUID for identification
  name: string
  role: string
  category: "sports" | "arts" | "academic" | "community_service" | "work" | "leadership" | "other"
  hoursPerWeek: number
  yearsParticipated: number
  description: string
  achievements: string[]   // NEW - key accomplishments
  status: "ongoing" | "seasonal" | "completed"  // NEW - activity status
}
```

Backward-compatible: existing activities without `achievements` or `status` will get defaults (`[]` and `"ongoing"`).

## Files to Create

### 1. `app/api/activities/route.ts` — API Endpoint
- **GET**: Fetch activities from `Profile.extracurriculars` JSON, normalizing old data
- **PUT**: Save entire activities array back to `Profile.extracurriculars`
- **DELETE**: Remove a single activity by `id` (via query param)
- Auth: `getServerSession(authOptions)` pattern

### 2. `app/(dashboard)/dashboard/activities/page.tsx` — Main Page
- Client component with `useSession()`
- Fetch activities on mount via `GET /api/activities`
- Header: "Activity Portfolio." + "Add New Activity" CTA
- Activity cards list, empty state, loading spinner

### 3. `components/activities/ActivityCard.tsx` — Card Component
- Glass card (rounded-[32px]) matching the Stitch design
- Category icon with colored background
- Activity name, status badge, role, hours/week, years
- Key Achievements section with colored bullet points
- Edit + Delete actions

### 4. `components/activities/ActivityModal.tsx` — Add/Edit Modal
- Glassmorphism modal with backdrop blur
- Fields: name, role, category, hours/week, years, status, description, achievements (dynamic list)
- Used for both Add and Edit modes

## Category Icon/Color Mapping
- sports → `sports_tennis` / orange
- arts → `palette` / pink
- academic → `smart_toy` / blue
- community_service → `volunteer_activism` / purple
- work → `work` / amber
- leadership → `groups` / emerald
- other → `category` / gray

## Implementation Order
1. Create API route
2. Create ActivityCard component
3. Create ActivityModal component
4. Create Activities page
5. Test full CRUD flow

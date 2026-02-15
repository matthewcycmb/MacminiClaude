# UI/UX Evaluator Memory

## Project: Admit AI College Tracking Dashboard

### Design System
- **Color Palette**: Black (#1d1d1f), White, Green (#34c759), Orange (warnings), Gray (#86868b)
- **Typography**: Outfit (display), Inter (body) - both loaded via Google Fonts
- **Border Radius**: Consistent 32px for cards, 12px for small elements
- **Glassmorphism Pattern**: `bg-white/50 backdrop-blur-2xl border border-white/40`
- **Icons**: Material Symbols Outlined (20px standard size)

### Common Accessibility Issues Found
1. **Color Contrast**: `text-subtle-gray` (#86868b) fails WCAG AA (3.5:1 ratio). Recommended: #6b6b70 (4.7:1)
2. **Font Size Violations**: Heavy use of 9px, 10px, 11px below minimum 12px accessibility standard
3. **Missing ARIA Labels**: Icons, progress bars, loading states need semantic markup
4. **Non-Semantic Interactive Elements**: Divs styled as buttons/links without proper HTML elements
5. **Keyboard Navigation Gaps**: Focus indicators missing on most interactive elements

### Recurring UX Anti-Patterns
1. **Partial Click Targets**: Cards appear interactive but only icon/chevron is clickable
2. **Visual Affordance Mismatch**: Elements look clickable but aren't, or vice versa
3. **Typography Overload**: 10+ font sizes create visual noise (consolidate to 5-6)
4. **Uppercase Overuse**: Decreases readability by 10-15%, reserve for true emphasis
5. **Missing Intermediate Breakpoints**: Responsive layouts lack md: variants causing awkward tablet views

### React/Next.js Patterns
- **Client Components**: Dashboard uses `"use client"` with useState/useEffect for data fetching
- **Loading States**: Simple centered loading without skeleton screens (improvement opportunity)
- **Error Handling**: Console logs but no user-facing error messages
- **Empty States**: Well-implemented fallback content with actionable CTAs

### Glassmorphism Best Practices
- Keep backdrop blur around 2xl (24px) for performance
- Layer opacity: cards 50-60%, inputs 60-80% when focused
- Always include subtle border (white/40%) for definition
- Grain texture overlay at 0.04 opacity for visual interest
- Vapor blobs positioned fixed with 140px blur, 25% opacity

### Quick Fix Checklist
- [x] Change subtle-gray to darker shade for WCAG AA compliance (#6b6b70)
- [x] Replace divs with semantic Link/button elements
- [x] Add aria-hidden="true" to decorative icons
- [x] Add focus-visible ring to all interactive elements
- [ ] **CRITICAL**: Replace ALL text-[10px] with text-xs (minimum 12px) - found in status badges, document metadata, AI insight labels
- [x] Add role/aria attributes to progress bars (found excellent implementation in academics page)
- [x] Wrap full cards in links, not just icons
- [ ] Add lg: breakpoints for responsive layouts (sidebar stacking)
- [ ] Add overflow-x-auto to tables for mobile handling

### Activities Page Specific Patterns
- **Status Badges**: 10px font size (text-[10px]) violates accessibility minimum
- **Category Icons**: Colorful icon system (sports=orange, arts=pink, academic=blue, etc.) provides good visual scanning
- **Achievement Lists**: Colored bullet points (1.5px) match category colors - good visual hierarchy
- **Modal Form**: Well-structured 2-column grid layout, proper focus management with Escape key support
- **Delete Confirmation**: Proper alertdialog role with clear destructive action warning
- **Modal Focus**: Uses useEffect for keyboard listeners, proper aria-modal and role attributes

### Academics Page Specific Patterns
- **Table Design**: Clean data table with 5 columns (Class Name, Status, Grade, Percentage, Action)
- **Progress Bars**: EXCELLENT accessibility - role="progressbar" with aria-valuenow/min/max/label
- **GPA Display**: Large 5xl text with trend badge (emerald for positive, red for negative)
- **Modal WITHOUT Focus Trap**: Critical accessibility gap - no Escape key handler, no focus containment
- **Silent Error Handling**: Network errors caught but not displayed to users (bad UX)
- **No Table Overflow Protection**: Missing overflow-x-auto wrapper for mobile responsiveness
- **Font Size Violations**: text-[10px] in status badges (line 398), document metadata (469), AI insight label (511)
- **Layout Responsiveness**: Main + sidebar flex layout needs lg:flex-row for tablet/mobile stacking
- **Color Icon Picker**: Visual-only selection feedback, should add aria-pressed state
- **Decorative Sparkline**: SVG trend chart adds visual noise without real data - removal candidate

### Activity Booster Page Patterns (NEW)
- **Horizontal Pill Selector**: Activities as scrollable pills with masked gradient fade (no scroll indicators)
- **Chat Interface Design**: Black AI avatar + white/60 bubble (left), black user bubble + profile image (right)
- **Evolution Bar**: Motivational footer showing "Participation → Leadership + Impact" progression (superficial logic)
- **Quick Prompts Pattern**: Suggestion buttons appear only on initial greeting, disappear after first message
- **Font Violations PERSIST**: text-[9px] at lines 288, 389; text-[10px] at lines 215, 296, 361
- **Uppercase Epidemic**: 7+ uppercase elements (title, badges, labels) reduce readability
- **Missing ARIA Live**: Chat container lacks role="log" aria-live="polite" for screen reader notifications
- **Non-Semantic Navigation**: Uses `<a>` instead of Next.js `<Link>`, causing full page reloads
- **Horizontal Scroll Trap**: Keyboard users can't navigate pills without mouse/trackpad
- **Auto-Scroll Issue**: No way to pause auto-scroll when reading previous messages

### Dashboard Page Specific Patterns (EVALUATED 2026-02-12)
- **Bento Grid Layout**: 12-column grid with 4-5-3 column distribution (Readiness, Next Moves, Quick Stats)
- **CRITICAL RESPONSIVE GAP**: Missing md: breakpoints on bento grid - will collapse awkwardly <1024px
- **Hero Card Pattern**: "Current Direction" with narrative theme, profile rank, competitiveness
- **College Insights Overload**: 9 UI elements per card - remove "AI Insight:" prefix, inline fit score with name
- **Category Color Fragmentation**: 8 different task colors - consolidate to 4 semantic colors (green=progress, blue=research, purple=action, amber=urgent)
- **Accessibility STRENGTHS**: Progress bar with full ARIA, all icons hidden, focus-visible rings, semantic HTML
- **No Skeleton Loading**: Simple spinner causes layout shift - needs skeleton cards matching final layout
- **Uppercase Overuse**: 7 instances (lines 220, 231, 250, 259, 263, 459, 463, 467) - reserve for emphasis only
- **Clearbit Logo Pattern**: Fetch from `logo.clearbit.com/${domain}`, fallback to initial letter on error

### Dashboard API Integration
- **Endpoint**: `/api/dashboard` - aggregates readiness %, profile rank, competitiveness, narrative theme, next moves
- **Error Handling**: User-facing error card with retry button (good UX pattern)
- **Loading State**: role="status" aria-live="polite" with animated rocket icon (accessible)
- **Empty State**: Actionable CTAs when no tasks exist (Generate Roadmap, Browse Colleges, Add Activities)

### Related Files
- `/app/(dashboard)/dashboard/page.tsx` - Main dashboard page (EVALUATED 2026-02-12)
- `/app/(dashboard)/dashboard/activities/page.tsx` - Activities portfolio page
- `/app/(dashboard)/dashboard/academics/page.tsx` - Academics & Grades page
- `/app/(dashboard)/dashboard/activity-booster/page.tsx` - AI chat for activity enhancement
- `/app/(dashboard)/layout.tsx` - Layout with sidebar and background effects
- `/components/dashboard/Sidebar.tsx` - Navigation sidebar
- `/components/activities/ActivityCard.tsx` - Individual activity display cards
- `/components/activities/ActivityModal.tsx` - Add/Edit activity form modal
- `/app/globals.css` - Glass card utilities, vapor blobs, grain texture, bento-grid
- `/tailwind.config.ts` - Custom color tokens and font variables
- `/app/api/dashboard/route.ts` - Dashboard data aggregation endpoint
- `/app/api/academics/courses/route.ts` - GET/POST endpoints for courses
- `/app/api/academics/courses/[id]/route.ts` - PUT/DELETE endpoints for individual courses
- `/app/api/ai/boost-activity/route.ts` - AI activity enhancement endpoint
- `/lib/ai/prompts/activity-booster.ts` - System prompt for activity advisor

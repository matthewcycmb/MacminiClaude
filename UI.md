# College Tracker - UI Design System

**Last Updated:** February 8, 2026

---

## 🎨 Design Philosophy

College Tracker uses a modern, clean design inspired by Exa.ai's visual language. The interface prioritizes:
- **Clarity:** Clear hierarchy and readable typography
- **Interactivity:** Smooth transitions and hover states
- **Trust:** Professional aesthetics with subtle decorative elements
- **Accessibility:** High contrast, readable fonts, clear focus states

---

## 🎯 Color Palette

### Primary Colors

```css
/* Brand Blue (Primary) */
--brand-primary: #0046FF;
--brand-primary-hover: #0039CC;
--brand-primary-active: #002D99;

/* Background */
--bg-primary: #FAFAF9;        /* Off-white, warm */
--bg-secondary: #FFFFFF;      /* Pure white for cards */

/* Text */
--text-primary: #111827;      /* Gray-900 */
--text-secondary: #4B5563;    /* Gray-600 */
--text-tertiary: #9CA3AF;     /* Gray-400 */

/* Accents */
--accent-blue: #3B82F6;       /* Blue-500 */
--accent-purple: #9333EA;     /* Purple-600 */
--accent-green: #10B981;      /* Green-500 */

/* Semantic */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Gradient Decorations

```css
/* Decorative background gradients (corners) */
--gradient-blue: rgba(59, 130, 246, 0.35);
--gradient-purple: rgba(147, 51, 234, 0.25);
```

---

## 📝 Typography

### Font Family
- **Primary:** System font stack (Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)
- **Fallback:** System sans-serif

### Font Sizes

```css
/* Headings */
--text-6xl: 3.75rem;    /* 60px - Hero headline (mobile: 36px, tablet: 48px) */
--text-5xl: 3rem;       /* 48px - Large headings */
--text-4xl: 2.25rem;    /* 36px - Section headings */
--text-3xl: 1.875rem;   /* 30px - Section titles */
--text-xl: 1.25rem;     /* 20px - Subheadings */
--text-lg: 1.125rem;    /* 18px - Card titles, subtitle */
--text-base: 1rem;      /* 16px - Default body, form title */

/* Small Text */
--text-sm: 0.875rem;    /* 14px - Nav, buttons, labels */
--text-xs: 0.75rem;     /* 12px - Captions, privacy notes */
```

### Font Weights

```css
--font-semibold: 600;   /* Hero headings (reduced from bold) */
--font-medium: 500;     /* Form titles, labels, buttons, nav items */
--font-normal: 400;     /* Body text */
```

### Line Heights

```css
--leading-heading: 1.2;    /* Large headings (improved from 1.1) */
--leading-snug: 1.375;     /* Subheadings */
--leading-normal: 1.5;     /* Body text */
--leading-relaxed: 1.625;  /* Long-form content, subtitles */
```

---

## 📐 Spacing System

### Scale (using Tailwind's spacing)

```css
0.5 = 2px
1 = 4px
2 = 8px
3 = 12px
4 = 16px
5 = 20px
6 = 24px
8 = 32px
12 = 48px
16 = 64px
20 = 80px
24 = 96px
```

### Common Patterns

- **Buttons:** `px-8 py-3.5` (32px horizontal, 14px vertical)
- **Form Cards:** `p-8` (32px all sides - improved from 24px)
- **Feature Cards:** `p-6` (24px all sides)
- **Containers:** `px-6` (24px horizontal)
- **Sections:** `py-12 md:py-16 lg:py-20` (48px/64px/80px vertical - reduced from 80px/112px)
- **Form Fields:** `space-y-5` (20px gap - improved from 16px)
- **Label spacing:** `space-y-1.5` (6px gap between label and input)

---

## 🔲 Border Radius

```css
/* Sizes */
--rounded-sm: 0.125rem;   /* 2px */
--rounded: 0.25rem;       /* 4px */
--rounded-md: 0.375rem;   /* 6px */
--rounded-lg: 0.5rem;     /* 8px - Logo squares */
--rounded-xl: 0.75rem;    /* 12px - Input fields */
--rounded-2xl: 1rem;      /* 16px - Feature cards */
--rounded-custom: 0.875rem; /* 14px - Search/form inputs */
--rounded-btn: 0.625rem;  /* 10px - Buttons */
```

### Usage

- **Inputs:** `12px` (rounded-xl)
- **Buttons:** `12px` (rounded-xl)
- **Form Cards:** `16px` (rounded-2xl)
- **Feature Cards:** `16px` (rounded-2xl)
- **Logo/Icons:** `8px` (rounded-lg)

---

## 🌗 Shadows

### Elevation Levels

```css
/* Light shadows (default) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Custom shadows */
--shadow-input: 0 4px 24px rgba(0, 0, 0, 0.08);
--shadow-input-hover: 0 8px 32px rgba(0, 0, 0, 0.12);
```

### Usage

- **Feature Cards (default):** `shadow-sm`
- **Feature Cards (hover):** `shadow-lg`
- **Form Cards (default):** `shadow-lg`
- **Form Cards (hover):** `shadow-xl`
- **Buttons:** `shadow-sm` to `shadow-md` on hover

---

## 🎭 Interactive States

### Transitions

```css
/* Durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* Common transitions */
transition: all 150ms ease;        /* Buttons */
transition: all 200ms ease;        /* General interactions */
transition: all 300ms ease;        /* Large elements */
transition-shadow: shadow 200ms;   /* Shadow changes */
```

### Hover States

```css
/* Buttons */
bg-black hover:bg-gray-800

/* Links */
text-gray-600 hover:text-gray-900

/* Cards */
shadow-sm hover:shadow-lg

/* Inputs */
border-gray-200 focus:border-[#0046FF]
```

### Active States

```css
/* Buttons */
active:bg-gray-900       /* Black buttons */
active:bg-[#002D99]      /* Blue buttons */
active:bg-gray-100       /* White/outline buttons */
```

### Focus States

```css
/* Inputs */
focus:border-[#0046FF]
focus:bg-white
outline-none             /* Use border instead */

/* Buttons */
focus-visible:ring-2
focus-visible:ring-offset-2
```

---

## 🧩 Component Patterns

### Buttons

#### Primary Button (Blue)
```tsx
<Button className="bg-[#0046FF] hover:bg-[#0039CC] active:bg-[#002D99] text-white rounded-xl px-8 py-4 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200">
  Create My Roadmap
</Button>
```

#### Secondary Button (Black)
```tsx
<Button className="bg-black hover:bg-gray-800 active:bg-gray-900 text-white rounded-lg px-5 py-2 text-sm font-medium shadow-sm transition-all">
  Sign in
</Button>
```

#### Outline Button (White)
```tsx
<Button variant="outline" className="bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 border-gray-300 hover:border-gray-400 rounded-[10px] px-8 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200">
  View Sample Roadmap
</Button>
```

### Input Fields

#### Text Input
```tsx
<input
  type="text"
  className="w-full px-5 py-3.5 text-gray-700 placeholder-gray-400 outline-none text-base bg-gray-50 rounded-xl border border-gray-200 focus:border-[#0046FF] focus:bg-white transition-all"
  placeholder="What's your name?"
/>
```

#### Select Dropdown
```tsx
<select className="w-full px-5 py-3.5 text-gray-700 outline-none text-base bg-gray-50 rounded-xl border border-gray-200 focus:border-[#0046FF] focus:bg-white transition-all appearance-none cursor-pointer">
  <option value="">Select your grade</option>
  <option value="9">9th Grade (Freshman)</option>
</select>
```

### Cards

#### Feature Card
```tsx
<div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
    <Sparkles className="w-6 h-6 text-[#0046FF]" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600 text-sm">Card description text...</p>
</div>
```

#### Form Card
```tsx
<div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 border border-gray-100 p-6">
  {/* Form content */}
</div>
```

---

## 🎨 Decorative Elements

### Background Patterns (Simplified Gradients) ✅ IMPROVED

```tsx
{/* Decorative background elements - top left */}
<div className="absolute top-0 left-0 w-[500px] h-[500px] opacity-15 pointer-events-none">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-300/40 via-purple-200/30 to-transparent blur-3xl" />
</div>

{/* Decorative background elements - top right */}
<div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-15 pointer-events-none">
  <div className="absolute inset-0 bg-gradient-to-bl from-purple-300/40 via-blue-200/30 to-transparent blur-3xl" />
</div>
```

**Changes:**
- ✅ Reduced opacity from 30% to 15% (50% reduction in visual noise)
- ✅ Removed complex radial dot patterns (eliminated dual-layer gradients)
- ✅ Kept only blur gradients for subtle depth
- ✅ Much cleaner, less distracting background

**Usage:**
- Top-left corner: Blue → Purple gradient
- Top-right corner: Purple → Blue gradient
- Opacity: 15% to avoid overwhelming content
- Always use `pointer-events-none` to allow clicks through
- Creates subtle depth without competing with content

---

## 📱 Responsive Design

### Breakpoints (Tailwind defaults)

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Common Patterns ✅ IMPROVED

#### Typography Scaling
```tsx
// Hero headline (✅ reduced by 32%)
className="text-4xl md:text-5xl lg:text-6xl"  // 36px / 48px / 60px

// Hero subtitle (✅ improved with relaxed leading)
className="text-lg md:text-xl"  // 18px / 20px

// Old (deprecated - too large):
// className="text-6xl md:text-7xl lg:text-[5.5rem]"  // 60px / 72px / 88px
```

#### Spacing Scaling
```tsx
// Section padding (✅ reduced by 43%)
className="py-12 md:py-16 lg:py-20"  // 48px / 64px / 80px

// Container padding (unchanged - still good)
className="px-4 md:px-6"  // 16px / 24px

// Old (deprecated - too large):
// className="py-20 md:py-28"  // 80px / 112px
```

#### Layout Changes
```tsx
className="grid md:grid-cols-3 gap-8"              // Feature cards
className="hidden md:flex"                          // Desktop-only nav
className="flex-col md:flex-row"                   // Stack to row
```

---

## 🧭 Layout Structure

### Landing Page Layout

1. **Announcement Banner** (sticky top)
   - Blue background (#0046FF)
   - White text, underlined link
   - Full-width, centered text

2. **Header** (sticky, backdrop blur)
   - Logo + Nav + CTA buttons
   - `backdrop-blur-md` for glass effect
   - Border-bottom with low opacity

3. **Hero Section**
   - Max-width container (max-w-4xl)
   - Centered text alignment
   - Large heading + subtitle + form

4. **Interactive Form**
   - Centered, max-width 2xl
   - White card with shadow elevation
   - 3 form fields + submit button
   - Disabled state until fields filled

5. **Social Proof**
   - University logos (or names)
   - "STUDENTS ACCEPTED TO" label
   - Uppercase, wide tracking

6. **Features Grid**
   - 3-column grid on desktop
   - Icon + Title + Description cards
   - Hover shadow effect

7. **Footer**
   - Dark background (#1a1a1a)
   - Logo + Copyright
   - Flexbox layout, responsive

---

## 🎯 Icon Usage

### Lucide Icons

All icons use **Lucide React** with consistent sizing:

```tsx
import { Sparkles, Target, GraduationCap, ArrowRight, Search } from "lucide-react"

// Sizes
<Icon className="w-4 h-4" />    // Small (16px)
<Icon className="w-5 h-5" />    // Medium (20px)
<Icon className="w-6 h-6" />    // Large (24px)

// Stroke width
<Icon className="stroke-[2]" />     // Default
<Icon className="stroke-[2.5]" />   // Thicker
```

### Icon Colors

```tsx
// Primary brand
className="text-[#0046FF]"

// Neutral
className="text-gray-400"    // Placeholder/inactive
className="text-gray-600"    // Active/secondary
className="text-gray-900"    // Primary/heading

// Accent colors
className="text-purple-600"
className="text-green-600"
```

---

## 🌊 Animation Patterns

### Hover Transforms

```tsx
// Button icon slide
<ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />

// Scale on hover
className="hover:scale-105 transition-transform"

// Shadow elevation
className="hover:shadow-lg transition-shadow"
```

### Loading States

```tsx
{isSubmitting ? (
  "Starting your journey..."
) : (
  <>
    Create My Roadmap
    <ArrowRight className="ml-2 w-5 h-5" />
  </>
)}
```

### Disabled States

```tsx
disabled={isSubmitting || !formData.name || !formData.gradeLevel || !formData.location}
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

---

## 📄 Page Templates

### Landing Page (`/`)
- Interactive quick-start form
- Hero section with decorative background
- Feature preview cards
- Social proof section

### Dashboard (`/dashboard`)
- College readiness widget
- Quick wins section
- Progress tracking
- Roadmap preview

### Onboarding (`/onboarding`)
- Multi-step form (5 steps)
- Progress indicator
- Step-by-step navigation
- Auto-save functionality

### Roadmap (`/roadmap`)
- Timeline view
- Phase cards with tasks
- Task completion tracking
- Regenerate button

### Colleges (`/colleges`)
- College list grid
- Search and filter
- Readiness percentage display
- Add/remove colleges

---

## 🔄 Data Flow

### Quick Start Form → Onboarding

1. User fills landing page form (name, grade, location)
2. Data stored in `sessionStorage` as `'quickStart'`
3. User redirected to `/onboarding`
4. Onboarding reads `sessionStorage` and pre-fills Step 1
5. User continues with remaining steps

```tsx
// Landing page - storing data
sessionStorage.setItem('quickStart', JSON.stringify(formData))

// Onboarding - reading data
const quickStart = sessionStorage.getItem('quickStart')
if (quickStart) {
  const data = JSON.parse(quickStart)
  // Pre-fill form fields
}
```

---

## ✅ Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA standards
- [ ] Form inputs have labels (or placeholder + aria-label)
- [ ] Buttons have clear text or aria-label
- [ ] Images have alt text
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Keyboard navigation works for all interactions
- [ ] Error messages are clear and actionable

---

## 🎨 Design Tokens Summary

| Category | Token | Value |
|----------|-------|-------|
| **Primary Color** | `--brand-primary` | #0046FF |
| **Background** | `--bg-primary` | #FAFAF9 |
| **Text** | `--text-primary` | #111827 |
| **Border Radius (Input)** | `rounded-custom` | 14px |
| **Border Radius (Button)** | `rounded-btn` | 10px |
| **Shadow (Input)** | `--shadow-input` | 0 4px 24px rgba(0,0,0,0.08) |
| **Transition** | `--duration-normal` | 200ms |
| **Hero Font Size** | `--text-7xl` | 5.5rem (88px) |
| **Spacing (Section)** | `py-20 md:py-28` | 80px / 112px |

---

## 📚 Quick Reference

### Import Statements
```tsx
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Target, GraduationCap, ArrowRight } from "lucide-react"
```

### Common Classnames
```tsx
// Container
className="container mx-auto px-6"

// Centered content
className="max-w-4xl mx-auto text-center"

// Card base
className="bg-white rounded-2xl border border-gray-200 p-6"

// Button base
className="bg-[#0046FF] hover:bg-[#0039CC] text-white rounded-xl px-8 py-4"

// Input base
className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-[#0046FF]"
```

---

## 🚀 Future Enhancements

- [ ] Add dark mode support
- [ ] Implement animation library (Framer Motion)
- [ ] Create reusable component library
- [ ] Add loading skeletons
- [ ] Implement toast notifications
- [ ] Add micro-interactions
- [ ] Create design system documentation site

---

**Design Reference:** Inspired by Exa.ai's modern, clean aesthetic with emphasis on usability and visual polish.

# Design Guidelines

**DocSign - Healthcare Document Viewer & Signature Platform**

> Mobile-first, tablet-optimized design system for embedded webview applications.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Mobile & Tablet First Principles](#mobile--tablet-first-principles)
3. [Embedded Webview Considerations](#embedded-webview-considerations)
4. [Layout System](#layout-system)
5. [Typography](#typography)
6. [Color System](#color-system)
7. [Touch Interactions](#touch-interactions)
8. [Components](#components)
9. [Performance Guidelines](#performance-guidelines)
10. [Accessibility](#accessibility)
11. [Healthcare-Specific Patterns](#healthcare-specific-patterns)

---

## Design Philosophy

This application is designed to be **embedded within native mobile applications** as a webview component. The design prioritizes:

- **Content-first**: Essential information takes precedence
- **Touch-native**: Every interaction designed for finger input
- **Performance**: Fast loading on variable mobile connections
- **Trust**: Professional, clinical appearance for healthcare context
- **Simplicity**: Minimal cognitive load for users in stressful healthcare situations

---

## Mobile & Tablet First Principles

### Core Approach

Design for the smallest screen first, then progressively enhance for larger screens.

```
Mobile (320px - 480px) → Tablet (481px - 1024px) → Desktop (1025px+)
```

### Content Prioritization

1. **Primary**: Patient information, document content, signature actions
2. **Secondary**: Navigation, document metadata, practitioner details
3. **Tertiary**: Additional context, links, supplementary information

### Screen Real Estate

| Device | Orientation | Safe Content Width |
|--------|-------------|-------------------|
| Mobile | Portrait | 100% - 32px padding |
| Mobile | Landscape | 100% - 48px padding |
| Tablet | Portrait | 100% - 48px padding |
| Tablet | Landscape | max 768px centered |

### Breakpoints

```css
/* Mobile-first breakpoints */
--breakpoint-sm: 480px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets portrait */
--breakpoint-lg: 1024px;  /* Tablets landscape */
```

---

## Embedded Webview Considerations

### Layout Constraints

Since this app runs embedded in native apps:

- **No browser chrome**: Full viewport is available
- **Native navigation**: Avoid web-style navigation patterns
- **Safe areas**: Respect device notches and home indicators
- **No external links**: All navigation happens within the webview

### Safe Area Handling

```css
/* Always respect device safe areas */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

### Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
```

### Webview-Specific Rules

- **Disable bounce/overscroll** where appropriate
- **Avoid hover states** as primary interaction feedback
- **No pop-ups or new windows** - everything inline or modal
- **Handle back gesture** via native bridge if needed

---

## Layout System

### Spacing Scale

Use consistent spacing based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight element spacing |
| `space-2` | 8px | Related element groups |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Section separation |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Major section breaks |
| `space-10` | 40px | Page margins |

### Container Rules

```css
/* Mobile container */
.container {
  width: 100%;
  padding-inline: 16px;
  margin-inline: auto;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding-inline: 24px;
    max-width: 768px;
  }
}
```

### Vertical Rhythm

- Maintain consistent vertical spacing between sections
- Use `space-6` (24px) between major content blocks
- Use `space-4` (16px) between related elements
- Use `space-2` (8px) for tight groupings

---

## Typography

### Font Families

```css
--font-sans: "Source Sans 3", system-ui, sans-serif;
--font-serif: "Libre Baskerville", Georgia, serif;
```

| Font | Usage |
|------|-------|
| Source Sans 3 | UI text, labels, body content |
| Libre Baskerville | Document titles, formal/clinical text |

### Type Scale (Mobile-First)

| Element | Mobile | Tablet | Line Height |
|---------|--------|--------|-------------|
| H1 | 24px | 28px | 1.2 |
| H2 | 20px | 24px | 1.25 |
| H3 | 18px | 20px | 1.3 |
| Body | 16px | 16px | 1.5 |
| Small | 14px | 14px | 1.4 |
| Caption | 12px | 12px | 1.4 |

### Typography Rules

- **Minimum body text**: 16px (prevents iOS zoom on input focus)
- **Maximum line length**: 65-75 characters for readability
- **Font weight**: Use 400 (regular) and 600 (semibold) only
- **Letter spacing**: Default for body, slightly tighter for headings

### Clinical Document Text

```css
.fhir-narrative {
  font-size: 16px;
  line-height: 1.6;
  color: var(--foreground);
}

.fhir-narrative h1,
.fhir-narrative h2 {
  font-family: var(--font-serif);
  margin-top: 1.5em;
}
```

---

## Color System

### Primary Palette

Using OKLCH color space for perceptual uniformity:

```css
/* Primary - Teal (Trust, Healthcare) */
--primary: oklch(0.55 0.12 180);
--primary-foreground: oklch(0.98 0 0);

/* Backgrounds */
--background: oklch(1 0 0);
--foreground: oklch(0.15 0 0);

/* Muted/Secondary */
--muted: oklch(0.96 0 0);
--muted-foreground: oklch(0.45 0 0);

/* Borders */
--border: oklch(0.90 0 0);

/* Destructive (Errors, Warnings) */
--destructive: oklch(0.55 0.2 25);
--destructive-foreground: oklch(0.98 0 0);
```

### Semantic Colors

| Purpose | Color | Usage |
|---------|-------|-------|
| Primary Action | Teal | Sign buttons, CTAs, links |
| Success | Green | Completed signatures, confirmations |
| Warning | Amber | Pending states, attention needed |
| Error | Red | Validation errors, failures |
| Neutral | Gray | Borders, disabled states, muted text |

### Contrast Requirements

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18px+)**: Minimum 3:1 contrast ratio
- **Interactive elements**: Clear visual distinction from static content

### Dark Mode

Support via `.dark` class on root element:

```css
.dark {
  --background: oklch(0.15 0 0);
  --foreground: oklch(0.95 0 0);
  --muted: oklch(0.25 0 0);
  --border: oklch(0.30 0 0);
}
```

---

## Touch Interactions

### Touch Target Sizes

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Primary buttons | 48x48px | 56x48px |
| Secondary buttons | 44x44px | 48x44px |
| Icon buttons | 44x44px | 48x48px |
| List items | 48px height | 56px height |
| Form inputs | 48px height | 52px height |

### Touch Spacing

- **Minimum gap** between touch targets: 8px
- **Recommended gap**: 12-16px
- **Edge margin**: 16px from screen edges

### Gesture Support

| Gesture | Action |
|---------|--------|
| Tap | Primary selection |
| Long press | Context actions (use sparingly) |
| Swipe horizontal | Document navigation |
| Swipe vertical | Scroll content |
| Pinch | Disabled (prevent accidental zoom) |

### Feedback States

```css
/* Touch feedback */
.interactive {
  transition: transform 100ms ease, opacity 100ms ease;
}

.interactive:active {
  transform: scale(0.98);
  opacity: 0.9;
}

/* Focus visible for accessibility */
.interactive:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

---

## Components

### Buttons

**Primary Button**
- Background: `--primary`
- Height: 48px minimum
- Padding: 16px 24px
- Border radius: 8px
- Full width on mobile

**Secondary/Outline Button**
- Border: 1px solid `--border`
- Background: transparent
- Same sizing as primary

**Ghost Button**
- No background or border
- Used for tertiary actions

### Cards

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

@media (min-width: 768px) {
  .card {
    padding: 24px;
    border-radius: 16px;
  }
}
```

### Modals/Dialogs

- **Full screen on mobile** (bottom sheet pattern)
- **Centered overlay on tablet** (max-width: 500px)
- **Close button**: Always visible, top-right, 44x44px minimum
- **Backdrop**: Semi-transparent, dismissible on tap

### Form Inputs

- Height: 48px minimum
- Padding: 12px 16px
- Border radius: 8px
- Clear focus states
- Error states with red border and message

### Floating Action Button (FAB)

```css
.fab {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

## Performance Guidelines

### Loading Performance

- **Target**: First contentful paint < 1.5s on 3G
- **Bundle size**: Keep JavaScript under 200KB gzipped
- **Images**: Use WebP/AVIF, lazy load below fold

### Optimization Strategies

1. **Minimize HTTP requests**
   - Inline critical CSS
   - Bundle JavaScript efficiently
   - Use system fonts as fallback

2. **Optimize assets**
   - Compress images (quality 80-85%)
   - Use appropriate image sizes for device
   - Prefer SVG for icons

3. **Reduce JavaScript execution**
   - Defer non-critical scripts
   - Avoid heavy animations on scroll
   - Use CSS transitions over JS animations

### Animation Performance

```css
/* Use transform and opacity for smooth animations */
.animate-enter {
  animation: fadeSlideIn 300ms ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility

### Core Requirements

- **WCAG 2.1 Level AA** compliance minimum
- **Touch targets**: 44x44px minimum
- **Color contrast**: 4.5:1 for text, 3:1 for UI elements
- **Focus indicators**: Visible on all interactive elements

### Screen Reader Support

- Use semantic HTML elements
- Provide `aria-label` for icon-only buttons
- Use `aria-live` regions for dynamic content
- Ensure logical reading order

### Motor Accessibility

- Large, well-spaced touch targets
- No time-limited interactions
- Avoid gesture-only actions
- Provide alternative input methods

### Visual Accessibility

- Support system font size preferences
- Ensure text is resizable to 200%
- Avoid text in images
- Provide sufficient color contrast

---

## Healthcare-Specific Patterns

### Trust & Professionalism

- Use calm, professional color palette (teal, neutral grays)
- Clean, uncluttered layouts
- Clear hierarchy for clinical information
- Professional typography (Libre Baskerville for formal documents)

### Patient Information Display

```
┌─────────────────────────────────┐
│ Patient Name            Photo   │
│ DOB: DD.MM.YYYY                 │
│ ID: xxxxxxxx                    │
└─────────────────────────────────┘
```

- Clear labeling of all patient identifiers
- Consistent date format (German: DD.MM.YYYY)
- Protected health information marked clearly

### Document Sections

- Clear visual separation between sections
- Consistent heading hierarchy
- Adequate white space for readability
- Print-friendly formatting

### Signature Capture

- Large signature area (minimum 280px height on mobile)
- Clear instructions in German
- Undo/Clear functionality
- Visual confirmation of captured signature
- Legal disclaimer visible before signing

### Status Indicators

| Status | Visual Treatment |
|--------|-----------------|
| Unsigned | Muted, outline style |
| In Progress | Primary color, subtle pulse |
| Signed | Success green, checkmark icon |
| Error | Destructive red, warning icon |

### Progress Indication

For multi-document flows:

```
Document 1 ● ─── Document 2 ○ ─── Document 3 ○
  Signed         Current         Pending
```

---

## Implementation Checklist

### Before Development

- [ ] Review this document with team
- [ ] Set up design tokens in Tailwind config
- [ ] Configure viewport and safe areas
- [ ] Test on target devices/webviews

### During Development

- [ ] Mobile-first CSS approach
- [ ] Touch target sizes validated
- [ ] Performance budgets met
- [ ] Accessibility audit passed

### Before Release

- [ ] Test on iOS Safari WebView
- [ ] Test on Android WebView
- [ ] Test on slow network (3G simulation)
- [ ] Test with screen reader
- [ ] Test with increased font sizes

---

## Resources

- [Android WebView Best Practices](https://developer.android.com/develop/ui/views/layout/webapps/best-practices)
- [Mobile First Design Principles](https://www.interaction-design.org/literature/topics/mobile-first)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)

---

*Last updated: December 2025*

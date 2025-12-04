# Styling Guide

This document describes the styling system used in the Meal Planner System.

## Overview

The application uses TailwindCSS with a custom configuration for:
- Responsive design (mobile-first approach)
- Dark mode support (class-based strategy)
- Consistent color palette
- Touch-friendly controls (44x44px minimum)
- Accessibility features

## Color Palette

### Primary Colors (Blue)
Used for primary actions, links, and interactive elements.
- `primary-50` to `primary-950`

### Secondary Colors (Gray)
Used for backgrounds, borders, and secondary text.
- `secondary-50` to `secondary-950`

### Success Colors (Green)
Used for success states and positive feedback.
- `success-50` to `success-900`

### Warning Colors (Yellow/Orange)
Used for warnings and caution states.
- `warning-50` to `warning-900`

### Danger Colors (Red)
Used for errors, destructive actions, and critical alerts.
- `danger-50` to `danger-900`

## Responsive Breakpoints

- `xs`: 320px (Small phones)
- `sm`: 640px (Large phones)
- `md`: 768px (Tablets)
- `lg`: 1024px (Desktop)
- `xl`: 1280px (Large desktop)
- `2xl`: 1536px (Extra large desktop)

## Dark Mode

Dark mode is implemented using the `class` strategy. The theme can be toggled using the ThemeToggle component.

### Usage
```tsx
// Light mode only
<div className="bg-white text-gray-900">

// With dark mode variant
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### Theme Persistence
User theme preferences are stored in localStorage and persist across sessions.

## Reusable Components

### Button
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="md">
  Click me
</Button>
```

Variants: `primary`, `secondary`, `success`, `warning`, `danger`, `ghost`
Sizes: `sm`, `md`, `lg`

### Card
```tsx
import Card from '@/components/ui/Card'

<Card padding="md" hover>
  Card content
</Card>
```

### Badge
```tsx
import Badge from '@/components/ui/Badge'

<Badge variant="success">Active</Badge>
```

Variants: `default`, `primary`, `success`, `warning`, `danger`

### Alert
```tsx
import Alert from '@/components/ui/Alert'

<Alert variant="error">
  An error occurred
</Alert>
```

Variants: `info`, `success`, `warning`, `error`

### Loading Spinner
```tsx
import LoadingSpinner from '@/components/ui/LoadingSpinner'

<LoadingSpinner size="md" />
```

## Accessibility Features

### Focus Indicators
All interactive elements have visible focus indicators:
```css
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### Touch-Friendly Sizes
All buttons and interactive elements have a minimum size of 44x44px:
```tsx
className="min-h-touch min-w-touch"
```

### ARIA Labels
Components include appropriate ARIA labels for screen readers:
```tsx
<button aria-label="Toggle theme">
  <ThemeIcon />
</button>
```

### Semantic HTML
Use semantic HTML elements where appropriate:
- `<nav>` for navigation
- `<main>` for main content
- `<section>` for sections
- `<article>` for articles

## Typography

### Headings
```tsx
import { textStyles } from '@/lib/utils/styles'

<h1 className={textStyles.heading.h1}>Main Heading</h1>
<h2 className={textStyles.heading.h2}>Section Heading</h2>
```

### Body Text
```tsx
<p className={textStyles.body.base}>Regular text</p>
<p className={textStyles.body.small}>Small text</p>
```

## Responsive Design Patterns

### Mobile-First Approach
Start with mobile styles and add larger breakpoints:
```tsx
<div className="text-sm sm:text-base md:text-lg">
  Responsive text
</div>
```

### Grid Layouts
```tsx
// Stack on mobile, 2 columns on tablet, 4 columns on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>
```

### Flexible Buttons
```tsx
// Stack on mobile, inline on larger screens
<div className="flex flex-col sm:flex-row gap-3">
  <button>Action 1</button>
  <button>Action 2</button>
</div>
```

## Best Practices

1. **Always include dark mode variants** for background and text colors
2. **Use responsive utilities** for different screen sizes
3. **Ensure touch-friendly sizes** for all interactive elements
4. **Include focus indicators** for keyboard navigation
5. **Use semantic HTML** for better accessibility
6. **Test with screen readers** to ensure proper ARIA labels
7. **Maintain consistent spacing** using Tailwind's spacing scale
8. **Use the utility functions** from `lib/utils/styles.ts` for consistency

## Testing

Run the theme preference persistence test:
```bash
npm test -- __tests__/theme-preference-persistence.test.ts
```

## Requirements Coverage

- **11.1**: Mobile-first design (320px+) ✓
- **11.2**: Tablet optimization (768px+) and touch-friendly controls (44x44px) ✓
- **11.3**: Dark mode with class strategy ✓
- **11.4**: Theme preference persistence to localStorage ✓
- **11.5**: Desktop layout (1024px+) ✓
- **20.2**: Keyboard navigation with focus indicators ✓
- **20.3**: ARIA labels and semantic HTML ✓

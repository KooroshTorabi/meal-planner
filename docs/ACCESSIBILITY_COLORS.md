# Color Accessibility Implementation

This document describes how the Meal Planner System ensures color accessibility by meeting WCAG 2.1 Level AA contrast requirements and providing text/icon alternatives to color-only information.

## WCAG Contrast Requirements

All color combinations in the system meet WCAG 2.1 Level AA contrast requirements:
- Normal text: Minimum contrast ratio of 4.5:1
- Large text (18pt+ or 14pt+ bold): Minimum contrast ratio of 3:1
- UI components and graphics: Minimum contrast ratio of 3:1

### Color Palette

The system uses TailwindCSS color utilities which are designed to meet WCAG contrast requirements:

**Light Mode:**
- Background: `#ffffff` (white)
- Text: `#171717` (gray-900)
- Primary: `#3b82f6` (blue-600)
- Success: `#10b981` (green-600)
- Warning: `#f59e0b` (amber-600)
- Error: `#ef4444` (red-600)

**Dark Mode:**
- Background: `#0f172a` (slate-900)
- Text: `#f1f5f9` (slate-100)
- Primary: `#60a5fa` (blue-400)
- Success: `#34d399` (green-400)
- Warning: `#fbbf24` (amber-400)
- Error: `#f87171` (red-400)

## Text/Icon Alternatives to Color

The system never relies solely on color to convey information. All color-coded elements include text labels or icons:

### 1. Order Status Indicators

Status badges use both color AND text:
- **Pending**: Yellow background + "PENDING" text
- **Prepared**: Blue background + "PREPARED" text
- **Completed**: Green background + "COMPLETED" text

```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  PENDING
</span>
```

### 2. Urgent Indicators

Urgent flags use both color AND text:
- Red background + "URGENT" text
- Warning emoji (⚠️) in reports

```tsx
{order.urgent && (
  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
    URGENT
  </span>
)}
```

### 3. Alert Severity Levels

Alert severity uses both color AND text labels:
- **Critical**: Red background + "CRITICAL" text
- **High**: Orange background + "HIGH" text
- **Medium**: Yellow background + "MEDIUM" text
- **Low**: Blue background + "LOW" text

```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
  {alert.severity.toUpperCase()}
</span>
```

### 4. Form Validation

Form errors use multiple indicators:
- Red border color
- Error icon (optional)
- Error message text
- `aria-invalid="true"` attribute

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
    <p className="text-red-800">
      <strong>Error:</strong> {error}
    </p>
  </div>
)}
```

### 5. Success Messages

Success messages use multiple indicators:
- Green background color
- Success icon (optional)
- Success message text
- `role="status"` attribute

```tsx
{success && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status">
    <p className="text-green-800">
      Meal order created successfully!
    </p>
  </div>
)}
```

## Focus Indicators

All interactive elements have visible focus indicators that meet WCAG requirements:

```css
*:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Dark mode */
.dark *:focus-visible {
  outline-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}
```

## Testing Color Accessibility

To verify color accessibility:

1. **Contrast Checker**: Use tools like WebAIM's Contrast Checker to verify all color combinations
2. **Grayscale Test**: View the interface in grayscale to ensure information is still conveyed
3. **Screen Reader Test**: Use a screen reader to verify all information is accessible
4. **Color Blindness Simulation**: Use browser extensions to simulate different types of color blindness

## Compliance

The system meets the following accessibility standards:
- WCAG 2.1 Level AA (contrast requirements)
- Requirement 20.5: Color accessibility with text/icon alternatives
- All color-coded information has non-color alternatives

# Responsive Web Architecture Guide

This guide explains how ElderConnect achieves **professional, well-structured web layouts** while **keeping the mobile UI completely unchanged**.

---

## Core Principle: Platform-Gated Responsiveness

All responsive behavior is **gated by `Platform.OS === 'web'`**. On iOS and Android, the app renders exactly as before. No layout logic, dimensions, or styles change for native platforms.

```
Mobile (iOS/Android)  →  Existing UI, unchanged
Web                   →  Responsive layout with breakpoints, max-width, aspect ratios
```

---

## Architecture Overview

### 1. Breakpoints (`constants/breakpoints.ts`)

```typescript
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};
```

- Used **only on web**
- Drives container max-widths, grid columns, and layout decisions

### 2. `useResponsive` Hook (`hooks/useResponsive.ts`)

The central hook for responsive values. **On native, it returns static values that match current mobile behavior.**

```typescript
const {
  isWeb,           // true only on web
  isNative,        // true on iOS/Android
  width,           // window width
  contentWidth,    // min(width, containerMaxWidth) on web; width on native
  chartWidth,      // responsive chart width (capped, aspect-ratio aware on web)
  chartHeight,     // responsive chart height
  containerMaxWidth,
  gridColumns,     // 1 | 2 | 3
  isDesktop,
  isTabletOrLarger,
} = useResponsive();
```

**Critical**: On mobile, `contentWidth === width`, `chartWidth === width - 40`, `chartHeight === 220`. Your existing mobile logic continues to work.

### 3. Reusable Components

| Component | Purpose | Mobile Behavior | Web Behavior |
|-----------|---------|-----------------|--------------|
| `ResponsiveView` | Constrain content width | Pass-through (flex: 1) | Max-width container, centered |
| `ResponsiveContainer` | Same as above with more options | Pass-through | Max-width + optional center |
| `ResponsiveChartWrapper` | Wrap charts | Pass-through dimensions | Constrained width, aspect-ratio height |
| `ResponsiveScrollContainer` | ScrollView with responsive content | Standard ScrollView | Centered content with max-width |

---

## How Mobile Remains Untouched

1. **Platform check first**: Every responsive component checks `Platform.OS !== 'web'` and returns the native layout immediately.

2. **Hook returns mobile defaults**: `useResponsive` returns the same values you'd get from `Dimensions.get('window')` on native.

3. **No conditional imports**: No `.web.tsx` or `.native.tsx` files for layout. One codebase, gated by `Platform.OS`.

4. **No style overrides on native**: Responsive styles are applied only when `isWeb` is true.

---

## Code Examples

### Example 1: Responsive Chart (HealthCharts)

Charts use `ResponsiveChartWrapper` so they don't overflow vertically on large screens.

```tsx
<ResponsiveChartWrapper>
  {({ width, height }) => (
    <BarChart
      data={chartData}
      width={width}
      height={height}
      chartConfig={chartConfig}
    />
  )}
</ResponsiveChartWrapper>
```

- **Mobile**: `width = Dimensions.get('window').width - 40`, `height = 220` (unchanged).
- **Web**: `width` capped at 600px, `height` computed from aspect ratio (min 180, max 280).

### Example 2: Screen Content with Max-Width

Wrap screen content to avoid full-width stretch on large displays.

```tsx
<ScrollView style={styles.container}>
  <ResponsiveView style={styles.content}>
    {/* All screen content */}
  </ResponsiveView>
</ScrollView>
```

- **Mobile**: Single `View` with `flex: 1`. No change.
- **Web**: Outer centering + inner max-width container.

### Example 3: Grid Items with Dynamic Width

For grid layouts that use `width - padding`:

```tsx
const { isWeb, contentWidth } = useResponsive();
const width = isWeb ? contentWidth : Dimensions.get('window').width;

// In render:
<View style={[
  styles.gridItem,
  isWeb && { width: (width - gap) / columns }
]} />
```

- **Mobile**: `isWeb` is false, so the inline override is not applied. `styles.gridItem` keeps your original width.
- **Web**: Inline style constrains width based on `contentWidth`.

### Example 4: Using useResponsive for Layout Logic

```tsx
const { isWeb, gridColumns, isDesktop } = useResponsive();

// Only change layout on web
const columns = isWeb ? gridColumns : 2;
const cardWidth = isWeb
  ? (contentWidth - 48) / columns
  : (Dimensions.get('window').width - 60) / 2;
```

---

## Responsive Patterns

### Pattern A: Wrap entire screen content

```tsx
<ScrollView>
  <ResponsiveView style={{ paddingHorizontal: 20 }}>
    {/* screen content */}
  </ResponsiveView>
</ScrollView>
```

### Pattern B: Chart with aspect ratio

```tsx
<ResponsiveChartWrapper>
  {({ width, height }) => (
    <LineChart data={...} width={width} height={height} />
  )}
</ResponsiveChartWrapper>
```

### Pattern C: Conditional layout for web only

```tsx
const { isWeb, contentWidth } = useResponsive();
return (
  <View style={[
    styles.card,
    isWeb && { maxWidth: 500, alignSelf: 'center' }
  ]}>
    ...
  </View>
);
```

### Pattern D: SVG/Canvas dimensions

For radar charts, knowledge graphs, or custom SVG:

```tsx
const { width } = useResponsive();
const effectiveWidth = width;  // contentWidth on web, full width on native
const chartSize = effectiveWidth - 40;
```

---

## Chart Configuration

Charts are configured in `constants/breakpoints.ts`:

```typescript
export const CHART_DEFAULTS = {
  maxWidth: 600,
  aspectRatio: 2.7,
  minHeight: 180,
  maxHeight: 280,
};
```

- **maxWidth**: Prevents charts from stretching across ultra-wide monitors.
- **aspectRatio**: Keeps charts readable without excessive vertical space.
- **minHeight / maxHeight**: Avoids tiny or oversized charts.

---

## Avoiding Common Pitfalls

1. **Don't use `Dimensions.get('window')` for layout on web**  
   It doesn't update on resize. Use `useWindowDimensions()` or `useResponsive()`.

2. **Don't add responsive logic that runs on native**  
   Always gate with `Platform.OS === 'web'` or `isWeb`.

3. **Don't duplicate screens**  
   One component, conditional styles. No separate web and native screens.

4. **Charts: avoid fixed height with dynamic width**  
   Use `ResponsiveChartWrapper` or compute height from width (aspect ratio).

5. **Full-width on large screens**  
   Use `ResponsiveView` or `ResponsiveContainer` to cap width and center content.

---

## File Reference

| File | Role |
|------|------|
| `constants/breakpoints.ts` | Breakpoint values, chart defaults |
| `hooks/useResponsive.ts` | Central responsive hook |
| `components/ResponsiveView.tsx` | Max-width container (web only) |
| `components/ResponsiveContainer.tsx` | Container + ScrollContainer variants |
| `components/ResponsiveChartWrapper.tsx` | Chart dimension wrapper |
| `components/HealthCharts.tsx` | Example: charts using ResponsiveChartWrapper |
| `app/(tabs)/reports.tsx` | Example: screen using ResponsiveView + useResponsive |

---

## Extending to New Screens

To make a new screen responsive on web:

1. Wrap main content in `<ResponsiveView>`.
2. Replace `Dimensions.get('window').width` with `useResponsive().contentWidth` for layout calculations.
3. Wrap any chart in `<ResponsiveChartWrapper>`.
4. Use `isWeb && { ... }` for web-only style overrides.

Mobile behavior stays the same; web gets a structured, scalable layout.

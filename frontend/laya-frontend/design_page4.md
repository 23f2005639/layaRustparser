---
name: ULPF Clean Light Gray
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#44474a'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#75777a'
  outline-variant: '#c5c6ca'
  surface-tint: '#5c5f62'
  primary: '#010204'
  on-primary: '#ffffff'
  primary-container: '#1a1d20'
  on-primary-container: '#828589'
  inverse-primary: '#c5c6ca'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000301'
  on-tertiary: '#ffffff'
  tertiary-container: '#002214'
  on-tertiary-container: '#009768'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e2e6'
  primary-fixed-dim: '#c5c6ca'
  on-primary-fixed: '#191c1f'
  on-primary-fixed-variant: '#44474a'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0em
  label-badge:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.025em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an ultra-refined, technical-grade minimalism engineered for complex analytical dashboards, control panels, and data-intensive workflows. The target audience comprises system operators, engineers, and data analysts who require maximum cognitive ergonomics, unambiguous hierarchy, and enduring legibility during prolonged screen engagement.

The aesthetic fuses modern functional minimalism with subtle technical precision:
- **Calm, High-Readability Foundations:** By stepping away from stark white canvases in favor of a soft neutral gray base (`#F3F3F3`) layered with pure white cards (`#FFFFFF`) and slate-tinted panels (`#E2E4E8`), the environment achieves visual clarity without harsh glare.
- **Architectural Division:** Depth is communicated through calibrated surface values and crisp 1px borders rather than heavy drop shadows.
- **Engineered Restraint:** Expressive color is strictly functional. Deep charcoal provides anchor points for destructive and primary execution, while an electric tech-blue commands focused interaction and active states.

## Colors

The palette leverages a structured system of light surface tones, deep charcoal anchors, and targeted functional accents.

### Color Tokens & Roles
- **Canvas Base (`#F3F3F3`):** Global viewport background, establishing a muted baseline that cushions contrast.
- **Surface Variant / Sidebar (`#E2E4E8`):** Applied to persistent navigation, tool rails, and secondary panels to maintain crisp, tactile boundaries without visual weight.
- **Surface Elevated (`#FFFFFF`):** High-priority operational zones—cards, table structures, code containers, and metric widgets.
- **Primary Anchor (`#1A1D20`):** Grounded charcoal used for high-impact CTAs, primary triggers, and authoritative UI framing.
- **Tech Accent (`#0284C7`):** Precision sky blue for interactive states, active indicators, selected tabs, progress values, and focused input outlines.
- **Success / Validated (`#10B981`):** Subdued emerald dedicated to operational confirmation, success metrics, and active health checks.
- **Critical / Danger (`#FF5C5C`):** Calibrated coral red for destructive paths, active breaches, and immediate error resolution.
- **Typography - High Contrast (`#1E293B`):** Deep slate-charcoal ensuring WCAG AAA legibility for critical figures, labels, and table content.
- **Typography - Secondary / Metadata (`#64748B`):** Structural neutral for auxiliary labels, timestamps, and column descriptors.
- **Borders & Dividers (`#E2E8F0` / `#CBD5E1`):** Subtle structural lines separating components and grid columns without introducing noise.

## Typography

The typographic hierarchy implements an asymmetric dual-font structure:
- **Inter** governs all UI chrome, body reading contexts, headers, and dense data tables. Its geometric neutral chassis ensures peak legibility across low and high pixel-density environments.
- **JetBrains Mono** is reserved exclusively for tabular numeric figures, system addresses, IDs, payload badges, status code metrics, and execution triggers.

### Usage Standards
- Headings maintain tightened negative tracking (`-0.01em` to `-0.025em`) to consolidate density in administrative layouts.
- Monospaced badges use uppercase transformation with slight positive letter spacing (`0.025em`) to maintain legibility at sub-12px sizes.
- Monospace font weights must not exceed `600` to prevent anti-aliasing smear against gray and white background containers.

## Layout & Spacing

The layout is built upon an 8pt architectural rhythm, with a strict 4pt sub-grid for dense micro-components, table rows, and form controls.

### Shell Architecture
- **Desktop (>= 1280px):** Fixed-width or collapsible side panel (`240px` to `280px`) fixed to `#E2E4E8`, with a 12-column fluid content canvas spanning over `#F3F3F3` with `1.5rem` gutters.
- **Tablet (768px - 1279px):** 8-column layout with `1rem` gutters; sidebar folds into an off-canvas drawer or a compact 64px icon rail.
- **Mobile (< 768px):** 4-column single-stream canvas with `1rem` outer margins. Data tables gain horizontal scroll zones with pinned left identifier columns.

### Density Principles
Internal component padding (`space-xs` to `space-md`) prioritizes information throughput: compact forms, single-line data grids, and tightly packed telemetry ribbons allow enterprise workflows to present key metrics above the fold.

## Elevation & Depth

This system avoids heavy drop shadows and exaggerated blurs, relying instead on clean surface planar shifts, structural lines, and minimal ambient occlusion.

### Tonal Hierarchy
- **Level 0 (Canvas Base - `#F3F3F3`):** The ground plane.
- **Level 1 (Structural Anchors - `#E2E4E8`):** Lateral sidebars, filter toolbars, and global status docks. Separated from the base using a clean border of `1px solid #CBD5E1`.
- **Level 2 (Containers & Cards - `#FFFFFF`):** Work surfaces, data tables, and modal contents. Placed directly over the base with a defining border of `1px solid #E2E8F0` and an ultra-subtle ambient shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 3 (Overlays & Menus - `#FFFFFF`):** Popovers, dropdown menus, and command palettes. Outlined with `1px solid #CBD5E1` and rendered with a focused ambient lift: `0 4px 12px -2px rgba(15, 23, 42, 0.08)`.

## Shapes

The design language applies consistent soft-square geometry (`rounded-sm` / `0.25rem` / `4px`), delivering an engineered, systematic appearance.

### Geometry Rules
- **Base Components:** Inputs, buttons, segmented controls, chips, and table row selections strictly adhere to a `4px` corner radius.
- **Large Surfaces (`rounded-lg` - 8px):** Metric summary cards, primary view panels, and dialog sheets scale up to an `8px` corner radius to soften visual boundaries.
- **Inline Pill Modifiers:** Reserved exclusively for small status pills and indicator badges where a fully rounded radius (`9999px`) prevents confusion with clickable interactive buttons.

## Components

### Buttons
- **Primary:** Background `#1A1D20`, text `#FFFFFF`, border `1px solid transparent`. Hover shifts to `#2E343A`. Active/pressed shifts to `#0F1113`.
- **Secondary / Subtle:** Background `#FFFFFF`, text `#1E293B`, border `1px solid #CBD5E1`. Hover shifts background to `#F8FAFC` with border `#94A3B8`.
- **Tech Accent (Action Trigger):** Background `#0284C7`, text `#FFFFFF`. Hover shifts to `#0369A1`.
- **Destructive:** Background `#FF5C5C`, text `#FFFFFF`. Hover shifts to `#EF4444`. Subtle variant uses `#FFF1F1` background with `#FF5C5C` text and border `1px solid #FECACA`.

### Form Inputs & Selects
- Height fixed at `36px` for standard density (or `30px` for high-density tables).
- Surface fill is pure `#FFFFFF` bounded by `1px solid #CBD5E1`.
- Text color is `#1E293B` using `body-md`; placeholder styled with `Text Secondary` (`#64748B`).
- **Focus State:** `1px solid #0284C7` with a matching `0 0 0 2px rgba(2, 132, 199, 0.15)` focus ring.

### Checkboxes & Radio Controls
- Base dimensions are `16px x 16px`. Checkbox corners use `2px`; radio inputs are fully circular.
- Unchecked state is `#FFFFFF` background with `1px solid #CBD5E1`.
- Checked state uses `#1A1D20` for standard inputs, or `#0284C7` when tied to analytical multi-selects. Check mark glyph is clean white (`#FFFFFF`).

### Data Tables & Lists
- Table containers rest on `#FFFFFF` with an outer border of `1px solid #E2E8F0`.
- **Table Headers:** Background `#F8FAFC`, text `#64748B` (`label-code-sm` or Inter SemiBold `0.75rem`), tracked uppercase with a bottom border of `1px solid #E2E8F0`.
- **Rows:** Zebra alternating is avoided. Rows use `#FFFFFF` fills with alternating hover states set to `#F1F5F9`. Cell dividers are `1px solid #F1F5F9`.

### Status Badges & Chips
- Typography uses `JetBrains Mono` (`label-badge`).
- Padding is strictly `2px 6px` with a `4px` or pill radius.
- **Allowed / Success:** `#ECFDF5` background, `#047857` text, `1px solid #A7F3D0`.
- **Drop / Danger:** `#FEF2F2` background, `#B91C1C` text, `1px solid #FECACA`.
- **System Informational:** `#F0F9FF` background, `#0284C7` text, `1px solid #BAE6FD`.

### Cards & Metrics
- Pure `#FFFFFF` surface, framed with a uniform `1px solid #E2E8F0` border.
- KPI values are rendered in `Inter` semi-bold display sizing paired with monospaced secondary deltas (`JetBrains Mono`).
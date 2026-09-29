---
name: ui-conventions
description: Visual and component conventions of this POS frontend — theme tokens (light/dark via data-theme), the components/ui kit (Button, Card, Modal, Badge, Icon, PageShell…), fonts, animations and chart colors. Use whenever creating or restyling a screen, component, modal, chart or any UI under frontend/src/components or frontend/src/pages.
paths: frontend/src/**
---

# UI conventions

The app already has a design system. New UI must look like it belongs to it — reuse, don't
reinvent. The one exception is `LandingPage` (public marketing page), which may be more expressive,
but still uses the same fonts and orange primary.

## Themes

- Two themes. Dark is the default: `index.html` reads `localStorage['pos_theme']` before first
  paint, and `hooks/useTheme.ts` sets/removes `data-theme="dark"` on `<html>`.
- Light values live in `:root`, dark overrides in `[data-theme="dark"]` (`styles/index.css`).
  Every screen must be checked in **both** themes.
- Never hardcode `#hex`/`oklch()`/`rgb()` in components. The only sanctioned exceptions are the
  chart palette (`components/report/charts/chartColors.ts`) and `Confetti`.

## Tokens — how they are consumed

Theme-aware tokens are used through Tailwind arbitrary values (this is the house syntax):

| Purpose | Class |
|---|---|
| Page / card / raised surfaces | `bg-[var(--color-surface-page)]`, `bg-[var(--color-surface-card)]`, `bg-[var(--color-surface-2)]`, `bg-[var(--color-surface-3)]`, hover `bg-[var(--color-surface-card-hover)]` |
| Text hierarchy | `text-[var(--color-text-main)]`, `text-[var(--color-text-soft)]`, `text-[var(--color-text-muted)]` |
| Borders / dividers | `border-[var(--border-subtle)]`, `border-[var(--border-strong)]`, `divide-[var(--border-subtle)]` |

- `primary-*` is the brand orange; `gray-*` is warm and **inverts in dark mode** (gray-50 is the
  darkest there), so `text-gray-700` stays readable in both themes.
- Status colors (emerald = success, amber = warning, red = error, primary = info): use translucent
  tints like `bg-emerald-500/12 text-emerald-600 border-emerald-500/25` — copy `Badge.tsx`. The
  `-50…-200` steps of the status palettes are tuned for dark surfaces; don't use them as light
  backgrounds.
- Fonts: body is `Outfit` (default `font-sans`), headings use `font-heading` (Plus Jakarta Sans).
  Don't add fonts — they are loaded from Google Fonts and the CSP only allows that origin.
- Motion: `animate-fade`, `animate-slide`, `animate-in`, `animate-slide-sheet`, `animate-slide-down`,
  `animate-shimmer`. Keep it subtle — this is a work tool used all day.

## Component kit (`components/ui/`) — use before writing markup

- `PageShell` — every panel page's root wrapper (padding, max-width, entry animation).
- `Button` — `variant`: primary | secondary | danger | ghost | emerald | outline | soft;
  `size`: sm | md | lg | xl.
- `Card` — `variant`: default | elevated | inset | glass | glass-strong | flat | panel | feature.
- `Modal` — `variant`: dialog | drawer; sizes sm…4xl/full. Destructive confirmation →
  `ConfirmModal` with `variant="danger"`, never `window.confirm`.
- `Badge` (success | warning | error | info | neutral, optional `dot`), `Input`, `Toggle`,
  `Spinner`, `Skeleton` (loading states — prefer over spinners for lists/cards).
- `Icon` — the only icon source (inline SVG, `strokeWidth` 1.75 default). A missing icon is added
  to the `IconName` union and map in `Icon.tsx`; don't install an icon library or paste SVGs inline.

Feedback: toasts via `react-hot-toast` (errors through `handleApiError`, see `frontend-data`).

## Layout and context

- POS, orders, cash and kitchen are used on tablets and touch screens: generous hit targets
  (`size="lg"` buttons on POS actions), no hover-only affordances.
- `currentBranchId === null` is the consolidated "all branches" view: valid only on read screens;
  POS / cash / kitchen show their own notice instead of rendering.
- Features behind a module flag must disappear from the Sidebar when the flag is off, not just
  403 on click.

## Charts (Recharts)

- Colors from `useChartColors()` / `useBarColors()` in `chartColors.ts` — they switch with the
  theme. `gray` is reserved for "Otros"; `red` only for negative values.
- A branch's color comes from `utils/branch-series.ts` (assigned over the name-sorted full list),
  never from ranking order.
- Tooltips: reuse `ChartTooltip`.

## Before handing back

`pnpm --filter frontend typecheck`, then look at the screen in light and dark, desktop and a
narrow (tablet/phone) width.

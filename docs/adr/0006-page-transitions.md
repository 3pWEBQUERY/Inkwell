# 0006 – Page transitions with React ViewTransition and a CSS fallback

**Status:** accepted · 2026-10-13

## Context

Every navigation should animate the content area only (fade out 120 ms, fade
in with 8 px lift 160 ms; horizontal on phone tab changes; shared first line
between card and reading view).

## Decision

- React 19.3's `<ViewTransition name="page">` wraps the content area in the app
  layout; the durations and curves live in `styles/motion.css` as CSS variables
  targeting `::view-transition-old/new(page)`.
- Cards and the reading view set `view-transition-name` on the first line, so
  the browser animates it between positions.
- Browsers without the View Transitions API get the enter half through a
  `@supports not (view-transition-name: none)` rule on the `template.tsx`
  wrapper, which re-mounts per navigation.
- `prefers-reduced-motion` and the in-app setting collapse all durations to
  80 ms linear fades through the same variables.

## Consequences

- No animation library on the critical path; Motion is reserved for layout
  animations in lists.
- Exit animations are only available where the platform supports them.

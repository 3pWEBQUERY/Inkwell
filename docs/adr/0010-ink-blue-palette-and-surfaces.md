# 0010 Ink-blue palette, layered surfaces, one floating shadow

Status: accepted. Supersedes the colour values in PRD section 13 (the principles stay).

## Context

The first palette (warm white `#FAF9F6`, muted ink `#2F4A6B`, text greys as
alpha over ink) read as quiet but also as flat and dated: one grey-blue for
every interactive element, no distinction between page and card, borders as
the only structure. The owner asked for a more modern interface with better
colours, explicitly without the look of generated templates (gradients,
glows, violet accents, glass, emoji, invented numbers).

## Decision

- **One accent, kept:** an ink blue (`#1A57AD` light, `#83B3FA` dark), derived
  in OKLCH at hue 258 so it stays clear of the violet-indigo range. Hover and
  link variants are separate tokens (`accent-hover`, `accent-text`) instead of
  opacity tricks.
- **Solid greys** instead of alpha over ink, so contrast is predictable on
  every surface. Every text/background pair used is at least WCAG AA; the
  numbers come from `oklch → sRGB` and are checked, not eyeballed.
- **Layered surfaces without shadows:** `paper` (page), `surface` (cards,
  inputs, dialogs), `paper-raised` (hover), `paper-sunken` (shell, wells,
  tracks). In the app the navigation sits on the sunken tone and the content
  in an inset paper panel; cards are surface plus a hairline.
- **One shadow, only for layers that float** (dialogs, menus, the completion
  sheet, the phone in the hero). Cards never cast one; PRD 13 still holds.
- **Night band:** a single deep-ink section on the landing page (`night`
  tokens) gives the page rhythm and carries the trust statements.
- **Type:** the serif becomes the display face (`.display`: weight 500, tight
  tracking) for page titles and the landing page; Inter gets the single-storey
  `a` and open digits. The wordmark dot reappears as the full stop of the
  headline, in the accent.
- **Product screenshots** are taken from the running app in both colour
  schemes and shown according to the reader's scheme; no mock-ups.
- **App icon:** a paper nib on an ink tile with the blue dot.

## Consequences

- Touch targets: controls are 36 to 40 px on fine pointers and grow to 44 px
  on coarse pointers (`pointer-coarse:`), instead of 44 px everywhere.
- Hard-coded colours outside CSS (manifest, theme-color, icon script, avatar
  tones) were updated with the tokens and must follow them in future changes.
- Lighthouse on `/` and `/rooms`: performance 99, accessibility 100, best
  practices 100, SEO 100, LCP about 1 s.

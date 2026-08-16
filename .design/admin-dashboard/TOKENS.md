# Admin Dashboard — Design Tokens

Phase B of the admin dashboard redesign (see `docs/admin-dashboard-redesign-plan.md`). Resolved via `designer-skills:grill-me`, implemented via `designer-skills:design-tokens`.

## Philosophy

Dark, utilitarian, data-dense. Deliberately distinct from the site's light editorial brand theme (Karrik/Offbit/Dirtyline, orange/purple on light gray) — this is an internal tool surface, not portfolio-facing. One thread of continuity: the accent color is derived from the main site's `--object-alt` purple.

## Scope and mechanism

- Tokens live in `src/styles/admin-theme.css`, scoped under a `.admin-theme` class — **not** merged into `src/App.css`'s global `:root`.
- Single fixed theme. No light mode, no toggle — this dark theme is the only mode the admin surface has.
- Consumption pattern matches the codebase's existing idiom for CSS variables (see `src/pages/LoginPage.jsx`): components reference tokens as Tailwind arbitrary values, e.g. `bg-[var(--admin-bg)]`, `text-[var(--admin-text-primary)]`, `border-[var(--admin-border)]`. No `tailwind.config.js` changes required.
- `AdminLayout.jsx` (Phase C) applies the `.admin-theme` class at the root of every admin page — that's the only place the class is added.

## Decisions from grilling

| Decision | Choice | Why |
|---|---|---|
| Background | Dark | Convention for internal ops tools; distinguishes admin from the public site |
| Aesthetic | Utilitarian / data-dense | Optimizes for an admin doing repetitive user-management tasks fast |
| Typography | System/UI sans stack | Site's display fonts (Karrik/Offbit/Dirtyline) were picked for brand personality, not density/legibility |
| Density | Compact | Small base font, tight table row padding, minimal form-field gaps |
| Accent | Desaturated/brightened `--object-alt` (#564ff3 → #8b85f5) | One thread of brand continuity, adjusted for dark-bg contrast |
| Semantics | Standard green=success/true, red=danger | Universally understood; no reason to reinvent given a custom neutral palette already differentiates admin from the brand |
| ConfirmDialog | Rebuilt fresh against these tokens | The old `bg-[#1a1a1a]` modal was an accidental leftover, not a deliberate anchor |

## Token reference

See `src/styles/admin-theme.css` for the full set. Categories: background (4 steps), text (3 steps), border (2 steps), accent (3 states), semantic success/danger (with tint backgrounds), disabled state, focus ring, spacing (4px base, 7 steps), typography (7 sizes + weights + line-heights), radius (3 steps, capped at 10px — functional, not rounded), and modal/card shadows.

## Next step

Phase C (`designer-skills:frontend-design`) rebuilds the five in-scope files against these tokens: `ConfirmDialog.jsx` → new `AdminLayout.jsx` → `AdminPagination.jsx` → `AdminUserTable.jsx` → `AdminDashboardPage.jsx` → `AdminUserDetailPage.jsx`, in that dependency order, per the plan doc.

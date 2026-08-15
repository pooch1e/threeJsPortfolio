# Admin Dashboard Redesign

## Context

The admin dashboard (`src/pages/admin/`, `src/components/admin/`) was built functionally-first and is now reported "unreadable and unusable" — contrasting colours, unreadable fonts. Root cause, confirmed by reading every admin file plus the site's global styles:

- The whole site has one light-gray background (`--color-bg: #d1d3d9` in `src/App.css`, applied via `src/layout/HomeStyle.jsx` to every page, no dark mode anywhere).
- `AdminUserTable.jsx` and `AdminPagination.jsx` hardcode Tailwind's **default dark-theme gray scale** (`text-gray-200/300/400`, `border-gray-700/800`, `hover:bg-gray-900/60`) directly as page content — i.e. light-gray text on a light-gray page. Near-zero contrast.
- `ConfirmDialog.jsx` hardcodes an unrelated ad-hoc dark modal (`bg-[#1a1a1a]`, `text-gray-300`) that bypasses every CSS variable in the codebase — readable in isolation, but a jarring, disconnected pop-in against the light page.
- `AdminUserDetailPage.jsx` uses `text-100` (12px) + `uppercase tracking-widest` for **every** form label — small, wide-tracked caps, a legibility anti-pattern — compounded by low-contrast colors (`--object-alt` #564ff3, `--text-alt` #aa92c2 pastel purple) against the light background.
- `tailwind.config.js` defines dead color aliases (`maintext`, `hovertext`, `accent`, `ink`) pointing at CSS variables that don't exist in `App.css` — no admin component actually uses them; there's effectively no coherent color contract on the admin surface at all.
- No `.design/` folder or documented visual system exists yet anywhere in the repo.

The user confirmed the admin dashboard does **not** need to reuse the site's tokens/fonts (it's an internal tool, not part of the portfolio brand), and asked to use the `designer-skills` plugin to grill and refine the direction rather than have me just pick something. They chose a **focused mini-flow** — `grill-me` (light) → `design-tokens` (admin-scoped) → `frontend-design` — explicitly skipping `design-brief`, `information-architecture`, and `brief-to-tasks` since the IA (table → detail/edit → delete-confirm) is fixed and working; only the visual system changes. Aesthetic direction is left for `grill-me` to resolve, not pre-chosen.

## Scope

**In scope:** `src/pages/admin/AdminDashboardPage.jsx`, `src/pages/admin/AdminUserDetailPage.jsx`, `src/components/admin/AdminUserTable.jsx`, `src/components/admin/AdminPagination.jsx`, `src/components/admin/ConfirmDialog.jsx`, plus a new admin-only layout wrapper.

**Out of scope / must not touch:** `src/layout/HomeStyle.jsx` (admin stops *using* it, it is never edited), `src/App.css` `:root` tokens (global — used by every non-admin page), any non-admin page, the Three.js `world/` scenes, `tailwind.config.js`'s existing (broken) aliases — leave them as dead code rather than risk touching something referenced elsewhere. This is a **visual-only** pass: all data-fetching, routing, validation, and interaction logic in these five files stays exactly as-is.

## Approach

### Phase A — `designer-skills:grill-me` (light pass)

Invoke with a scoped prompt that front-loads the codebase facts above (so it doesn't re-derive them and spends its questions on real decisions) and explicitly resolves:
1. Aesthetic philosophy/vibe for an internal admin tool (not the portfolio brand).
2. Light vs. dark background for the admin surface.
3. Keep site fonts (karrik/offbit/dirtyline) or use different ones for admin.
4. Whether `ConfirmDialog`'s existing dark aesthetic anchors the new direction, or gets rebuilt to match everything else.

Explicitly tell it to skip IA/nav/page-count questions — those are fixed. No file output; the resolution is captured as prose to feed Phase B.

### Phase B — `designer-skills:design-tokens` (admin-scoped)

Invoke with the grill-me resolution, and require:
- Output lives under `.design/admin-dashboard/` (new folder, doesn't exist yet) — this must **not** modify or merge into `src/App.css`'s `:root` (global, used site-wide).
- Token mechanism: a **new scoped CSS class** (e.g. `.admin-theme`), not a `tailwind.config.js` theme extension, not `:root` edits. Concretely: a small new stylesheet (e.g. `src/styles/admin-theme.css`) defining CSS custom properties under `.admin-theme { --admin-bg: ...; --admin-text: ...; }`, imported once. Admin components then use the same arbitrary-value pattern already idiomatic to this codebase — `bg-[var(--admin-bg)]`, `text-[var(--admin-text)]` — no `tailwind.config.js` changes required.
- Single fixed theme (no site-wide dark-mode toggle exists) — skip generating a light/dark switcher; just fully flesh out the one chosen mode.

### Phase C — `designer-skills:frontend-design` (rebuild)

Rebuild in dependency order so each piece can be sanity-checked before composing into a page:

1. **`ConfirmDialog.jsx`** first — most disconnected, shared leaf used by both pages. Preserve prop contract (`open`/`title`/`message`/`onConfirm`/`onCancel`) and early-return/backdrop/two-button layout exactly; replace all hardcoded colors with `.admin-theme` tokens.
2. **New `AdminLayout.jsx`** (sibling to `HomeStyle.jsx`, not an edit to it) — wraps admin pages in `.admin-theme`. Build alongside step 1.
3. **`AdminPagination.jsx`** — preserve `pagination`/`onPageChange` contract and boundary-disable logic; retoken colors only.
4. **`AdminUserTable.jsx`** — preserve all props/behavior (row click nav, stopPropagation on delete, empty/loading states, is_admin badge, date formatting); retoken header/row/badge/delete-button colors, reconsider hover/zebra treatment per chosen aesthetic rather than a literal swap.
5. **`AdminDashboardPage.jsx`** — swap `<HomeStyle>` → `<AdminLayout>`; preserve all data-fetching/pagination/filter/delete-confirm wiring; retoken heading and filter input.
6. **`AdminUserDetailPage.jsx`** last (reuses the now-fixed `ConfirmDialog`) — preserve all `react-hook-form` wiring, validation rules, `isSelf` guard, API calls, message branches exactly; fix the `labelClass`/`inputClass` legibility bug (12px + wide-tracked caps) and retoken all colors including the stray `text-gray-500`/`text-green-400` and danger-zone delete button.

## Verification

1. `npm run dev`, navigate to `/admin` and `/admin/users/:id` logged in as an admin (check `AdminRoute`/`userLoginStore` for how to get a real admin session in dev).
2. **Contrast, manual:** table header/rows, pagination buttons (enabled + disabled), `ConfirmDialog` (triggered from both the table and the detail page), and the edit form (labels, inputs, focus ring, validation errors, success messages, disabled self-admin/self-delete states) — all must be legible against the new background, no more light-on-light or disconnected dark popups.
3. **Functional regression (must be unchanged):** filter narrows table client-side; pagination advances/retreats and disables at bounds; deleting the last user on a page >1 steps back a page; delete confirm/cancel flow; edit save success/validation-error paths; all 5 password-reset validation rules; mismatched-password error; self-account disables admin-checkbox and delete button with captions.
4. **Non-admin pages untouched:** spot-check `/` (HomePage) and login/signup still render with the original `--color-bg` background and fonts — confirms `HomeStyle.jsx` and `App.css` `:root` weren't touched.
5. **Automated:** run `npx vitest run` — `AdminRoute.test.jsx` and user-store tests should pass unmodified (no data/auth logic changed, only markup/classNames). Run `npm run lint` on the touched files.
6. Optional: `designer-skills:design-review` against `.design/admin-dashboard/` as a closing critique pass (maps to the user's "refine" ask).

# Instructions for coding agents

Cloudflare Workers app for LoA Alexandria / Pop Epoch. Astro renders pages;
Hono owns mutations; free calculator math runs in Preact islands; data lives
in D1 (plus Durable Objects and R2 where the product requires them). Spec and
build order: `../SoftwareDesign/product/scope.md`. Stack decision:
`../SoftwareDesign/decisions/0004-astro-app-stack.md`.

`game-calculators/` is evidence for jobs and the **visual** source of truth.
It is Next.js/React/Supabase — do not copy that stack onto this Worker.

## Working rules

- Astro for pages and shell; Hono for `/api/*` writes and privileged reads;
  Preact islands only where interactivity is required. Prefer
  `client:visible` / `client:idle` over `client:load`.
- Permission checks are application code in Hono (or shared Worker modules).
  Stored site rank is master; Discord roles follow the site, never the reverse
  (`../SoftwareDesign/decisions/0001-stored-rank-is-master.md`).
- Feature “Done when” lives under `../SoftwareDesign/features/`. Prefer those
  specs over copying `game-calculators` behavior.
- Keep calculator formulas deterministic and separate from presentation. Never
  silently change a formula or assumption; update tests and user-facing notes
  in the same change. Hono only gates Premium locks and persists what the
  product requires — solvers stay in the browser.
- Prefer focused modules over large shared abstractions; extract only after
  two real consumers need it.
- Preserve keyboard access, visible labels, mobile layouts, and reduced-motion.
- Secrets only via Worker bindings / `.dev.vars`. Do not commit `.dev.vars`,
  generated build output, or personal data.
- Implement scope phases in order. Do not start phase 2+ product work until
  the phase 1 session + rank shell is in place.
- Keep changes small and single-purpose. There is no second maintainer: name
  risks and what you verified (or did not) in chat / the PR instead of asking
  for a review that will not happen.

## UI

Match `game-calculators` look. Port tokens and shell styles; do not invent a
second palette, font stack, or card language.

- Source: `../game-calculators/app/globals.css`, `../game-calculators/lib/theme.ts`
- Ported shell: `src/styles/global.css`; calculator chrome: `src/styles/calc.css`
- Cursor rule (repo root): `.cursor/rules/community-site-ui.mdc`

Check UI changes in a browser, including a narrow screen and light/dark.

## Before editing

1. Read `README.md` and the relevant feature under `../SoftwareDesign/features/`.
2. For pages/islands, use `.agents/skills/astro/SKILL.md`. For `/api/*`,
   sessions, D1 writes, or Durable Objects, use `.agents/skills/hono/SKILL.md`.
3. For calculators, read `src/lib/calculators/` and existing tests; state any
   assumption that changes a formula, range, or game-data interpretation.
4. For UI, open the matching screen in `game-calculators` before restyling.

## Required verification

```sh
npm run check
npm run test
npm run build
```

Apply local D1 migrations when schema changes: `npm run db:migrate:local`.

Report what changed, assumptions made, and verification results. Do not claim
a calculation is correct without a test covering its important boundaries.

## Project map

| Area | Where |
| --- | --- |
| Pages | `src/pages/` |
| Shell / layouts | `src/layouts/`, `src/components/AppShell.astro` |
| Islands | `src/components/**/*.tsx` |
| Hono API | `src/api/`, entry `src/worker.ts` |
| Auth / rank | `src/lib/auth/` |
| Content / publish | `src/lib/content/`, `src/api/routes/content.ts` |
| Calculators | `src/lib/calculators/`, `src/components/calc/` |
| Benben DO | `src/durable-objects/benben.ts` |
| i18n | `src/lib/i18n/` |
| Styles | `src/styles/` |

## Dev server

Prefer background mode when using the Astro CLI helpers:

```
astro dev --background
```

Manage with `astro dev stop`, `astro dev status`, and `astro dev logs`. Ordinary
`npm run dev` is fine for a foreground session.

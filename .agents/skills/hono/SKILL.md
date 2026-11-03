---
name: hono
description: Implement mutating HTTP actions for the LoA community site with Hono on Cloudflare Workers beside Astro. Use when adding sign-in, sessions, publish, Benben care, guild chat, Premium claims, event boards, API routes, middleware, D1 writes, Durable Object stubs, or when following SoftwareDesign scope phases 1–4.
---

# Hono on the community site

Hono owns **actions that change something**. Astro owns **pages**. Same Cloudflare Worker. Follow [0004 — Astro app stack](../../../../SoftwareDesign/decisions/0004-astro-app-stack.md) and [0002 — Cloudflare platform](../../../../SoftwareDesign/decisions/0002-cloudflare-platform.md). Feature “done when” rules live under `SoftwareDesign/features/`; do not invent permissions.

## When to use

- Adding or changing `/api/*` (or equivalent action) routes
- Session cookies, sign-in, rank checks, Discord role sync
- D1 writes, R2 upload authorization, Durable Object calls
- Implementing work from [scope.md](../../../../SoftwareDesign/product/scope.md) phases 1–4

For page markup, collections, and islands, use the [astro](../astro/SKILL.md) skill instead.

## Core principles

- One Worker: Astro renders; Hono mutates.
- Permission checks are application code in Hono (or shared Worker modules). D1 has no row-level rules.
- Waiting on D1, R2, or Discord does not spend Worker CPU; keep handlers thin—no heavy HTML in Hono.
- Calculator math stays in the browser. Hono only gates Premium locks and persists what the product requires.
- Live rooms (Benben, guild/alliance chat) are Durable Objects with WebSocket hibernation. Hono opens or forwards; it does not hold long-lived chat state in the isolate.
- Readers load R2 assets directly. Hono authorizes uploads and writes the catalog row; it does not proxy downloads.
- Stored site rank is master ([0001](../../../../SoftwareDesign/decisions/0001-stored-rank-is-master.md)). Discord roles follow the site, never the reverse.
- Prefer TypeScript. Validate bodies with Zod (or Hono validators). Return stable JSON error shapes; never leak provider raw errors to the client ([Sign in](../../../../SoftwareDesign/features/identity/sign-in.md)).

## Project shape

Prefer a clear split under `src/`:

```text
src/
  pages/           # Astro routes
  server/          # Worker server entry helpers (optional)
  api/             # Hono app and routers (or worker/hono/)
    index.ts       # createApp() → Hono instance
    middleware/    # session, csrf, rank
    routes/        # one module per domain
  lib/             # shared pure helpers / D1 access
```

Mount Hono from the Cloudflare/Astro adapter entry so page routes and `/api/*` share bindings (`DB`, `R2`, DO namespaces, secrets).

## Middleware order

1. Request id / logging (optional, cheap)
2. Session load (signed cookie → member id + rank + entitlements)
3. CSRF or same-site checks on cookie-authenticated POSTs
4. Route handler
5. Map domain failures to HTTP status (`401` anonymous, `403` rank/permission, `404` missing, `409` conflict, `429` rate / daily cap)

Shared helpers:

- `requireSession()` — signed-in member
- `requireRank(...ranks)` — site admin / Editor / …
- `requirePublishPermission()` — Editor with publish permission, or site admin ([Publish](../../../../SoftwareDesign/features/content/publish.md))

## Route map by scope phase

Implement in build order. Do not start phase 2+ routes until phase 1 session + rank shell exists.

| Phase | Hono owns (mutations / privileged reads) | Not Hono |
| --- | --- | --- |
| **1** Shell | Sign-in / sign-out / Discord OAuth callback; link Discord; prepare & translate content; save interface-string translations; publish; assign site rank + Discord staff role sync; Benben care actions; Discord Benben status update | Public read of published pieces (Astro); free calculator math (islands) |
| **2** Guilds | Create/edit guild (site admin); join request; officer accept/decline; roster changes; member/officer chat via DO; alliance create/chat | Chat UI islands; static guild pages where prerenderable |
| **3** Premium | Claims submit/approve; manual grants; entitlement sync → Discord Premium role; Early Supporter award; guild registration / transfer / freeze | Payment provider UI; Premium calculator math (island, locked by entitlement check) |
| **4** Events | Turn events on/off; day scores; pledges; siege/territory board writes; event-alliance offers | Board rendering islands; read models that can be SSR’d thinly |

Detailed action checklist: [scope-phases.md](scope-phases.md).

## Durable Objects

- One Benben object for the community pet; apply need fade on read/write from last saved time (no cron required for correctness).
- One DO per guild member chat and per officer chat; alliance chats likewise.
- Hibernation is required on free plan. Billable duration must not run on idle sockets.
- After a care or chat write, keep D1 (or catalog) and the live object in agreement from the Worker—do not assume eventual magic sync.

## D1 and R2

- Batch writes when many guild actions could burn the free daily write cap.
- One statement / query budgets per request matter on free plan; avoid N+1 scans.
- Asset upload: check site rank → put object in R2 → insert catalog row (name, kind, size, key). Guide bodies store the catalog key only.

## Testing

- Unit-test permission helpers and Benben daily-cap / fade rules with Vitest (no Worker required).
- Integration-test Hono routes with bindings mocked or `wrangler`/Miniflare when adding real D1.
- Astro page tests stay out of this skill.

## Anti-patterns

- Next.js API routes, Express, or a second Node host
- Supabase or external DB as source of truth (D1 is the store)
- Putting full page HTML or calculator solvers in Hono
- Proxying R2 downloads through the Worker
- Trusting Discord roles as rank authority
- Long-lived WebSockets outside DO hibernation
- Implementing phase 3 guild self-registration before Premium entitlement exists

## Debugging workflow

1. Reproduce with `npm run dev` (or `wrangler`/Astro Cloudflare preview).
2. Confirm the request hit Hono (`/api/...`), not an Astro page.
3. Check session cookie and middleware order.
4. Verify D1 binding and migration state.
5. For live rooms, confirm the DO id and hibernation path.
6. `npm run check` and `npm run build` before done.

## Commands

```bash
npm run dev
npm run check
npm run build
npx wrangler d1 migrations apply DB --local
```

## Safety

- Secrets only via Worker bindings / `.dev.vars`, never committed.
- When an unfamiliar Hono or Workers API is needed, read current upstream docs before coding.
- Prefer the feature spec’s “Done when” over copying `game-calculators` behavior.

# Community site (Astro)

Cloudflare Workers app for LoA Alexandria / Pop Epoch. Stack: Astro pages, Hono actions, D1, Free calculators as Preact islands. See [0004](../SoftwareDesign/decisions/0004-astro-app-stack.md).

Agent skills: [astro](.agents/skills/astro/SKILL.md), [hono](.agents/skills/hono/SKILL.md).

## Scripts

```bash
npm run dev
npm run check
npm run test
npm run build
npm run preview
npm run db:migrate:local
```

Copy `.dev.vars.example` to `.dev.vars` and set `SESSION_SECRET`. Optionally set `BOOTSTRAP_ADMIN_USERNAME` so the first matching register becomes site admin (only while no admin exists). Discord keys stay commented until enabled; with secrets present, OAuth + role sync run.

## Routes

- Language URLs: `/en/`, `/de/`, `/fr/`, `/ru/`, `/es/` (root negotiates `Accept-Language`)
- Read: `/[lang]/news/`, `/guides/`, `/events/` (prefer D1 `published_pieces`, fall back to seed markdown)
- Editorial: `/[lang]/content-builder/`, `/interface-strings/`, `/admin/`
- Benben: `/[lang]/benben/` · `POST /api/benben/care` (3/UTC day)
- Auth: `/[lang]/sign-in/` · API `/api/auth/*` (Discord OAuth when secrets are set)
- Calculators: `/[lang]/calculators/` (six free tools)

## Editorial APIs

- `POST /api/content/prepare` · `translate` · `publish` · `unpublish`
- `GET /api/content/drafts` · `GET /api/content/drafts/:kind/:slug`
- `GET|POST /api/content/interface-strings`
- `GET /api/admin/members` · `POST /api/admin/site-rank` · `publish-permission` · `languages` · `discord-role-sync`

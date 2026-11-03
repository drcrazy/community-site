# Scope phases → Hono actions

Source of truth: [SoftwareDesign/product/scope.md](../../../../SoftwareDesign/product/scope.md). Each bullet lists mutations or privileged work Hono should expose. Astro/islands handle reads and client math unless noted.

Paths below are suggestions (`/api/...`); keep them stable once shipped.

## Phase 1 — Read, sign in, publish, Benben, free calculators

Shell every later phase assumes.

| Action | Spec | Notes |
| --- | --- | --- |
| `POST /api/auth/sign-in/password` | [Sign in](../../../../SoftwareDesign/features/identity/sign-in.md) | Username 3–24 `[A-Za-z0-9_]`; no email. Session cookie. |
| `POST /api/auth/sign-out` | Sign in | Clear session. |
| `GET/POST /api/auth/discord/*` | Sign in | OAuth start + callback. First visit → Normal user if no stored rank. |
| `POST /api/auth/discord/link` | Sign in | Link Discord to current session; do not merge two existing accounts. |
| `POST /api/content/prepare` | [Prepare](../../../../SoftwareDesign/features/content/prepare.md) | Editor/site admin English draft create/update. |
| `POST /api/content/translate` | Prepare + [0003](../../../../SoftwareDesign/decisions/0003-two-translation-flows.md) | Assigned languages only; cannot change English. |
| `POST /api/content/interface-strings` | [Interface strings](../../../../SoftwareDesign/features/content/interface-strings.md) | Translate existing keys; English ships in app. |
| `POST /api/content/publish` | [Publish](../../../../SoftwareDesign/features/content/publish.md) | Require publish permission or site admin. Idempotent replace by identity. |
| `POST /api/admin/site-rank` | [Site rank](../../../../SoftwareDesign/features/identity/site-rank.md) | Site admin only. |
| `POST /api/admin/publish-permission` | [Publish](../../../../SoftwareDesign/features/content/publish.md) | Site admin grants/revokes publish on an Editor. |
| `POST /api/admin/discord-role-sync` | [Discord role sync](../../../../SoftwareDesign/features/identity/discord-role-sync.md) | Follow stored rank after link/rank change. |
| `POST /api/benben/care` | [Community pet](../../../../SoftwareDesign/features/benben/community-pet.md) | Signed-in; max 3 care actions / UTC day; 4th → refuse. Update Benben DO + D1. |
| Benben Discord status | [Benben on Discord](../../../../SoftwareDesign/features/benben/discord-channel-pet.md) | Same pet; channel status message update from Worker. |

Not Hono: language URL reads ([Language URLs](../../../../SoftwareDesign/features/reading/language-urls.md), [Published pieces](../../../../SoftwareDesign/features/reading/published-pieces.md)); free calculator logic ([Free tools](../../../../SoftwareDesign/features/calculators/free-tools.md)).

## Phase 2 — Guild membership and chat

Guilds are **admin-created** in this phase. No member registration, no freeze (Premium not yet).

| Action | Spec | Notes |
| --- | --- | --- |
| `POST /api/admin/guilds` | [Registration](../../../../SoftwareDesign/features/guilds/registration.md) | Site admin create/edit. |
| `POST /api/guilds/:id/join` | [Join and roster](../../../../SoftwareDesign/features/guilds/join-and-roster.md) | Request to join. |
| `POST /api/guilds/:id/applications/:appId` | Join and roster | Officer accept/decline. |
| Roster mutations | Join and roster | Officer/master/site admin per spec. |
| Member chat WS/API | [Member chat](../../../../SoftwareDesign/features/guilds/member-chat.md) | Accepted members only → guild member-chat DO. |
| Officer chat WS/API | [Officer chat](../../../../SoftwareDesign/features/guilds/officer-chat.md) | Officers (+ rules in spec) → officer-chat DO. |
| Alliance create + chats | [Alliances](../../../../SoftwareDesign/features/guilds/alliances.md) | Permanent alliances; two chats as own DOs. |

Event-alliance offers wait for phase 4.

## Phase 3 — Premium

| Action | Spec | Notes |
| --- | --- | --- |
| Claim submit / admin review | [Claims](../../../../SoftwareDesign/features/premium/claims.md) | History retained. |
| Manual grant/revoke | [Entitlement](../../../../SoftwareDesign/features/premium/entitlement.md) | Site admin. |
| Discord Premium role sync | Entitlement | Site master; only for active Premium. |
| Guild register / transfer / remove / freeze | [Registration](../../../../SoftwareDesign/features/guilds/registration.md) | One guild per Premium member; freeze when Premium lapses. |
| Early Supporter award | [Early Supporter](../../../../SoftwareDesign/features/premium/early-supporter.md) | Max 20; opt-in public list; Discord roles follow. |
| Premium lock check | [Premium lock](../../../../SoftwareDesign/features/calculators/premium-lock.md) | API may confirm entitlement; math stays in island. |

## Phase 4 — Guild event planning

Depends on phase 2 posts/officer chat. Event alliances need siege/territory base markers.

| Action | Spec | Notes |
| --- | --- | --- |
| Event on/off | [Day scores](../../../../SoftwareDesign/features/events/day-scores.md) | Off clears plan after confirm (targets, scores, pledges, painted territory, event alliance). |
| Day scores / pledges | Day scores | Officers, master, site admin. |
| Siege board writes | [Siege board](../../../../SoftwareDesign/features/events/siege-board.md) | Persist board state; batch D1 writes. |
| Territory board writes | [Territory board](../../../../SoftwareDesign/features/events/territory-board.md) | Dawn of Rome / Crown of the Nile. |
| Event-alliance offers | [Alliances](../../../../SoftwareDesign/features/guilds/alliances.md) | Carry chosen base from boards. |

## Closed / open product decisions

- **Publish** — permission on Editor, not a second rank ([scope](../../../../SoftwareDesign/product/scope.md) closed decision 1).
- **Discord share of published pieces** — still open; not a site job until decided. Benben Discord command is already phase 1.

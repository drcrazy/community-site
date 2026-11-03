import { Hono } from "hono";
import { memberFromRequest } from "./auth";
import { CARE_ACTIONS, publicBenbenView, type CareAction, type BenbenState } from "../../lib/benben/state";
import { permissionResponse, requireMember } from "../../lib/auth/permissions";

type AppEnv = { Bindings: Env };

function jsonError(code: string, message: string, status: number) {
  return Response.json({ code, message }, { status });
}

async function benbenStub(env: Env) {
  if (!env.BENBEN) return null;
  return env.BENBEN.get(env.BENBEN.idFromName("community"));
}

async function getState(env: Env): Promise<BenbenState | null> {
  const stub = await benbenStub(env);
  if (!stub) return null;
  const res = await stub.fetch("https://benben/state");
  if (!res.ok) return null;
  return (await res.json()) as BenbenState;
}

async function updateDiscordStatus(env: Env, state: BenbenState) {
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_BENBEN_CHANNEL_ID || !env.DISCORD_BENBEN_MESSAGE_ID) {
    return { skipped: true as const };
  }
  const view = publicBenbenView(state, null);
  const content = [
    "**Benben**",
    `Hunger ${view.needs.hunger} · Shine ${view.needs.shine} · Warmth ${view.needs.warmth} · Rest ${view.needs.rest}`,
    `Journey landscape ${view.journey.landscape + 1}/7 · milestone ${view.journey.milestone + 1}/5`,
    view.phoenixActive ? "Phoenix is visiting." : "No phoenix right now.",
  ].join("\n");
  const res = await fetch(
    `https://discord.com/api/v10/channels/${env.DISCORD_BENBEN_CHANNEL_ID}/messages/${env.DISCORD_BENBEN_MESSAGE_ID}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );
  return { ok: res.ok, status: res.status };
}

export const benbenRoutes = new Hono<AppEnv>({ strict: false });

benbenRoutes.get("/state", async (c) => {
  const member = await memberFromRequest(c);
  const state = await getState(c.env);
  if (!state) {
    return jsonError("benben_unavailable", "Benben is not configured on this worker yet.", 503);
  }
  return c.json(publicBenbenView(state, member?.id ?? null));
});

benbenRoutes.post("/care", async (c) => {
  try {
    const member = requireMember(await memberFromRequest(c));
    let body: { action?: string };
    try {
      body = await c.req.json();
    } catch {
      return jsonError("invalid_body", "Send { action }.", 400);
    }
    if (!body.action || !(CARE_ACTIONS as string[]).includes(body.action)) {
      return jsonError("invalid_action", "action must be feed, polish, sunbathe, or rest.", 400);
    }
    const stub = await benbenStub(c.env);
    if (!stub) return jsonError("benben_unavailable", "Benben is not configured.", 503);
    const res = await stub.fetch("https://benben/care", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId: member.id, action: body.action as CareAction }),
    });
    const payload = (await res.json()) as { state?: BenbenState; code?: string; message?: string };
    if (!res.ok || !payload.state) {
      return Response.json(
        { code: payload.code ?? "care_failed", message: payload.message ?? "Care failed." },
        { status: res.status },
      );
    }
    void updateDiscordStatus(c.env, payload.state);
    return c.json({ ok: true, ...publicBenbenView(payload.state, member.id) });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("care_failed", "Care failed.", 400);
  }
});

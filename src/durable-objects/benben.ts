import { applyCare, applyHourlyDecay, normalizeBenbenState, type BenbenState, type CareAction } from "../lib/benben/state";

export class BenbenDurableObject {
  private state: DurableObjectState;
  private env: Env;
  private cache: BenbenState | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async load(): Promise<BenbenState> {
    if (this.cache) return this.cache;
    const stored = await this.state.storage.get<BenbenState>("benben");
    this.cache = normalizeBenbenState(stored);
    return this.cache;
  }

  private async save(next: BenbenState) {
    this.cache = next;
    await this.state.storage.put("benben", next);
    try {
      await this.env.DB.prepare(
        `INSERT INTO benben_snapshot (id, payload_json, updated_at)
         VALUES (1, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`,
      )
        .bind(JSON.stringify(next))
        .run();
    } catch {
      /* snapshot table may be missing until migration applied */
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/state") {
      const state = applyHourlyDecay(await this.load());
      await this.save(state);
      return Response.json(state);
    }
    if (request.method === "POST" && url.pathname === "/care") {
      const body = (await request.json()) as { memberId?: string; action?: CareAction; caretakerName?: string };
      if (!body.memberId || !body.action) {
        return Response.json({ code: "invalid_body", message: "memberId and action required." }, { status: 400 });
      }
      const result = applyCare(await this.load(), body.memberId, body.action, new Date(), body.caretakerName || "Someone");
      if (!result.ok) {
        return Response.json({ code: result.reason, message: "Daily care limit reached.", state: result.state }, { status: 429 });
      }
      await this.save(result.state);
      return Response.json({ ok: true, state: result.state });
    }
    return new Response("Not found", { status: 404 });
  }
}

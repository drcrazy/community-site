import { Hono } from "hono";
import { memberFromRequest } from "./auth";
import {
  isTranslateLocale,
  permissionResponse,
  requireAdmin,
  type TranslateLocale,
} from "../../lib/auth/permissions";
import { findMemberById, listMembersForAdmin, setMemberLanguages, toPublicMemberWithLanguages } from "../../lib/auth/members";
import { syncDiscordRoles } from "../../lib/auth/discord";

type AppEnv = { Bindings: Env };

function jsonError(code: string, message: string, status: number) {
  return Response.json({ code, message }, { status });
}

async function parseJson<T>(c: { req: { json: () => Promise<unknown> } }): Promise<T | null> {
  try {
    return (await c.req.json()) as T;
  } catch {
    return null;
  }
}

export const adminRoutes = new Hono<AppEnv>({ strict: false });

adminRoutes.get("/members", async (c) => {
  try {
    requireAdmin(await memberFromRequest(c));
    const members = await listMembersForAdmin(c.env.DB);
    return c.json({ members });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("list_failed", "Could not list members.", 500);
  }
});

adminRoutes.post("/site-rank", async (c) => {
  try {
    requireAdmin(await memberFromRequest(c));
    const body = await parseJson<{ memberId?: string; siteRank?: SiteRank }>(c);
    if (!body?.memberId || !body.siteRank || !["normal", "editor", "admin"].includes(body.siteRank)) {
      return jsonError("invalid_body", "Send memberId and siteRank.", 400);
    }
    const row = await findMemberById(c.env.DB, body.memberId);
    if (!row) return jsonError("not_found", "Member not found.", 404);
    const publish = body.siteRank === "admin" ? 1 : body.siteRank === "normal" ? 0 : row.publish_permission;
    await c.env.DB.prepare("UPDATE members SET site_rank = ?, publish_permission = ? WHERE id = ?")
      .bind(body.siteRank, publish, body.memberId)
      .run();
    const updated = await findMemberById(c.env.DB, body.memberId);
    if (!updated) return jsonError("update_failed", "Update failed.", 500);
    const member = await toPublicMemberWithLanguages(c.env.DB, updated);
    await syncDiscordRoles(c.env, member);
    return c.json({ member });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("update_failed", "Could not update rank.", 400);
  }
});

adminRoutes.post("/publish-permission", async (c) => {
  try {
    requireAdmin(await memberFromRequest(c));
    const body = await parseJson<{ memberId?: string; publishPermission?: boolean }>(c);
    if (!body?.memberId || typeof body.publishPermission !== "boolean") {
      return jsonError("invalid_body", "Send memberId and publishPermission.", 400);
    }
    const row = await findMemberById(c.env.DB, body.memberId);
    if (!row) return jsonError("not_found", "Member not found.", 404);
    if (row.site_rank !== "editor" && row.site_rank !== "admin") {
      return jsonError("invalid_rank", "Publish permission only applies to Editors (admins always publish).", 400);
    }
    const value = row.site_rank === "admin" ? 1 : body.publishPermission ? 1 : 0;
    await c.env.DB.prepare("UPDATE members SET publish_permission = ? WHERE id = ?")
      .bind(value, body.memberId)
      .run();
    const updated = await findMemberById(c.env.DB, body.memberId);
    if (!updated) return jsonError("update_failed", "Update failed.", 500);
    return c.json({ member: await toPublicMemberWithLanguages(c.env.DB, updated) });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("update_failed", "Could not update publish permission.", 400);
  }
});

adminRoutes.post("/languages", async (c) => {
  try {
    requireAdmin(await memberFromRequest(c));
    const body = await parseJson<{ memberId?: string; languages?: string[] }>(c);
    if (!body?.memberId || !Array.isArray(body.languages)) {
      return jsonError("invalid_body", "Send memberId and languages[].", 400);
    }
    const locales = body.languages.filter((locale): locale is TranslateLocale => isTranslateLocale(locale));
    const row = await findMemberById(c.env.DB, body.memberId);
    if (!row) return jsonError("not_found", "Member not found.", 404);
    await setMemberLanguages(c.env.DB, body.memberId, locales);
    return c.json({ member: await toPublicMemberWithLanguages(c.env.DB, row) });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("update_failed", "Could not update languages.", 400);
  }
});

adminRoutes.post("/discord-role-sync", async (c) => {
  try {
    requireAdmin(await memberFromRequest(c));
    const body = await parseJson<{ memberId?: string }>(c);
    if (!body?.memberId) return jsonError("invalid_body", "Send memberId.", 400);
    const row = await findMemberById(c.env.DB, body.memberId);
    if (!row) return jsonError("not_found", "Member not found.", 404);
    const member = await toPublicMemberWithLanguages(c.env.DB, row);
    const result = await syncDiscordRoles(c.env, member);
    return c.json(result);
  } catch (error) {
    return permissionResponse(error) ?? jsonError("sync_failed", "Discord role sync failed.", 400);
  }
});

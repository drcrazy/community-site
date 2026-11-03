import { Hono } from "hono";
import { memberFromRequest } from "./auth";
import {
  allowsAnyTranslate,
  allowsPrepare,
  allowsPublish,
  isTranslateLocale,
  PermissionError,
  permissionResponse,
  requirePrepare,
  requirePublish,
  requireTranslate,
} from "../../lib/auth/permissions";
import { isContentKind, type ContentBuilderDraft } from "../../lib/content/content-builder";
import {
  getDraft,
  getDraftTranslations,
  listDrafts,
  parseDraftBody,
  publishDraft,
  unpublishPiece,
  upsertDraftTranslation,
  upsertEnglishDraft,
} from "../../lib/content/store";
import { englishDictKeys, ui } from "../../lib/i18n/ui";
import type { Locale } from "../../lib/i18n/locales";

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

export const contentRoutes = new Hono<AppEnv>({ strict: false });

contentRoutes.post("/prepare", async (c) => {
  try {
    const member = requirePrepare(await memberFromRequest(c));
    const body = await parseJson<{ draft?: ContentBuilderDraft }>(c);
    if (!body?.draft || !isContentKind(body.draft.kind)) {
      return jsonError("invalid_body", "Send { draft } with a valid kind.", 400);
    }
    const row = await upsertEnglishDraft(c.env.DB, { memberId: member.id, draft: body.draft });
    if (!row) return jsonError("save_failed", "Could not save draft.", 500);
    return c.json({
      draft: {
        id: row.id,
        kind: row.kind,
        slug: row.slug,
        categoryId: row.category_id,
        position: row.position,
        title: row.english_title,
        summary: row.english_summary,
        body: parseDraftBody(row.english_body_json),
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("save_failed", error instanceof Error ? error.message : "Save failed.", 400);
  }
});

contentRoutes.post("/translate", async (c) => {
  try {
    const body = await parseJson<{
      kind?: string;
      slug?: string;
      locale?: string;
      title?: string;
      summary?: string;
      body?: ContentBuilderDraft;
    }>(c);
    if (!body?.kind || !isContentKind(body.kind) || !body.slug || !body.locale || !isTranslateLocale(body.locale)) {
      return jsonError("invalid_body", "Send kind, slug, locale, and translation fields.", 400);
    }
    const member = requireTranslate(await memberFromRequest(c), body.locale);
    const draft = await upsertDraftTranslation(c.env.DB, {
      memberId: member.id,
      kind: body.kind,
      slug: body.slug,
      locale: body.locale as Locale,
      title: body.title?.trim() ?? "",
      summary: body.summary?.trim() ?? "",
      bodyJson: JSON.stringify(body.body ?? {}),
    });
    return c.json({ ok: true, draftId: draft.id, locale: body.locale });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("translate_failed", error instanceof Error ? error.message : "Translate failed.", 400);
  }
});

contentRoutes.post("/publish", async (c) => {
  try {
    const member = requirePublish(await memberFromRequest(c));
    const body = await parseJson<{ kind?: string; slug?: string; draft?: ContentBuilderDraft }>(c);
    if (body?.draft && isContentKind(body.draft.kind)) {
      requirePrepare(member);
      await upsertEnglishDraft(c.env.DB, { memberId: member.id, draft: body.draft });
    }
    if (!body?.kind || !isContentKind(body.kind) || !body.slug) {
      return jsonError("invalid_body", "Send kind and slug (and optional draft).", 400);
    }
    const result = await publishDraft(c.env.DB, {
      memberId: member.id,
      kind: body.kind,
      slug: body.slug,
    });
    return c.json({ ok: true, ...result });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("publish_failed", error instanceof Error ? error.message : "Publish failed.", 400);
  }
});

contentRoutes.post("/unpublish", async (c) => {
  try {
    requirePublish(await memberFromRequest(c));
    const body = await parseJson<{ kind?: string; slug?: string }>(c);
    if (!body?.kind || !isContentKind(body.kind) || !body.slug) {
      return jsonError("invalid_body", "Send kind and slug.", 400);
    }
    await unpublishPiece(c.env.DB, body.kind, body.slug);
    return c.json({ ok: true });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("unpublish_failed", "Unpublish failed.", 400);
  }
});

contentRoutes.get("/drafts", async (c) => {
  try {
    const member = await memberFromRequest(c);
    if (!member || (!allowsPrepare(member) && !allowsAnyTranslate(member))) {
      throw new PermissionError("forbidden", "Editor, translator, or admin required.", 403);
    }
    const kindParam = c.req.query("kind");
    const kind = kindParam && isContentKind(kindParam) ? kindParam : undefined;
    const rows = await listDrafts(c.env.DB, kind);
    return c.json({
      drafts: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        slug: row.slug,
        categoryId: row.category_id,
        position: row.position,
        title: row.english_title,
        summary: row.english_summary,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("list_failed", "Could not list drafts.", 500);
  }
});

contentRoutes.get("/drafts/:kind/:slug", async (c) => {
  try {
    const member = await memberFromRequest(c);
    if (!member || (!allowsPrepare(member) && !allowsAnyTranslate(member))) {
      throw new PermissionError("forbidden", "Editor, translator, or admin required.", 403);
    }
    const kind = c.req.param("kind");
    const slug = c.req.param("slug");
    if (!isContentKind(kind)) return jsonError("invalid_kind", "Invalid kind.", 400);
    const row = await getDraft(c.env.DB, kind, slug);
    if (!row) return jsonError("not_found", "Draft not found.", 404);
    const translations = await getDraftTranslations(c.env.DB, row.id);
    const body = parseDraftBody(row.english_body_json);
    const scopedTranslations = allowsPrepare(member)
      ? translations
      : translations.filter((tr) => member.languages.includes(tr.locale as "de" | "fr" | "ru" | "es"));
    return c.json({
      draft: {
        id: row.id,
        kind: row.kind,
        slug: row.slug,
        categoryId: row.category_id,
        position: row.position,
        title: row.english_title,
        summary: row.english_summary,
        body: allowsPrepare(member) ? body : { ...body, /* English visible read-only */ },
        updatedAt: row.updated_at,
        canEditEnglish: allowsPrepare(member),
        canPublish: allowsPublish(member),
        translations: scopedTranslations.map((tr) => ({
          locale: tr.locale,
          title: tr.title,
          summary: tr.summary,
          body: (() => {
            try {
              return JSON.parse(tr.body_json);
            } catch {
              return {};
            }
          })(),
        })),
      },
    });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("load_failed", "Could not load draft.", 500);
  }
});

contentRoutes.get("/interface-strings", async (c) => {
  try {
    const member = await memberFromRequest(c);
    if (!member || !allowsAnyTranslate(member)) {
      throw new PermissionError("forbidden", "Language assignment or admin required.", 403);
    }
    const locale = c.req.query("locale");
    const keys = englishDictKeys();
    const english = ui("en");
    const { results } = await c.env.DB.prepare(
      locale && isTranslateLocale(locale)
        ? "SELECT key, locale, value FROM interface_strings WHERE locale = ?"
        : "SELECT key, locale, value FROM interface_strings",
    )
      .bind(...(locale && isTranslateLocale(locale) ? [locale] : []))
      .all<{ key: string; locale: string; value: string }>();

    return c.json({
      keys,
      english: Object.fromEntries(keys.map((key) => [key, english[key]])),
      overrides: results ?? [],
      languages: member.siteRank === "admin" ? ["de", "fr", "ru", "es"] : member.languages,
    });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("load_failed", "Could not load interface strings.", 500);
  }
});

contentRoutes.post("/interface-strings", async (c) => {
  try {
    const body = await parseJson<{ locale?: string; key?: string; value?: string }>(c);
    if (!body?.locale || !isTranslateLocale(body.locale) || !body.key) {
      return jsonError("invalid_body", "Send locale, key, and value.", 400);
    }
    const member = requireTranslate(await memberFromRequest(c), body.locale);
    const keys = new Set<string>(englishDictKeys());
    if (!keys.has(body.key)) {
      return jsonError("unknown_key", "Unknown interface string key.", 400);
    }
    const value = body.value?.trim() ?? "";
    if (!value) {
      await c.env.DB.prepare("DELETE FROM interface_strings WHERE key = ? AND locale = ?")
        .bind(body.key, body.locale)
        .run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO interface_strings (key, locale, value, updated_by, updated_at)
         VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(key, locale) DO UPDATE SET
           value = excluded.value,
           updated_by = excluded.updated_by,
           updated_at = excluded.updated_at`,
      )
        .bind(body.key, body.locale, value, member.id)
        .run();
    }
    return c.json({ ok: true });
  } catch (error) {
    return permissionResponse(error) ?? jsonError("save_failed", "Could not save interface string.", 400);
  }
});

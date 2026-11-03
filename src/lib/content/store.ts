import type { Locale } from "../i18n/locales";
import {
  buildPublishPayload,
  emptyContentDraft,
  isContentKind,
  slugifyContent,
  type ContentBuilderDraft,
  type ContentKind,
  type PublishedPayload,
} from "./content-builder";
import { blankTranslations, parseTranslations } from "../i18n/translations";
import { isEventCategoryId, isGuideCategoryId } from "./categories";

export type DraftRow = {
  id: string;
  kind: ContentKind;
  slug: string;
  category_id: string | null;
  position: number | null;
  english_title: string;
  english_summary: string;
  english_body_json: string;
  updated_by: string | null;
  updated_at: string;
};

export type PublishedRow = {
  kind: ContentKind;
  slug: string;
  category_id: string | null;
  position: number | null;
  payload_json: string;
  published_at: string;
  published_by: string | null;
};

export type DraftTranslationRow = {
  draft_id: string;
  locale: string;
  title: string;
  summary: string;
  body_json: string;
};

export function parseDraftBody(json: string): ContentBuilderDraft {
  try {
    const raw = JSON.parse(json) as Partial<ContentBuilderDraft>;
    const base = emptyContentDraft(isContentKind(raw.kind) ? raw.kind : "news");
    return {
      ...base,
      ...raw,
      title: parseTranslations(raw.title) ?? blankTranslations(),
      summary: parseTranslations(raw.summary) ?? blankTranslations(),
      intro: parseTranslations(raw.intro) ?? blankTranslations(),
      note: parseTranslations(raw.note) ?? blankTranslations(),
      blocks: Array.isArray(raw.blocks) ? (raw.blocks as ContentBuilderDraft["blocks"]) : base.blocks,
    };
  } catch {
    return emptyContentDraft();
  }
}

export function parsePublishedPayload(json: string): PublishedPayload | null {
  try {
    return JSON.parse(json) as PublishedPayload;
  } catch {
    return null;
  }
}

export async function listDrafts(db: D1Database, kind?: ContentKind) {
  if (kind) {
    const { results } = await db
      .prepare("SELECT * FROM content_drafts WHERE kind = ? ORDER BY updated_at DESC")
      .bind(kind)
      .all<DraftRow>();
    return results ?? [];
  }
  const { results } = await db
    .prepare("SELECT * FROM content_drafts ORDER BY updated_at DESC")
    .all<DraftRow>();
  return results ?? [];
}

export async function getDraft(db: D1Database, kind: ContentKind, slug: string) {
  return db
    .prepare("SELECT * FROM content_drafts WHERE kind = ? AND slug = ?")
    .bind(kind, slug)
    .first<DraftRow>();
}

export async function getDraftTranslations(db: D1Database, draftId: string) {
  const { results } = await db
    .prepare("SELECT * FROM content_draft_translations WHERE draft_id = ?")
    .bind(draftId)
    .all<DraftTranslationRow>();
  return results ?? [];
}

export async function upsertEnglishDraft(
  db: D1Database,
  input: {
    memberId: string;
    draft: ContentBuilderDraft;
  },
) {
  const draft = input.draft;
  if (!draft.title.en.trim()) throw new Error("English title is required.");
  const slug = slugifyContent(draft.slug || draft.title.en);
  if (!slug) throw new Error("Could not derive a slug from the English title.");

  if (draft.kind === "guide" && (!draft.categoryId || !isGuideCategoryId(draft.categoryId))) {
    throw new Error("Guide requires a valid category.");
  }
  if (draft.kind === "event" && (!draft.categoryId || !isEventCategoryId(draft.categoryId))) {
    throw new Error("Event requires a valid category.");
  }

  const existing = await getDraft(db, draft.kind, slug);
  const id = existing?.id ?? crypto.randomUUID();
  const categoryId = draft.kind === "news" ? null : draft.categoryId;
  const position = draft.kind === "news" ? null : Math.max(1, Math.floor(draft.position ?? 1));
  const body = JSON.stringify({ ...draft, slug });

  await db
    .prepare(
      `INSERT INTO content_drafts
        (id, kind, slug, category_id, position, english_title, english_summary, english_body_json, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(kind, slug) DO UPDATE SET
         category_id = excluded.category_id,
         position = excluded.position,
         english_title = excluded.english_title,
         english_summary = excluded.english_summary,
         english_body_json = excluded.english_body_json,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      draft.kind,
      slug,
      categoryId,
      position,
      draft.title.en.trim(),
      draft.summary.en.trim(),
      body,
      input.memberId,
    )
    .run();

  return getDraft(db, draft.kind, slug);
}

export async function upsertDraftTranslation(
  db: D1Database,
  input: {
    memberId: string;
    kind: ContentKind;
    slug: string;
    locale: Locale;
    title: string;
    summary: string;
    bodyJson: string;
  },
) {
  if (input.locale === "en") throw new Error("Cannot write English via translate.");
  const draft = await getDraft(db, input.kind, input.slug);
  if (!draft) throw new Error("Draft not found.");

  await db
    .prepare(
      `INSERT INTO content_draft_translations
        (draft_id, locale, title, summary, body_json, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(draft_id, locale) DO UPDATE SET
         title = excluded.title,
         summary = excluded.summary,
         body_json = excluded.body_json,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`,
    )
    .bind(draft.id, input.locale, input.title, input.summary, input.bodyJson, input.memberId)
    .run();

  return draft;
}

export async function publishDraft(
  db: D1Database,
  input: { memberId: string; kind: ContentKind; slug: string },
) {
  const draft = await getDraft(db, input.kind, input.slug);
  if (!draft) throw new Error("Draft not found.");
  const builderDraft = parseDraftBody(draft.english_body_json);
  const translations = await getDraftTranslations(db, draft.id);

  for (const tr of translations) {
    const locale = tr.locale as Locale;
    if (locale === "en") continue;
    try {
      const patch = JSON.parse(tr.body_json) as Partial<ContentBuilderDraft>;
      if (typeof tr.title === "string" && tr.title.trim()) builderDraft.title[locale] = tr.title;
      if (typeof tr.summary === "string" && tr.summary.trim()) builderDraft.summary[locale] = tr.summary;
      if (patch.intro && typeof patch.intro === "object") {
        const intro = (patch.intro as Record<string, string>)[locale];
        if (intro) builderDraft.intro[locale] = intro;
      }
      if (patch.note && typeof patch.note === "object") {
        const note = (patch.note as Record<string, string>)[locale];
        if (note) builderDraft.note[locale] = note;
      }
      if (Array.isArray(patch.blocks) && patch.blocks.length === builderDraft.blocks.length) {
        patch.blocks.forEach((block, index) => {
          const target = builderDraft.blocks[index];
          if (!target || !block) return;
          if (block.text && typeof block.text === "object") {
            const text = (block.text as Record<string, string>)[locale];
            if (typeof text === "string") target.text[locale] = text;
          }
          if (block.alt && typeof block.alt === "object") {
            const alt = (block.alt as Record<string, string>)[locale];
            if (typeof alt === "string") target.alt[locale] = alt;
          }
        });
      }
    } catch {
      /* keep English body for this locale */
    }
  }

  builderDraft.slug = draft.slug;
  builderDraft.kind = draft.kind;
  if (draft.category_id) builderDraft.categoryId = draft.category_id;
  if (draft.position != null) builderDraft.position = draft.position;

  const payload = buildPublishPayload(builderDraft);
  const categoryId = draft.kind === "news" ? null : draft.category_id;
  let position = draft.position;

  if (categoryId && position != null) {
    await db
      .prepare(
        `UPDATE published_pieces
         SET position = position + 1
         WHERE kind = ? AND category_id = ? AND position >= ? AND NOT (slug = ?)`,
      )
      .bind(draft.kind, categoryId, position, draft.slug)
      .run();
  }

  await db
    .prepare(
      `INSERT INTO published_pieces
        (kind, slug, category_id, position, payload_json, published_at, published_by)
       VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?)
       ON CONFLICT(kind, slug) DO UPDATE SET
         category_id = excluded.category_id,
         position = excluded.position,
         payload_json = excluded.payload_json,
         published_at = excluded.published_at,
         published_by = excluded.published_by`,
    )
    .bind(draft.kind, draft.slug, categoryId, position, JSON.stringify(payload), input.memberId)
    .run();

  return { kind: draft.kind, slug: draft.slug, payload };
}

export async function unpublishPiece(db: D1Database, kind: ContentKind, slug: string) {
  await db.prepare("DELETE FROM published_pieces WHERE kind = ? AND slug = ?").bind(kind, slug).run();
}

export async function listPublished(db: D1Database, kind: ContentKind) {
  const { results } = await db
    .prepare(
      kind === "news"
        ? `SELECT * FROM published_pieces WHERE kind = ? ORDER BY published_at DESC`
        : `SELECT * FROM published_pieces WHERE kind = ? ORDER BY category_id ASC, position ASC, published_at DESC`,
    )
    .bind(kind)
    .all<PublishedRow>();
  return results ?? [];
}

export async function getPublished(db: D1Database, kind: ContentKind, slug: string) {
  return db
    .prepare("SELECT * FROM published_pieces WHERE kind = ? AND slug = ?")
    .bind(kind, slug)
    .first<PublishedRow>();
}

export function localizedFromPayload(payload: PublishedPayload, locale: Locale) {
  const own = payload.translations?.[locale];
  const en = payload.translations?.en;
  const pick = own ?? en ?? {};
  return {
    title: String((pick as { title?: string }).title ?? payload.builderDraft.title.en ?? ""),
    summary: String((pick as { summary?: string }).summary ?? payload.builderDraft.summary.en ?? ""),
    intro: String((pick as { intro?: string }).intro ?? ""),
    note: String((pick as { note?: string }).note ?? ""),
    body: ((pick as { body?: string[] }).body ?? []) as string[],
    sections: ((pick as { sections?: { heading: string; body: string[] }[] }).sections ?? []) as {
      heading: string;
      body: string[];
    }[],
    contentCanvas: (pick as { contentCanvas?: unknown }).contentCanvas,
    image: payload.image,
    icon: payload.icon,
    date: payload.date,
  };
}

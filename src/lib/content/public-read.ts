import { getWorkerEnv } from "../env";
import type { Locale } from "../i18n/locales";
import {
  getPublished,
  listPublished,
  localizedFromPayload,
  parsePublishedPayload,
  type PublishedRow,
} from "./store";
import type { ContentKind } from "./content-builder";
import type { ContentCanvas } from "./content-canvas";
import { isContentCanvas } from "./content-canvas";

export type PublicPiece = {
  kind: ContentKind;
  slug: string;
  categoryId: string | null;
  position: number | null;
  publishedAt: string;
  title: string;
  summary: string;
  intro: string;
  note: string;
  body: string[];
  sections: { heading: string; body: string[] }[];
  contentCanvas?: ContentCanvas;
  image?: string;
  icon?: string;
  date?: string;
};

function toPublic(row: PublishedRow, locale: Locale): PublicPiece | null {
  const payload = parsePublishedPayload(row.payload_json);
  if (!payload) return null;
  const loc = localizedFromPayload(payload, locale);
  const canvas = loc.contentCanvas;
  return {
    kind: row.kind,
    slug: row.slug,
    categoryId: row.category_id,
    position: row.position,
    publishedAt: row.published_at,
    title: loc.title,
    summary: loc.summary,
    intro: loc.intro,
    note: loc.note,
    body: loc.body,
    sections: loc.sections,
    contentCanvas: isContentCanvas(canvas) ? canvas : undefined,
    image: loc.image,
    icon: loc.icon,
    date: loc.date,
  };
}

export async function loadPublishedList(kind: ContentKind, locale: Locale): Promise<PublicPiece[]> {
  const env = await getWorkerEnv();
  if (!env?.DB) return [];
  const rows = await listPublished(env.DB, kind);
  return rows.map((row) => toPublic(row, locale)).filter((piece): piece is PublicPiece => Boolean(piece));
}

export async function loadPublishedPiece(
  kind: ContentKind,
  slug: string,
  locale: Locale,
): Promise<PublicPiece | null> {
  const env = await getWorkerEnv();
  if (!env?.DB) return null;
  const row = await getPublished(env.DB, kind, slug);
  if (!row) return null;
  return toPublic(row, locale);
}

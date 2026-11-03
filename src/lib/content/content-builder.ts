import { LOCALES, type Locale } from "../i18n/locales";
import { blankTranslations, textIn, type Translations } from "../i18n/translations";
import {
  contentCanvasFromBlocks,
  defaultContentPosition,
  nextContentPosition,
  type ContentCanvas,
  type ContentCanvasBlock,
  type ContentCanvasPosition,
} from "./content-canvas";
import { HEROES } from "./heroes";
import { GODDESSES } from "./goddesses";

export type ContentKind = "news" | "guide" | "event";
export type ContentBlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "coreLink"
  | "hero"
  | "goddess"
  | "heroIcon"
  | "goddessIcon"
  | "arrow"
  | "callout"
  | "code"
  | "divider"
  | "credits";
export type ContentHeadingLevel = 1 | 2 | 3;
export type ContentArrowDirection = "right" | "down" | "left";

export type ContentBlock = {
  type: ContentBlockType;
  text: Translations;
  src: string;
  alt: Translations;
  href: string;
  entityId: string;
  direction: ContentArrowDirection;
  position: ContentCanvasPosition;
  headingLevel?: ContentHeadingLevel;
  language?: string;
};

export type ContentBuilderDraft = {
  kind: ContentKind;
  slug: string;
  date: string;
  categoryId: string;
  position?: number;
  image: string;
  icon?: string;
  title: Translations;
  summary: Translations;
  intro: Translations;
  note: Translations;
  blocks: ContentBlock[];
};

export function emptyContentBlock(
  type: ContentBlockType = "paragraph",
  position = defaultContentPosition(type),
): ContentBlock {
  return {
    type,
    text: blankTranslations(),
    src: "",
    alt: blankTranslations(),
    href: "",
    entityId: "",
    direction: "right",
    position,
    headingLevel: 1,
    language: "",
  };
}

export function nextContentBlockPosition(
  blocks: readonly ContentBlock[],
  type: ContentBlockType,
): ContentCanvasPosition {
  return nextContentPosition(
    blocks.map((block) => block.position),
    type,
  );
}

export function slugifyContent(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function emptyContentDraft(kind: ContentKind = "news"): ContentBuilderDraft {
  return {
    kind,
    slug: "",
    date: new Date().toISOString().slice(0, 10),
    categoryId: kind === "event" ? "main-event" : "core-elements",
    position: 1,
    image: "",
    icon: "",
    title: blankTranslations(),
    summary: blankTranslations(),
    intro: blankTranslations(),
    note: blankTranslations(),
    blocks: [emptyContentBlock("paragraph")],
  };
}

export function safeContentUrl(value: string): boolean {
  const path = value.split(/[?#]/, 1)[0] ?? value;
  const safeSitePath = value.startsWith("/") && !value.startsWith("//") && !path.split("/").includes("..");
  return safeSitePath || /^https:\/\//i.test(value);
}

function bodyEntries(draft: ContentBuilderDraft, locale: Locale): ContentCanvasBlock[] {
  const entries: ContentCanvasBlock[] = [];
  const add = (block: ContentBlock, content: string) => {
    entries.push({ content, ...block.position });
  };
  for (const block of draft.blocks) {
    const text = textIn(block.text, locale).trim();
    if (block.type === "paragraph" && text) add(block, text);
    if (block.type === "heading" && text) add(block, "#".repeat((block.headingLevel ?? 1) + 1) + " " + text);
    if (block.type === "callout" && text) add(block, "> " + text);
    if (block.type === "divider") add(block, "---");
    if (block.type === "code" && text) add(block, "```" + (block.language || "") + "\n" + text + "\n```");
    if (block.type === "credits" && text) {
      const title = (
        { en: "Credits", de: "Mitwirkende", fr: "Crédits", ru: "Участники", es: "Créditos" } as const
      )[locale];
      add(block, "## " + title + "\n\n" + text);
    }
    if (block.type === "hero" && HEROES.some((hero) => hero.id === block.entityId)) {
      add(block, "[[hero:" + block.entityId + "]]");
    }
    if (block.type === "goddess" && GODDESSES.some((goddess) => goddess.id === block.entityId)) {
      add(block, "[[goddess:" + block.entityId + "]]");
    }
    if (block.type === "heroIcon" && HEROES.some((hero) => hero.id === block.entityId)) {
      add(block, "[[hero-icon:" + block.entityId + "]]");
    }
    if (block.type === "goddessIcon" && GODDESSES.some((goddess) => goddess.id === block.entityId)) {
      add(block, "[[goddess-icon:" + block.entityId + "]]");
    }
    if (block.type === "arrow" && ["right", "down", "left"].includes(block.direction)) {
      add(block, "[[arrow:" + block.direction + "]]");
    }
    if (block.type === "image" && safeContentUrl(block.src)) {
      const alt = textIn(block.alt, locale).trim();
      const image = "![" + alt + "](" + block.src + ")";
      add(block, safeContentUrl(block.href) ? "[" + image + "](" + block.href + ")" : image);
    }
    if (block.type === "coreLink" && text && safeContentUrl(block.href)) {
      add(block, "[" + text + "](" + block.href + ")");
    }
  }
  return entries;
}

function paragraphArray(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let inCode = false;
  const flush = () => {
    const value = current.join("\n").trim();
    if (value) paragraphs.push(value);
    current = [];
  };
  for (const line of lines.join("\n\n").split("\n")) {
    if (line.trim().startsWith("```")) {
      current.push(line);
      inCode = !inCode;
    } else if (!line.trim() && !inCode) flush();
    else current.push(line);
  }
  flush();
  return paragraphs;
}

export function contentLocaleEntry(draft: ContentBuilderDraft, locale: Locale): Record<string, unknown> {
  const canvasBlocks = bodyEntries(draft, locale);
  const lines = canvasBlocks.map((block) => block.content);
  const contentCanvas: ContentCanvas | undefined = contentCanvasFromBlocks(canvasBlocks);
  if (draft.kind === "news") {
    return {
      title: textIn(draft.title, locale),
      summary: textIn(draft.summary, locale),
      body: paragraphArray(lines),
      ...(contentCanvas ? { contentCanvas } : {}),
    };
  }
  const sections: { heading: string; body: string[] }[] = [];
  let heading = "";
  let body: string[] = [];
  const flush = () => {
    if (heading || body.length) sections.push({ heading, body: paragraphArray(body) });
    heading = "";
    body = [];
  };
  for (const content of lines) {
    for (const line of paragraphArray([content])) {
      if (/^## (?!#)/.test(line)) {
        flush();
        heading = line.slice(3);
      } else body.push(line);
    }
  }
  flush();
  return {
    title: textIn(draft.title, locale),
    summary: textIn(draft.summary, locale),
    intro: textIn(draft.intro, locale),
    sections,
    note: textIn(draft.note, locale),
    ...(contentCanvas ? { contentCanvas } : {}),
  };
}

export type PublishedPayload = {
  builderDraft: ContentBuilderDraft;
  translations: Partial<Record<Locale, Record<string, unknown>>>;
  image?: string;
  icon?: string;
  date?: string;
};

export function buildPublishPayload(draft: ContentBuilderDraft): PublishedPayload {
  const slug = slugifyContent(draft.slug || draft.title.en) || "new-content";
  const complete = { ...draft, slug };
  const translations = Object.fromEntries(
    LOCALES.map((locale) => [locale, contentLocaleEntry(complete, locale)]),
  ) as PublishedPayload["translations"];
  return {
    builderDraft: complete,
    translations,
    image: complete.image && safeContentUrl(complete.image) ? complete.image : undefined,
    icon: complete.icon && safeContentUrl(complete.icon) ? complete.icon : undefined,
    date: complete.date,
  };
}

export function isContentKind(value: unknown): value is ContentKind {
  return value === "news" || value === "guide" || value === "event";
}

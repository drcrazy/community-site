import type { Locale } from "../i18n/locales";

export type LocalizedField = {
  en: string;
  de?: string;
  fr?: string;
  ru?: string;
  es?: string;
};

export function pickLocalized(field: LocalizedField, locale: Locale) {
  return field[locale] || field.en;
}

export const GUIDE_CATEGORY_LABELS: Record<string, string> = {
  "core-elements": "Core elements",
  layouts: "Layouts",
  buildings: "Buildings",
  "tier-lists": "Tier lists",
  "tips-and-tricks": "Tips and tricks",
  goddess: "Goddess",
  events: "Events",
  "grand-voyage": "Grand Voyage",
};

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  "main-event": "Main event",
  "routine-event": "Routine Event",
  "ranking-challenge": "Ranking Challenge",
};

export const EVENT_CATEGORY_ORDER = ["main-event", "routine-event", "ranking-challenge"] as const;

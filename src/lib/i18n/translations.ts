import { LOCALES, DEFAULT_LOCALE, type Locale } from "./locales";

export type Translations = Record<Locale, string>;

export function mapLocales<T>(fn: (locale: Locale) => T): Record<Locale, T> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, fn(locale)])) as Record<Locale, T>;
}

export function blankTranslations(): Translations {
  return mapLocales(() => "");
}

export function textIn(translations: Partial<Record<Locale, string>> | undefined, locale: Locale): string {
  const own = translations?.[locale]?.trim();
  return own || translations?.[DEFAULT_LOCALE]?.trim() || "";
}

export function parseTranslations(value: unknown): Translations | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record[DEFAULT_LOCALE] !== "string") return null;
  return mapLocales((locale) => (typeof record[locale] === "string" ? (record[locale] as string) : ""));
}

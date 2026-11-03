export const LOCALES = ["en", "de", "fr", "ru", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  ru: "Русский",
  es: "Español",
};

export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  ru: "ru-RU",
  es: "es-ES",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Prefer browser languages that match a site locale; fall back to English. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const parts = acceptLanguage.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const q = params.find((p) => p.trim().startsWith("q="));
    return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const { tag } of parts) {
    const exact = LOCALES.find((locale) => locale === tag || LOCALE_TAGS[locale].toLowerCase() === tag);
    if (exact) return exact;
    const base = tag.split("-")[0];
    const byBase = LOCALES.find((locale) => locale === base);
    if (byBase) return byBase;
  }
  return DEFAULT_LOCALE;
}

export function localizedPath(locale: Locale, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean === "/") return `/${locale}/`;
  return `/${locale}${clean.endsWith("/") ? clean : `${clean}/`}`;
}

export function swapLocaleInPath(pathname: string, next: Locale) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) {
    segments[0] = next;
  } else {
    segments.unshift(next);
  }
  return `/${segments.join("/")}/`.replace(/\/{2,}/g, "/");
}

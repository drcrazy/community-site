import type { ContentKind } from "./content-builder";
import { localizedPath, type Locale } from "../i18n/locales";

export function contentBuilderNewHref(locale: Locale, kind: ContentKind) {
  return `${localizedPath(locale, "/content-builder/")}?kind=${encodeURIComponent(kind)}`;
}

export function contentBuilderEditHref(locale: Locale, kind: ContentKind, slug: string) {
  return `${localizedPath(locale, "/content-builder/")}?edit=1&kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(slug)}`;
}

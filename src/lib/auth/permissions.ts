import type { Locale } from "../i18n/locales";

export type AuthMember = PublicMember;

const TRANSLATE_LOCALES = ["de", "fr", "ru", "es"] as const;
export type TranslateLocale = (typeof TRANSLATE_LOCALES)[number];

export function isTranslateLocale(value: string): value is TranslateLocale {
  return (TRANSLATE_LOCALES as readonly string[]).includes(value);
}

export function allowsAdmin(member: AuthMember | null | undefined) {
  return member?.siteRank === "admin";
}

export function allowsPrepare(member: AuthMember | null | undefined) {
  return member?.siteRank === "editor" || member?.siteRank === "admin";
}

export function allowsPublish(member: AuthMember | null | undefined) {
  if (!member) return false;
  if (member.siteRank === "admin") return true;
  return member.siteRank === "editor" && member.publishPermission;
}

export function allowsTranslate(member: AuthMember | null | undefined, locale: string) {
  if (!member || !isTranslateLocale(locale)) return false;
  if (member.siteRank === "admin") return true;
  return member.languages.includes(locale);
}

export function allowsAnyTranslate(member: AuthMember | null | undefined) {
  if (!member) return false;
  if (member.siteRank === "admin") return true;
  return member.languages.length > 0;
}

export function allowsInterfaceStrings(member: AuthMember | null | undefined) {
  return allowsAnyTranslate(member);
}

export function requireMember(member: AuthMember | null | undefined): AuthMember {
  if (!member) throw new PermissionError("sign_in_required", "Sign in required.", 401);
  return member;
}

export function requirePrepare(member: AuthMember | null | undefined) {
  const m = requireMember(member);
  if (!allowsPrepare(m)) throw new PermissionError("forbidden", "Editor or admin required.", 403);
  return m;
}

export function requirePublish(member: AuthMember | null | undefined) {
  const m = requireMember(member);
  if (!allowsPublish(m)) throw new PermissionError("forbidden", "Publish permission required.", 403);
  return m;
}

export function requireAdmin(member: AuthMember | null | undefined) {
  const m = requireMember(member);
  if (!allowsAdmin(m)) throw new PermissionError("forbidden", "Admin required.", 403);
  return m;
}

export function requireTranslate(member: AuthMember | null | undefined, locale: string) {
  const m = requireMember(member);
  if (!allowsTranslate(m, locale)) {
    throw new PermissionError("forbidden", "Language assignment required.", 403);
  }
  return m;
}

export class PermissionError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function permissionResponse(error: unknown) {
  if (error instanceof PermissionError) {
    return Response.json({ code: error.code, message: error.message }, { status: error.status });
  }
  return null;
}

export type LocaleAccess = Locale;

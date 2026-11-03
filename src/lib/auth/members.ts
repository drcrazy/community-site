import type { TranslateLocale } from "./permissions";
import { isTranslateLocale } from "./permissions";

export function toPublicMember(row: MemberRow, languages: TranslateLocale[] = []): PublicMember {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    siteRank: row.site_rank,
    publishPermission: row.publish_permission === 1 || row.site_rank === "admin",
    discordLinked: Boolean(row.discord_id),
    languages,
  };
}

export async function loadMemberLanguages(db: D1Database, memberId: string): Promise<TranslateLocale[]> {
  const { results } = await db
    .prepare("SELECT locale FROM member_languages WHERE member_id = ?")
    .bind(memberId)
    .all<{ locale: string }>();
  return (results ?? [])
    .map((row) => row.locale)
    .filter((locale): locale is TranslateLocale => isTranslateLocale(locale));
}

export async function toPublicMemberWithLanguages(db: D1Database, row: MemberRow) {
  const languages = await loadMemberLanguages(db, row.id);
  return toPublicMember(row, languages);
}

export async function findMemberById(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM members WHERE id = ?").bind(id).first<MemberRow>();
}

export async function findMemberByUsername(db: D1Database, username: string) {
  return db
    .prepare("SELECT * FROM members WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first<MemberRow>();
}

export async function findMemberByDiscordId(db: D1Database, discordId: string) {
  return db.prepare("SELECT * FROM members WHERE discord_id = ?").bind(discordId).first<MemberRow>();
}

export async function createPasswordMember(
  db: D1Database,
  input: { id: string; username: string; passwordHash: string; siteRank?: SiteRank },
) {
  const rank = input.siteRank ?? "normal";
  await db
    .prepare(
      `INSERT INTO members (id, username, password_hash, site_rank, publish_permission)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(input.id, input.username, input.passwordHash, rank, rank === "admin" ? 1 : 0)
    .run();
  return findMemberById(db, input.id);
}

export async function countAdmins(db: D1Database) {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM members WHERE site_rank = 'admin'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** Promote first registered user when username matches BOOTSTRAP_ADMIN_USERNAME and no admin exists. */
export async function maybeBootstrapAdmin(db: D1Database, env: Env, username: string) {
  const bootstrap = env.BOOTSTRAP_ADMIN_USERNAME?.trim();
  if (!bootstrap || bootstrap.toLowerCase() !== username.toLowerCase()) return false;
  if ((await countAdmins(db)) > 0) return false;
  return true;
}

export async function listMembersForAdmin(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT id, username, password_hash, discord_id, display_name, site_rank, publish_permission, created_at
       FROM members ORDER BY username COLLATE NOCASE`,
    )
    .all<MemberRow>();
  const members = results ?? [];
  const out: PublicMember[] = [];
  for (const row of members) {
    out.push(await toPublicMemberWithLanguages(db, row));
  }
  return out;
}

export async function setMemberLanguages(db: D1Database, memberId: string, locales: TranslateLocale[]) {
  await db.prepare("DELETE FROM member_languages WHERE member_id = ?").bind(memberId).run();
  for (const locale of locales) {
    await db
      .prepare("INSERT INTO member_languages (member_id, locale) VALUES (?, ?)")
      .bind(memberId, locale)
      .run();
  }
}

export function discordEnabled(env: Env) {
  return Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET && env.DISCORD_REDIRECT_URI);
}

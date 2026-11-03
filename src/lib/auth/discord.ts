import { discordEnabled, findMemberByDiscordId, findMemberById, toPublicMemberWithLanguages } from "./members";
import { newSessionExpiry, sealSession, sessionCookieValue } from "./session";

const OAUTH_STATE_COOKIE = "loa_discord_oauth";

export type DiscordSyncResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
};

function roleIdForRank(env: Env, rank: SiteRank): string | null {
  if (rank === "admin") return env.DISCORD_ROLE_ADMIN ?? null;
  if (rank === "editor") return env.DISCORD_ROLE_EDITOR ?? null;
  return null;
}

export async function syncDiscordRoles(env: Env, member: PublicMember): Promise<DiscordSyncResult> {
  if (!member.discordLinked) {
    return { ok: true, skipped: true, reason: "not_linked" };
  }
  if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
    return { ok: true, skipped: true, reason: "discord_disabled" };
  }
  const row = await findMemberById(env.DB, member.id);
  if (!row?.discord_id) return { ok: true, skipped: true, reason: "not_linked" };

  const editorRole = env.DISCORD_ROLE_EDITOR;
  const adminRole = env.DISCORD_ROLE_ADMIN;
  const desired = roleIdForRank(env, member.siteRank);
  const headers = {
    authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    "content-type": "application/json",
  };

  for (const roleId of [editorRole, adminRole]) {
    if (!roleId) continue;
    const url = `https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${row.discord_id}/roles/${roleId}`;
    if (desired === roleId) {
      const res = await fetch(url, { method: "PUT", headers });
      if (!res.ok && res.status !== 204) {
        return { ok: false, reason: `put_role_${res.status}` };
      }
    } else {
      const res = await fetch(url, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204 && res.status !== 404) {
        return { ok: false, reason: `delete_role_${res.status}` };
      }
    }
  }
  return { ok: true };
}

export function discordStartUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    redirect_uri: env.DISCORD_REDIRECT_URI!,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

export function oauthStateCookie(state: string, clear = false) {
  if (clear) {
    return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`;
}

export function readOAuthState(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)loa_discord_oauth=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function exchangeDiscordCode(env: Env, code: string) {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID!,
    client_secret: env.DISCORD_CLIENT_SECRET!,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI!,
  });
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error("token_exchange_failed");
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("token_missing");
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  if (!userRes.ok) throw new Error("user_fetch_failed");
  return (await userRes.json()) as { id: string; username: string; global_name?: string | null };
}

export async function upsertDiscordMember(
  db: D1Database,
  discord: { id: string; username: string; global_name?: string | null },
  linkToMemberId?: string | null,
) {
  if (linkToMemberId) {
    const existing = await findMemberById(db, linkToMemberId);
    if (!existing) throw new Error("member_not_found");
    const taken = await findMemberByDiscordId(db, discord.id);
    if (taken && taken.id !== linkToMemberId) throw new Error("discord_taken");
    await db
      .prepare("UPDATE members SET discord_id = ?, display_name = COALESCE(display_name, ?) WHERE id = ?")
      .bind(discord.id, discord.global_name || discord.username, linkToMemberId)
      .run();
    return findMemberById(db, linkToMemberId);
  }

  const existing = await findMemberByDiscordId(db, discord.id);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const usernameBase =
    (discord.username || "discord").replace(/[^A-Za-z0-9_]/g, "_").slice(0, 20) || "discord";
  let username = usernameBase;
  let n = 0;
  while (await db.prepare("SELECT id FROM members WHERE username = ? COLLATE NOCASE").bind(username).first()) {
    n += 1;
    username = `${usernameBase.slice(0, 20)}_${n}`.slice(0, 24);
  }
  await db
    .prepare(
      `INSERT INTO members (id, username, password_hash, discord_id, display_name, site_rank, publish_permission)
       VALUES (?, ?, NULL, ?, ?, 'normal', 0)`,
    )
    .bind(id, username, discord.id, discord.global_name || discord.username)
    .run();
  return findMemberById(db, id);
}

export async function sealMemberSession(env: Env, memberId: string) {
  if (!env.SESSION_SECRET) throw new Error("misconfigured");
  return sealSession({ memberId, exp: newSessionExpiry() }, env.SESSION_SECRET);
}

export function redirectWithSession(token: string, location: string) {
  const headers = new Headers({ location });
  headers.append("set-cookie", sessionCookieValue(token));
  headers.append("set-cookie", oauthStateCookie("", true));
  return new Response(null, { status: 303, headers });
}

export function redirectClearingOAuth(location: string) {
  return new Response(null, {
    status: 303,
    headers: {
      location,
      "set-cookie": oauthStateCookie("", true),
    },
  });
}

export { discordEnabled, toPublicMemberWithLanguages };

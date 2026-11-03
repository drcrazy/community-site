import { Hono } from "hono";
import {
  createPasswordMember,
  discordEnabled,
  findMemberById,
  findMemberByUsername,
  maybeBootstrapAdmin,
  toPublicMemberWithLanguages,
} from "../../lib/auth/members";
import { hashPassword, isValidUsername, verifyPassword } from "../../lib/auth/password";
import {
  clearSessionCookie,
  newSessionExpiry,
  openSession,
  readSessionCookie,
  sealSession,
  sessionCookieValue,
} from "../../lib/auth/session";
import {
  discordStartUrl,
  exchangeDiscordCode,
  oauthStateCookie,
  readOAuthState,
  redirectClearingOAuth,
  redirectWithSession,
  sealMemberSession,
  syncDiscordRoles,
  upsertDiscordMember,
} from "../../lib/auth/discord";

type AppEnv = { Bindings: Env };

function jsonError(code: string, message: string, status: number) {
  return Response.json({ code, message }, { status });
}

async function memberFromRequest(c: {
  req: { header: (name: string) => string | undefined };
  env: Env;
}) {
  const secret = c.env.SESSION_SECRET;
  if (!secret) return null;
  const token = readSessionCookie(c.req.header("cookie") ?? null);
  if (!token) return null;
  const session = await openSession(token, secret);
  if (!session) return null;
  const row = await findMemberById(c.env.DB, session.memberId);
  return row ? toPublicMemberWithLanguages(c.env.DB, row) : null;
}

export const authRoutes = new Hono<AppEnv>({ strict: false });

authRoutes.get("/me", async (c) => {
  const member = await memberFromRequest(c);
  return c.json({
    member,
    discordEnabled: discordEnabled(c.env),
  });
});

authRoutes.post("/register", async (c) => {
  if (!c.env.SESSION_SECRET) return jsonError("misconfigured", "Sign-in is not configured.", 503);
  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError("invalid_body", "Send a JSON body with username and password.", 400);
  }
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!isValidUsername(username)) {
    return jsonError("invalid_username", "Username must be 3–24 letters, numbers, or underscores.", 400);
  }
  if (password.length < 8 || password.length > 200) {
    return jsonError("invalid_password", "Password must be between 8 and 200 characters.", 400);
  }
  const existing = await findMemberByUsername(c.env.DB, username);
  if (existing) return jsonError("username_taken", "That username is already taken.", 409);

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const bootstrap = await maybeBootstrapAdmin(c.env.DB, c.env, username);
  const row = await createPasswordMember(c.env.DB, {
    id,
    username,
    passwordHash,
    siteRank: bootstrap ? "admin" : "normal",
  });
  if (!row) return jsonError("create_failed", "Could not create the account.", 500);

  const member = await toPublicMemberWithLanguages(c.env.DB, row);
  const token = await sealSession({ memberId: row.id, exp: newSessionExpiry() }, c.env.SESSION_SECRET);
  return new Response(JSON.stringify({ member, bootstrappedAdmin: bootstrap }), {
    status: 201,
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookieValue(token),
    },
  });
});

authRoutes.post("/sign-in", async (c) => {
  if (!c.env.SESSION_SECRET) return jsonError("misconfigured", "Sign-in is not configured.", 503);
  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError("invalid_body", "Send a JSON body with username and password.", 400);
  }
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  const row = await findMemberByUsername(c.env.DB, username);
  if (!row?.password_hash || !(await verifyPassword(password, row.password_hash))) {
    return jsonError("invalid_credentials", "Username or password is wrong.", 401);
  }
  const member = await toPublicMemberWithLanguages(c.env.DB, row);
  const token = await sealSession({ memberId: row.id, exp: newSessionExpiry() }, c.env.SESSION_SECRET);
  return new Response(JSON.stringify({ member }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookieValue(token),
    },
  });
});

authRoutes.post("/sign-out", async (c) => {
  const referer = c.req.header("referer");
  const location = referer && referer.startsWith(new URL(c.req.url).origin) ? referer : "/en/";
  return new Response(null, {
    status: 303,
    headers: {
      location,
      "set-cookie": clearSessionCookie(),
    },
  });
});

authRoutes.get("/discord/start", async (c) => {
  if (!discordEnabled(c.env)) {
    return jsonError("discord_disabled", "Discord sign-in is not available yet.", 503);
  }
  const state = crypto.randomUUID();
  const link = c.req.query("link") === "1";
  const returnTo = c.req.query("returnTo") || "/en/";
  const payload = JSON.stringify({ state, link, returnTo });
  return new Response(null, {
    status: 302,
    headers: {
      location: discordStartUrl(c.env, state),
      "set-cookie": oauthStateCookie(payload),
    },
  });
});

authRoutes.get("/discord/callback", async (c) => {
  if (!discordEnabled(c.env)) {
    return jsonError("discord_disabled", "Discord sign-in is not available yet.", 503);
  }
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedRaw = readOAuthState(c.req.header("cookie") ?? null);
  let stored: { state?: string; link?: boolean; returnTo?: string } = {};
  try {
    stored = storedRaw ? (JSON.parse(storedRaw) as typeof stored) : {};
  } catch {
    stored = {};
  }
  if (!code || !state || !stored.state || stored.state !== state) {
    return redirectClearingOAuth("/en/sign-in/?error=discord_state");
  }

  try {
    const discordUser = await exchangeDiscordCode(c.env, code);
    let linkTo: string | null = null;
    if (stored.link) {
      const current = await memberFromRequest(c);
      if (!current) return redirectClearingOAuth("/en/sign-in/?error=link_requires_session");
      linkTo = current.id;
    }
    const row = await upsertDiscordMember(c.env.DB, discordUser, linkTo);
    if (!row) return redirectClearingOAuth("/en/sign-in/?error=discord_upsert");
    const member = await toPublicMemberWithLanguages(c.env.DB, row);
    await syncDiscordRoles(c.env, member);
    const token = await sealMemberSession(c.env, row.id);
    const returnTo =
      stored.returnTo && stored.returnTo.startsWith("/") ? stored.returnTo : "/en/";
    return redirectWithSession(token, returnTo);
  } catch {
    return redirectClearingOAuth("/en/sign-in/?error=discord_oauth");
  }
});

authRoutes.post("/discord/link", async (c) => {
  if (!discordEnabled(c.env)) {
    return jsonError("discord_disabled", "Discord sign-in is not available yet.", 503);
  }
  const member = await memberFromRequest(c);
  if (!member) return jsonError("sign_in_required", "Sign in required.", 401);
  const returnTo = "/en/";
  const state = crypto.randomUUID();
  const payload = JSON.stringify({ state, link: true, returnTo });
  return new Response(null, {
    status: 302,
    headers: {
      location: discordStartUrl(c.env, state),
      "set-cookie": oauthStateCookie(payload),
    },
  });
});

export { memberFromRequest };

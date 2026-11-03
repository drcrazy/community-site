import { defineMiddleware } from "astro:middleware";
import { discordEnabled, findMemberById, toPublicMemberWithLanguages } from "./lib/auth/members";
import { openSession, readSessionCookie } from "./lib/auth/session";
import { isLocale } from "./lib/i18n/locales";
import { loadUiOverrides } from "./lib/i18n/ui";

async function getWorkerEnv(): Promise<Env | null> {
  try {
    const mod = await import("cloudflare:workers");
    return (mod as { env: Env }).env;
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.member = null;
  context.locals.discordEnabled = false;
  context.locals.uiOverrides = null;

  const env = await getWorkerEnv();
  if (env?.DB && env.SESSION_SECRET) {
    context.locals.discordEnabled = discordEnabled(env);
    const token = readSessionCookie(context.request.headers.get("cookie"));
    if (token) {
      const session = await openSession(token, env.SESSION_SECRET);
      if (session) {
        const row = await findMemberById(env.DB, session.memberId);
        if (row) context.locals.member = await toPublicMemberWithLanguages(env.DB, row);
      }
    }
    const lang = context.params.lang;
    if (lang && isLocale(lang) && lang !== "en") {
      context.locals.uiOverrides = await loadUiOverrides(env.DB, lang);
    }
  }

  return next();
});

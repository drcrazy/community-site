const COOKIE = "loa_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = {
  memberId: string;
  exp: number;
};

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((value.length * 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function sealSession(payload: SessionPayload, secret: string) {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const signature = bytesToBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return `${body}.${signature}`;
}

export async function openSession(token: string, secret: string): Promise<SessionPayload | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    new TextEncoder().encode(body),
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as SessionPayload;
    if (!payload.memberId || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieFlags(maxAge: number) {
  // Omit Secure on localhost HTTP so the session sticks in `astro dev`.
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function sessionCookieValue(token: string) {
  return `${COOKIE}=${token}; ${cookieFlags(MAX_AGE_SECONDS)}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; ${cookieFlags(0)}`;
}

export function readSessionCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return null;
}

export function newSessionExpiry() {
  return Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
}

export { COOKIE as SESSION_COOKIE_NAME };

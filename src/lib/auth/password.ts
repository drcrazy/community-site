const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function toBase64(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltCopy = salt.slice();
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltCopy, iterations: ITERATIONS },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** Format: pbkdf2$iterations$salt$hash (base64 salt/hash). */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [scheme, iterationText, saltText, hashText] = encoded.split("$");
  if (scheme !== "pbkdf2" || !iterationText || !saltText || !hashText) return false;
  const iterations = Number(iterationText);
  if (!Number.isInteger(iterations) || iterations < 1) return false;
  const salt = fromBase64(saltText);
  const expected = fromBase64(hashText);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltCopy = salt.slice();
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltCopy, iterations },
    keyMaterial,
    expected.byteLength * 8,
  );
  const actual = new Uint8Array(bits);
  if (actual.byteLength !== expected.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < actual.byteLength; i += 1) diff |= actual[i]! ^ expected[i]!;
  return diff === 0;
}

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/;

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username);
}

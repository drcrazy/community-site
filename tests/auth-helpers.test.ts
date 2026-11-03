import { describe, expect, it } from "vitest";
import { hashPassword, isValidUsername, verifyPassword } from "../src/lib/auth/password";
import { newSessionExpiry, openSession, sealSession } from "../src/lib/auth/session";

describe("username", () => {
  it("accepts 3–24 letters numbers underscore", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("Player_01")).toBe(true);
    expect(isValidUsername("bad-name")).toBe(false);
  });
});

describe("password hash", () => {
  it("verifies a hashed password", async () => {
    const encoded = await hashPassword("secret-pass");
    expect(await verifyPassword("secret-pass", encoded)).toBe(true);
    expect(await verifyPassword("wrong-pass", encoded)).toBe(false);
  });
});

describe("session seal", () => {
  it("round-trips a sealed session", async () => {
    const secret = "test-secret-key";
    const token = await sealSession({ memberId: "m1", exp: newSessionExpiry() }, secret);
    const opened = await openSession(token, secret);
    expect(opened?.memberId).toBe("m1");
  });
});

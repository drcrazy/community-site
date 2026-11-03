import { describe, expect, it } from "vitest";
import {
  allowsAdmin,
  allowsPrepare,
  allowsPublish,
  allowsTranslate,
} from "../src/lib/auth/permissions";

const base = {
  id: "1",
  username: "u",
  displayName: null,
  discordLinked: false,
  languages: [] as Array<"de" | "fr" | "ru" | "es">,
};

describe("permissions", () => {
  it("allows prepare for editor and admin only", () => {
    expect(allowsPrepare({ ...base, siteRank: "normal", publishPermission: false })).toBe(false);
    expect(allowsPrepare({ ...base, siteRank: "editor", publishPermission: false })).toBe(true);
    expect(allowsPrepare({ ...base, siteRank: "admin", publishPermission: true })).toBe(true);
  });

  it("requires publish permission on editors; admin always", () => {
    expect(allowsPublish({ ...base, siteRank: "editor", publishPermission: false })).toBe(false);
    expect(allowsPublish({ ...base, siteRank: "editor", publishPermission: true })).toBe(true);
    expect(allowsPublish({ ...base, siteRank: "admin", publishPermission: false })).toBe(true);
    expect(allowsPublish({ ...base, siteRank: "normal", publishPermission: true })).toBe(false);
  });

  it("translate needs assignment unless admin", () => {
    expect(allowsTranslate({ ...base, siteRank: "normal", publishPermission: false, languages: ["de"] }, "de")).toBe(
      true,
    );
    expect(allowsTranslate({ ...base, siteRank: "normal", publishPermission: false, languages: ["de"] }, "fr")).toBe(
      false,
    );
    expect(allowsTranslate({ ...base, siteRank: "admin", publishPermission: true, languages: [] }, "ru")).toBe(true);
    expect(allowsAdmin({ ...base, siteRank: "editor", publishPermission: true })).toBe(false);
  });
});

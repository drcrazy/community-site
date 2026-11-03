import { describe, expect, it } from "vitest";
import { buildPublishPayload, emptyContentDraft, slugifyContent } from "../src/lib/content/content-builder";

describe("content builder", () => {
  it("slugifies English titles", () => {
    expect(slugifyContent("Hello World!")).toBe("hello-world");
  });

  it("builds publish payload with locale translations", () => {
    const draft = emptyContentDraft("guide");
    draft.title.en = "Core Layout";
    draft.summary.en = "A guide";
    draft.categoryId = "layouts";
    draft.position = 2;
    draft.blocks[0]!.text.en = "Hello";
    const payload = buildPublishPayload(draft);
    expect(payload.builderDraft.slug).toBe("core-layout");
    expect(payload.translations.en?.title).toBe("Core Layout");
  });
});

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "preact/hooks";
import {
  AllLanguagesToggle,
  EditorLanguagesProvider,
  TranslatedField,
  useEditorLanguages,
} from "../editor/EditorLanguages";
import { PublishedContentCanvas } from "../content/PublishedContentCanvas";
import { EVENT_CATEGORIES, GUIDE_CATEGORIES } from "../../lib/content/categories";
import {
  CONTENT_CANVAS_MIN_HEIGHT,
  defaultContentPosition,
  moveContentCanvasPosition,
  normalizeContentCanvasPosition,
  type ContentCanvasPosition,
} from "../../lib/content/content-canvas";
import {
  contentLocaleEntry,
  emptyContentBlock,
  emptyContentDraft,
  nextContentBlockPosition,
  slugifyContent,
  type ContentBlock,
  type ContentBlockType,
  type ContentBuilderDraft,
  type ContentKind,
} from "../../lib/content/content-builder";
import { HEROES } from "../../lib/content/heroes";
import { GODDESSES } from "../../lib/content/goddesses";
import { blankTranslations, type Translations } from "../../lib/i18n/translations";
import type { Locale } from "../../lib/i18n/locales";
import { textIn } from "../../lib/i18n/translations";

const STORAGE_KEY = "loa-content-builder-draft";
const BLOCK_TYPES: ContentBlockType[] = [
  "paragraph",
  "heading",
  "hero",
  "goddess",
  "heroIcon",
  "goddessIcon",
  "arrow",
  "image",
  "coreLink",
  "callout",
  "code",
  "divider",
  "credits",
];

type EditableBlock = ContentBlock & { uiId: string };
type EditableDraft = Omit<ContentBuilderDraft, "blocks"> & { blocks: EditableBlock[] };

type Caps = {
  canPrepare: boolean;
  canPublish: boolean;
  translateLocales: Locale[];
  mode: "edit" | "translate";
};

function CanvasBlock({
  block,
  selected,
  canDrag,
  onSelect,
  onMove,
}: {
  block: EditableBlock;
  selected: boolean;
  canDrag: boolean;
  onSelect: () => void;
  onMove: (uiId: string, dxPercent: number, dyPixels: number) => void;
}) {
  const drag = useRef<{ x: number; y: number } | null>(null);
  const position = normalizeContentCanvasPosition(block.position, defaultContentPosition(block.type));
  return (
    <div
      class={"content-builder-canvas-block" + (selected ? " is-selected" : "")}
      style={{
        left: position.x + "%",
        top: position.y + "px",
        width: position.width + "%",
        minHeight: position.height + "px",
      }}
      onClick={onSelect}
      onPointerDown={(event) => {
        if (!canDrag || event.button !== 0) return;
        const target = event.currentTarget as HTMLDivElement;
        target.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!drag.current || !canDrag) return;
        const parent = (event.currentTarget as HTMLDivElement).parentElement;
        if (!parent) return;
        const width = parent.getBoundingClientRect().width || 1;
        const dx = event.clientX - drag.current.x;
        const dy = event.clientY - drag.current.y;
        drag.current = { x: event.clientX, y: event.clientY };
        onMove(block.uiId, (dx / width) * 100, dy);
      }}
      onPointerUp={(event) => {
        drag.current = null;
        try {
          (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }}
    >
      <strong>{block.type}</strong>
      <span>{textIn(block.text, "en").slice(0, 80) || block.entityId || block.src || "…"}</span>
    </div>
  );
}

function BuilderInner({ caps, locale }: { caps: Caps; locale: Locale }) {
  const { languages } = useEditorLanguages();
  const blockIdPrefix = useId();
  const seq = useRef(1);
  const withUiId = useCallback(
    (block: ContentBlock): EditableBlock => ({
      ...block,
      uiId: `${blockIdPrefix}-block-${seq.current++}`,
    }),
    [blockIdPrefix],
  );

  const [draft, setDraft] = useState<EditableDraft>(() => {
    const initial = emptyContentDraft("news");
    return { ...initial, blocks: initial.blocks.map((b, i) => ({ ...b, uiId: `${blockIdPrefix}-block-${i}` })) };
  });
  const [selectedId, setSelectedId] = useState<string | null>(draft.blocks[0]?.uiId ?? null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"page" | "block" | "publish" | "load" | null>(null);
  const [draftList, setDraftList] = useState<Array<{ kind: ContentKind; slug: string; title: string }>>([]);
  const [lockedSlug, setLockedSlug] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const slug = lockedSlug ?? slugifyContent(draft.title.en);
  const complete = useMemo(() => ({ ...draft, slug }), [draft, slug]);
  const selected = draft.blocks.find((b) => b.uiId === selectedId) ?? null;
  const selectedIndex = draft.blocks.findIndex((b) => b.uiId === selectedId);
  const preview = useMemo(() => contentLocaleEntry(complete, locale), [complete, locale]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kindParam = params.get("kind");
    const edit = params.get("edit") === "1";
    const slugParam = params.get("slug")?.trim() ?? "";
    const kind =
      kindParam === "news" || kindParam === "guide" || kindParam === "event" ? kindParam : null;

    void (async () => {
      if (edit && kind && slugParam && (caps.canPrepare || caps.mode === "translate")) {
        const res = await fetch(`/api/content/drafts/${kind}/${slugParam}/`);
        const data = (await res.json().catch(() => ({}))) as {
          draft?: {
            body: ContentBuilderDraft;
            translations?: Array<{
              locale: string;
              title: string;
              summary: string;
              body: Partial<ContentBuilderDraft>;
            }>;
          };
        };
        if (res.ok && data.draft) {
          let body = data.draft.body;
          for (const tr of data.draft.translations ?? []) {
            const loc = tr.locale as Locale;
            body = {
              ...body,
              title: { ...body.title, [loc]: tr.title || body.title[loc] },
              summary: { ...body.summary, [loc]: tr.summary || body.summary[loc] },
            };
            if (tr.body?.intro) body.intro = { ...body.intro, ...tr.body.intro };
            if (tr.body?.note) body.note = { ...body.note, ...tr.body.note };
            if (Array.isArray(tr.body?.blocks)) {
              body.blocks = body.blocks.map((block, index) => {
                const patch = tr.body!.blocks![index];
                if (!patch) return block;
                return {
                  ...block,
                  text: { ...block.text, ...(patch.text ?? {}) },
                  alt: { ...block.alt, ...(patch.alt ?? {}) },
                };
              });
            }
          }
          const blocks = body.blocks.map((b) => withUiId(b));
          setDraft({ ...emptyContentDraft(kind), ...body, kind, slug: slugParam, blocks });
          setLockedSlug(slugParam);
          setSelectedId(blocks[0]?.uiId ?? null);
          setStatus(`Loaded ${kind}/${slugParam}`);
          return;
        }
      }

      if (kind && caps.canPrepare) {
        setDraft((current) => ({
          ...current,
          kind,
          categoryId: kind === "event" ? "main-event" : kind === "guide" ? "core-elements" : current.categoryId,
        }));
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw || !caps.canPrepare || edit) return;
        const parsed = JSON.parse(raw) as ContentBuilderDraft;
        if (kind && parsed.kind !== kind) return;
        const blocks = (parsed.blocks ?? []).map((b) => withUiId(b));
        setDraft({ ...emptyContentDraft(), ...parsed, blocks });
        setSelectedId(blocks[0]?.uiId ?? null);
      } catch {
        /* ignore */
      }
    })();
  }, [caps.canPrepare, caps.mode, withUiId]);

  const persistLocal = (next: EditableDraft) => {
    try {
      const { blocks, ...rest } = next;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...rest, blocks: blocks.map(({ uiId: _u, ...block }) => block) }),
      );
    } catch {
      /* ignore */
    }
  };

  const updateDraft = (patch: Partial<EditableDraft> | ((d: EditableDraft) => EditableDraft)) => {
    setDraft((current) => {
      const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
      persistLocal(next);
      return next;
    });
  };

  const setText = (field: "title" | "summary" | "intro" | "note", loc: Locale, value: string) => {
    if (!caps.canPrepare && loc === "en") return;
    if (!caps.canPrepare && !caps.translateLocales.includes(loc)) return;
    updateDraft({ [field]: { ...draft[field], [loc]: value } as Translations });
  };

  const setBlock = (index: number, patch: Partial<ContentBlock>) => {
    updateDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)),
    }));
  };

  const addBlock = (type: ContentBlockType, position?: ContentCanvasPosition) => {
    if (!caps.canPrepare) return;
    const block = withUiId(
      emptyContentBlock(type, position ?? nextContentBlockPosition(draft.blocks, type)),
    );
    updateDraft({ blocks: [...draft.blocks, block] });
    setSelectedId(block.uiId);
  };

  const moveBlock = (uiId: string, dxPercent: number, dyPixels: number) => {
    if (!caps.canPrepare) return;
    updateDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => {
        if (block.uiId !== uiId) return block;
        return {
          ...block,
          position: moveContentCanvasPosition(block.position, dxPercent, dyPixels),
        };
      }),
    }));
  };

  const saveDraft = async () => {
    setError("");
    setStatus("");
    if (caps.mode === "translate") {
      const loc = caps.translateLocales[0];
      if (!loc || !lockedSlug) {
        setError("Load a draft before translating.");
        return;
      }
      const res = await fetch("/api/content/translate/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          slug: lockedSlug,
          locale: loc,
          title: draft.title[loc],
          summary: draft.summary[loc],
          body: {
            intro: draft.intro,
            note: draft.note,
            blocks: draft.blocks.map(({ uiId: _u, ...block }) => block),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || "Translate failed.");
        return;
      }
      setStatus(`Saved ${loc} translation.`);
      return;
    }
    const res = await fetch("/api/content/prepare/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        draft: {
          ...complete,
          blocks: draft.blocks.map(({ uiId: _u, ...block }) => block),
        },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      draft?: { slug: string };
    };
    if (!res.ok) {
      setError(data.message || "Save failed.");
      return;
    }
    if (data.draft?.slug) setLockedSlug(data.draft.slug);
    setStatus(`Draft saved as ${data.draft?.slug ?? slug}.`);
  };

  const publish = async () => {
    setError("");
    setStatus("");
    const res = await fetch("/api/content/publish/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: draft.kind,
        slug: lockedSlug ?? slug,
        draft: caps.canPrepare
          ? { ...complete, blocks: draft.blocks.map(({ uiId: _u, ...block }) => block) }
          : undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; slug?: string };
    if (!res.ok) {
      setError(data.message || "Publish failed.");
      return;
    }
    setLockedSlug(data.slug ?? lockedSlug ?? slug);
    setStatus(`Published /${draft.kind}/${data.slug ?? slug}/`);
    setModal(null);
  };

  const loadDraftList = async () => {
    const res = await fetch("/api/content/drafts/");
    const data = (await res.json().catch(() => ({}))) as {
      drafts?: Array<{ kind: ContentKind; slug: string; title: string }>;
      message?: string;
    };
    if (!res.ok) {
      setError(data.message || "Could not list drafts.");
      return;
    }
    setDraftList(data.drafts ?? []);
    setModal("load");
  };

  const loadOne = async (kind: ContentKind, draftSlug: string) => {
    const res = await fetch(`/api/content/drafts/${kind}/${draftSlug}/`);
    const data = (await res.json().catch(() => ({}))) as {
      draft?: {
        body: ContentBuilderDraft;
        translations: Array<{ locale: string; title: string; summary: string; body: Partial<ContentBuilderDraft> }>;
      };
      message?: string;
    };
    if (!res.ok || !data.draft) {
      setError(data.message || "Could not load draft.");
      return;
    }
    let body = data.draft.body;
    for (const tr of data.draft.translations ?? []) {
      const loc = tr.locale as Locale;
      body = {
        ...body,
        title: { ...body.title, [loc]: tr.title || body.title[loc] },
        summary: { ...body.summary, [loc]: tr.summary || body.summary[loc] },
      };
      if (tr.body?.intro) body.intro = { ...body.intro, ...tr.body.intro };
      if (tr.body?.note) body.note = { ...body.note, ...tr.body.note };
      if (Array.isArray(tr.body?.blocks)) {
        body.blocks = body.blocks.map((block, index) => {
          const patch = tr.body!.blocks![index];
          if (!patch) return block;
          return {
            ...block,
            text: { ...block.text, ...(patch.text ?? {}) },
            alt: { ...block.alt, ...(patch.alt ?? {}) },
          };
        });
      }
    }
    const blocks = body.blocks.map((b) => withUiId(b));
    setDraft({ ...emptyContentDraft(kind), ...body, blocks });
    setLockedSlug(draftSlug);
    setSelectedId(blocks[0]?.uiId ?? null);
    setModal(null);
    setStatus(`Loaded ${kind}/${draftSlug}`);
  };

  const categories = draft.kind === "event" ? EVENT_CATEGORIES : GUIDE_CATEGORIES;
  const readOnlyEn: Locale[] = caps.canPrepare ? [] : ["en"];

  return (
      <div class="content-builder-page">
        <div class="content-builder-toolbar">
          <div class="content-builder-kind-options">
            {(["news", "guide", "event"] as ContentKind[]).map((kind) => (
              <button
                type="button"
                key={kind}
                class={draft.kind === kind ? "is-active" : ""}
                disabled={!caps.canPrepare || Boolean(lockedSlug)}
                onClick={() => updateDraft({ kind, categoryId: kind === "event" ? "main-event" : "core-elements" })}
              >
                {kind}
              </button>
            ))}
          </div>
          <div class="content-builder-actions">
            <button type="button" onClick={() => setModal("page")}>
              Page
            </button>
            <button type="button" disabled={!selected} onClick={() => setModal("block")}>
              Block
            </button>
            <button type="button" onClick={() => void loadDraftList()}>
              Load draft
            </button>
            <button type="button" class="button-primary" onClick={() => void saveDraft()}>
              Save draft
            </button>
            {caps.canPublish ? (
              <button type="button" class="button-primary" onClick={() => setModal("publish")}>
                Publish
              </button>
            ) : null}
          </div>
        </div>

        {(status || error) && (
          <p class={"content-builder-status" + (error ? " is-error" : "")}>{error || status}</p>
        )}

        <div class="content-builder-workspace">
          <aside class="content-builder-library">
            <h2>Library</h2>
            <p>Click + to add a block, then drag it on the stage.</p>
            <div class="content-builder-palette">
              {BLOCK_TYPES.map((type) => (
                <div key={type} class="content-builder-palette-wrap">
                  <span class="content-builder-palette-item">{type}</span>
                  <button type="button" disabled={!caps.canPrepare} onClick={() => addBlock(type)}>
                    +
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <section class="content-builder-stage">
            <div
              ref={canvasRef}
              class="content-builder-canvas"
              style={{ minHeight: CONTENT_CANVAS_MIN_HEIGHT + "px" }}
            >
              {draft.blocks.map((block) => (
                <CanvasBlock
                  key={block.uiId}
                  block={block}
                  selected={block.uiId === selectedId}
                  canDrag={caps.canPrepare}
                  onSelect={() => setSelectedId(block.uiId)}
                  onMove={moveBlock}
                />
              ))}
            </div>
          </section>

          <aside class="content-builder-preview-panel">
            <h2>Preview</h2>
            <p class="eyebrow">{slug || "untitled"}</p>
            <h3>{String((preview as { title?: string }).title || "Untitled")}</h3>
            <p>{String((preview as { summary?: string }).summary || "")}</p>
            {(preview as { contentCanvas?: { blocks: unknown[] } }).contentCanvas?.blocks?.length ? (
              <PublishedContentCanvas layout={(preview as { contentCanvas: import("../../lib/content/content-canvas").ContentCanvas }).contentCanvas} />
            ) : null}
          </aside>
        </div>

        {modal ? (
          <dialog class="content-builder-dialog" open onClose={() => setModal(null)}>
            <form
              method="dialog"
              class="content-builder-dialog-body"
              onSubmit={(e) => {
                e.preventDefault();
                setModal(null);
              }}
            >
              <header>
                <h2>
                  {modal === "page"
                    ? "Page fields"
                    : modal === "block"
                      ? "Block"
                      : modal === "publish"
                        ? "Publish"
                        : "Load draft"}
                </h2>
                <button type="button" onClick={() => setModal(null)}>
                  Close
                </button>
              </header>
              <AllLanguagesToggle />
              {modal === "page" ? (
                <div class="content-builder-dialog-fields">
                  <TranslatedField
                    label="Title"
                    languages={languages}
                    get={(loc) => draft.title[loc]}
                    set={(loc, value) => setText("title", loc, value)}
                    readOnlyLocales={readOnlyEn}
                  />
                  <TranslatedField
                    label="Summary"
                    multiline
                    languages={languages}
                    get={(loc) => draft.summary[loc]}
                    set={(loc, value) => setText("summary", loc, value)}
                    readOnlyLocales={readOnlyEn}
                  />
                  {draft.kind !== "news" ? (
                    <>
                      <TranslatedField
                        label="Intro"
                        multiline
                        languages={languages}
                        get={(loc) => draft.intro[loc]}
                        set={(loc, value) => setText("intro", loc, value)}
                        readOnlyLocales={readOnlyEn}
                      />
                      <label>
                        Category
                        <select
                          value={draft.categoryId}
                          disabled={!caps.canPrepare}
                          onChange={(e) => updateDraft({ categoryId: (e.currentTarget as HTMLSelectElement).value })}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Position
                        <input
                          type="number"
                          min={1}
                          value={draft.position ?? 1}
                          disabled={!caps.canPrepare}
                          onInput={(e) =>
                            updateDraft({ position: Number((e.currentTarget as HTMLInputElement).value) || 1 })
                          }
                        />
                      </label>
                    </>
                  ) : null}
                  <label>
                    Image URL
                    <input
                      type="text"
                      value={draft.image}
                      disabled={!caps.canPrepare}
                      onInput={(e) => updateDraft({ image: (e.currentTarget as HTMLInputElement).value })}
                      placeholder="/uploads/… or https://…"
                    />
                  </label>
                  <p class="hint">Slug: <code>{slug || "—"}</code>{lockedSlug ? " (locked after first save)" : " (from English title)"}</p>
                </div>
              ) : null}
              {modal === "block" && selected && selectedIndex >= 0 ? (
                <div class="content-builder-dialog-fields">
                  {["paragraph", "heading", "callout", "code", "credits", "coreLink"].includes(selected.type) ? (
                    <TranslatedField
                      label="Text"
                      multiline={selected.type === "paragraph" || selected.type === "code" || selected.type === "credits"}
                      languages={languages}
                      get={(loc) => selected.text[loc]}
                      set={(loc, value) =>
                        setBlock(selectedIndex, { text: { ...selected.text, [loc]: value } })
                      }
                      readOnlyLocales={readOnlyEn}
                    />
                  ) : null}
                  {selected.type === "heading" ? (
                    <label>
                      Level
                      <select
                        value={selected.headingLevel ?? 1}
                        disabled={!caps.canPrepare}
                        onChange={(e) =>
                          setBlock(selectedIndex, {
                            headingLevel: Number((e.currentTarget as HTMLSelectElement).value) as 1 | 2 | 3,
                          })
                        }
                      >
                        <option value={1}>H2</option>
                        <option value={2}>H3</option>
                        <option value={3}>H4</option>
                      </select>
                    </label>
                  ) : null}
                  {selected.type === "image" ? (
                    <>
                      <label>
                        Src
                        <input
                          value={selected.src}
                          disabled={!caps.canPrepare}
                          onInput={(e) => setBlock(selectedIndex, { src: (e.currentTarget as HTMLInputElement).value })}
                        />
                      </label>
                      <TranslatedField
                        label="Alt"
                        languages={languages}
                        get={(loc) => selected.alt[loc]}
                        set={(loc, value) => setBlock(selectedIndex, { alt: { ...selected.alt, [loc]: value } })}
                        readOnlyLocales={readOnlyEn}
                      />
                    </>
                  ) : null}
                  {selected.type === "coreLink" ? (
                    <label>
                      Href
                      <input
                        value={selected.href}
                        disabled={!caps.canPrepare}
                        onInput={(e) => setBlock(selectedIndex, { href: (e.currentTarget as HTMLInputElement).value })}
                      />
                    </label>
                  ) : null}
                  {selected.type === "arrow" ? (
                    <label>
                      Direction
                      <select
                        value={selected.direction}
                        disabled={!caps.canPrepare}
                        onChange={(e) =>
                          setBlock(selectedIndex, {
                            direction: (e.currentTarget as HTMLSelectElement).value as ContentBlock["direction"],
                          })
                        }
                      >
                        <option value="right">Right</option>
                        <option value="down">Down</option>
                        <option value="left">Left</option>
                      </select>
                    </label>
                  ) : null}
                  {["hero", "heroIcon"].includes(selected.type) ? (
                    <label>
                      Hero
                      <select
                        value={selected.entityId}
                        disabled={!caps.canPrepare}
                        onChange={(e) => setBlock(selectedIndex, { entityId: (e.currentTarget as HTMLSelectElement).value })}
                      >
                        <option value="">Select…</option>
                        {HEROES.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {["goddess", "goddessIcon"].includes(selected.type) ? (
                    <label>
                      Goddess
                      <select
                        value={selected.entityId}
                        disabled={!caps.canPrepare}
                        onChange={(e) => setBlock(selectedIndex, { entityId: (e.currentTarget as HTMLSelectElement).value })}
                      >
                        <option value="">Select…</option>
                        {GODDESSES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {caps.canPrepare ? (
                    <button
                      type="button"
                      class="button-danger"
                      onClick={() => {
                        updateDraft({ blocks: draft.blocks.filter((b) => b.uiId !== selected.uiId) });
                        setSelectedId(null);
                        setModal(null);
                      }}
                    >
                      Remove block
                    </button>
                  ) : null}
                </div>
              ) : null}
              {modal === "publish" ? (
                <div class="content-builder-dialog-fields">
                  <p>
                    Publish <strong>{draft.kind}</strong> as <code>{lockedSlug ?? slug}</code>. Republishing replaces the
                    live piece with the same identity.
                  </p>
                  <button type="button" class="button-primary" onClick={() => void publish()}>
                    Confirm publish
                  </button>
                </div>
              ) : null}
              {modal === "load" ? (
                <ul class="content-builder-draft-list">
                  {draftList.length === 0 ? <li>No drafts yet.</li> : null}
                  {draftList.map((item) => (
                    <li key={`${item.kind}-${item.slug}`}>
                      <button type="button" onClick={() => void loadOne(item.kind, item.slug)}>
                        <strong>{item.title || item.slug}</strong>
                        <span>
                          {item.kind}/{item.slug}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </form>
          </dialog>
        ) : null}
      </div>
  );
}

export function ContentBuilder(props: {
  locale: Locale;
  canPrepare: boolean;
  canPublish: boolean;
  translateLocales: Locale[];
  mode?: "edit" | "translate";
}) {
  const caps: Caps = {
    canPrepare: props.canPrepare,
    canPublish: props.canPublish,
    translateLocales: props.translateLocales,
    mode: props.mode ?? (props.canPrepare ? "edit" : "translate"),
  };
  const allowed: Locale[] = caps.canPrepare
    ? (["en", ...caps.translateLocales] as Locale[])
    : caps.translateLocales;
  return (
    <EditorLanguagesProvider allowed={allowed.length ? allowed : ["en"]}>
      <BuilderInner caps={caps} locale={props.locale} />
    </EditorLanguagesProvider>
  );
}

// silence unused import when tree-shaken oddly
void blankTranslations;

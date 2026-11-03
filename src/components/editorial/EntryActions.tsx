import { useState } from "preact/hooks";
import type { ContentKind } from "../../lib/content/content-builder";

export function EntryActions({
  kind,
  slug,
  title,
  editHref,
  canPrepare,
  canPublish,
}: {
  kind: ContentKind;
  slug: string;
  title: string;
  editHref: string;
  canPrepare: boolean;
  canPublish: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!canPrepare && !canPublish) return null;

  const unpublish = async () => {
    if (!canPublish) return;
    if (!window.confirm(`Unpublish “${title}”? The draft can remain in Content Builder.`)) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/content/unpublish/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, slug }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message || "Could not unpublish.");
      return;
    }
    window.location.reload();
  };

  return (
    <div class="entry-actions">
      {canPrepare ? (
        <a class="small-button" href={editHref}>
          Edit
        </a>
      ) : null}
      {canPublish ? (
        <button class="small-button button-danger" type="button" disabled={busy} onClick={() => void unpublish()}>
          {busy ? "Removing…" : "Unpublish"}
        </button>
      ) : null}
      {error ? (
        <span class="entry-actions-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from "preact/hooks";
import { CARE_ACTIONS, type CareAction } from "../../lib/benben/state";

type View = {
  needs: { hunger: number; shine: number; warmth: number; rest: number };
  journey: { landscape: number; milestone: number; landscapes: number; milestonesPerLandscape: number };
  sunbathProgress: number;
  sunbathGoal: number;
  phoenixActive: boolean;
  careRemaining: number;
};

export function BenbenCare({ signedIn, signInHref }: { signedIn: boolean; signInHref: string }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/benben/state/");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data as { message?: string }).message || "Benben unavailable.");
      return;
    }
    setView(data as View);
    setError("");
  };

  useEffect(() => {
    void load();
  }, []);

  const care = async (action: CareAction) => {
    if (!signedIn) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/benben/care/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((data as { message?: string }).message || "Care refused.");
      if ((data as { needs?: View["needs"] }).needs) setView(data as View);
      return;
    }
    setView(data as View);
  };

  if (!view && !error) return <p class="hint">Loading Benben…</p>;

  return (
    <div class="benben-page">
      {error ? <p class="content-builder-status is-error">{error}</p> : null}
      {view ? (
        <>
          <div class="benben-needs">
            {(
              [
                ["hunger", view.needs.hunger],
                ["shine", view.needs.shine],
                ["warmth", view.needs.warmth],
                ["rest", view.needs.rest],
              ] as const
            ).map(([label, value]) => (
              <div class="benben-need" key={label}>
                <span class="eyebrow">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p>
            Journey: landscape {view.journey.landscape + 1}/{view.journey.landscapes}, milestone{" "}
            {view.journey.milestone + 1}/{view.journey.milestonesPerLandscape}
            {view.phoenixActive ? " · Phoenix visiting" : ""}
          </p>
          <p class="hint">
            Sunbath progress {view.sunbathProgress}/{view.sunbathGoal}
            {signedIn ? ` · Care left today: ${view.careRemaining}` : ""}
          </p>
          {signedIn ? (
            <div class="benben-actions">
              {CARE_ACTIONS.map((action) => (
                <button
                  type="button"
                  class="button-primary"
                  key={action}
                  disabled={busy || view.careRemaining <= 0}
                  onClick={() => void care(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          ) : (
            <p>
              <a href={signInHref}>Sign in</a> to care for Benben.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

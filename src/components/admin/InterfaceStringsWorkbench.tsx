import { useEffect, useMemo, useState } from "preact/hooks";
import type { Locale } from "../../lib/i18n/locales";

export function InterfaceStringsWorkbench({ locales }: { locales: Locale[] }) {
  const [locale, setLocale] = useState<Locale>(locales[0] ?? "de");
  const [keys, setKeys] = useState<string[]>([]);
  const [english, setEnglish] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!locales.includes(locale) && locales[0]) setLocale(locales[0]);
  }, [locales, locale]);

  useEffect(() => {
    void (async () => {
      setError("");
      const res = await fetch(`/api/content/interface-strings/?locale=${locale}`);
      const data = (await res.json().catch(() => ({}))) as {
        keys?: string[];
        english?: Record<string, string>;
        overrides?: Array<{ key: string; value: string }>;
        message?: string;
      };
      if (!res.ok) {
        setError(data.message || "Load failed.");
        return;
      }
      setKeys(data.keys ?? []);
      const map = Object.fromEntries((data.overrides ?? []).map((row) => [row.key, row.value]));
      setOverrides(map);
      setDrafts(map);
      setEnglish(data.english ?? {});
    })();
  }, [locale]);

  const rows = useMemo(() => keys.slice().sort(), [keys]);

  const save = async (key: string) => {
    setStatus("");
    setError("");
    const value = drafts[key] ?? "";
    const res = await fetch("/api/content/interface-strings/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale, key, value }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setError(data.message || "Save failed.");
      return;
    }
    setOverrides((current) => {
      const next = { ...current };
      if (value.trim()) next[key] = value;
      else delete next[key];
      return next;
    });
    setStatus(`Saved ${key} (${locale}).`);
  };

  return (
    <div class="interface-strings-workbench">
      <label class="interface-strings-locale">
        <span>Language</span>
        <select value={locale} onChange={(e) => setLocale((e.currentTarget as HTMLSelectElement).value as Locale)}>
          {locales.map((item) => (
            <option key={item} value={item}>
              {item.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      {status ? <p class="content-builder-status">{status}</p> : null}
      {error ? <p class="content-builder-status is-error">{error}</p> : null}
      <div class="interface-strings-list">
        {rows.map((key) => (
          <div class="interface-strings-row" key={key}>
            <code>{key}</code>
            <span class="hint">{english[key]}</span>
            <input
              type="text"
              value={drafts[key] ?? ""}
              placeholder="Override (empty = English fallback)"
              onInput={(e) =>
                setDrafts((current) => ({
                  ...current,
                  [key]: (e.currentTarget as HTMLInputElement).value,
                }))
              }
            />
            <button type="button" class="button button-primary" onClick={() => void save(key)}>
              {overrides[key] ? "Update" : "Save"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

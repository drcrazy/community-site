import { createContext } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { LOCALES, LOCALE_LABELS, type Locale } from "../../lib/i18n/locales";

type EditorLangContext = {
  language: Locale;
  languages: Locale[];
  setLanguage: (locale: Locale) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
};

const Ctx = createContext<EditorLangContext | null>(null);

export function EditorLanguagesProvider({
  children,
  allowed,
}: {
  children: ComponentChildren;
  allowed?: Locale[];
}) {
  const pool = allowed?.length ? allowed : [...LOCALES];
  const [language, setLanguage] = useState<Locale>(pool.includes("en") ? "en" : pool[0]!);
  const [showAll, setShowAll] = useState(false);
  const languages = useMemo(() => (showAll ? pool : [language]), [showAll, pool, language]);
  return (
    <Ctx.Provider value={{ language, languages, setLanguage, showAll, setShowAll }}>{children}</Ctx.Provider>
  );
}

export function useEditorLanguages() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("EditorLanguagesProvider required");
  return ctx;
}

export function AllLanguagesToggle() {
  const { showAll, setShowAll, language, setLanguage, languages } = useEditorLanguages();
  const pool = languages.length > 1 || showAll ? LOCALES : languages;
  return (
    <div class="editor-languages-bar">
      <label>
        <span class="sr-only">Language</span>
        <select value={language} onChange={(e) => setLanguage((e.currentTarget as HTMLSelectElement).value as Locale)}>
          {pool.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_LABELS[locale]}
            </option>
          ))}
        </select>
      </label>
      <button type="button" class="button-secondary" onClick={() => setShowAll(!showAll)}>
        {showAll ? "One language" : "All languages"}
      </button>
    </div>
  );
}

export function TranslatedField({
  label,
  languages,
  get,
  set,
  multiline = false,
  rows = 3,
  readOnlyLocales = [],
}: {
  label: string;
  languages: Locale[];
  get: (locale: Locale) => string;
  set: (locale: Locale, value: string) => void;
  multiline?: boolean;
  rows?: number;
  readOnlyLocales?: Locale[];
}) {
  return (
    <div class="translated-field">
      <strong>{label}</strong>
      {languages.map((locale) => {
        const readOnly = readOnlyLocales.includes(locale);
        const common = {
          value: get(locale),
          disabled: readOnly,
          onInput: (e: Event) => set(locale, (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value),
          "aria-label": `${label} (${LOCALE_LABELS[locale]})`,
        };
        return (
          <label key={locale} class="translated-field-row">
            <span>{locale.toUpperCase()}</span>
            {multiline ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}
          </label>
        );
      })}
    </div>
  );
}

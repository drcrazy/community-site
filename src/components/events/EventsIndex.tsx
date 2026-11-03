import { useMemo, useState } from "preact/hooks";
import { EntryActions } from "../editorial/EntryActions";

export type EventCardData = {
  id: string;
  href: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  icon: string | null;
  editable?: boolean;
  editHref?: string;
};

type Labels = {
  searchLabel: string;
  searchPlaceholder: string;
  statEntries: string;
  noMatch: string;
  empty: string;
};

type Editorial = {
  canPrepare: boolean;
  canPublish: boolean;
};

function fold(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function EventsIndex({
  entries,
  categoryOrder,
  labels,
  editorial,
}: {
  entries: EventCardData[];
  categoryOrder: string[];
  labels: Labels;
  editorial?: Editorial;
}) {
  const [query, setQuery] = useState("");
  const needle = fold(query);

  const groups = useMemo(() => {
    return categoryOrder
      .map((category) => {
        const items = entries.filter((entry) => {
          if (entry.category !== category) return false;
          if (!needle) return true;
          return fold(`${entry.title} ${entry.summary} ${entry.categoryLabel}`).includes(needle);
        });
        return {
          id: category,
          label: items[0]?.categoryLabel ?? category,
          items,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [entries, categoryOrder, needle]);

  return (
    <div class="guides-index events-index">
      <ul class="guides-stats">
        <li>
          <strong>{entries.length}</strong> {labels.statEntries}
        </li>
      </ul>

      <div class="guides-toolbar">
        <label class="guides-search">
          <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16.5 16.5 20 20" />
          </svg>
          <span class="visually-hidden">{labels.searchLabel}</span>
          <input
            type="search"
            value={query}
            onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
            placeholder={labels.searchPlaceholder}
          />
        </label>
      </div>

      {needle && groups.length === 0 ? <p class="empty-state">{labels.noMatch}</p> : null}

      {entries.length === 0 ? (
        <p class="empty-state">{labels.empty}</p>
      ) : (
        groups.map((group) => (
          <section class="guides-category event-category" data-category={group.id} key={group.id} aria-labelledby={`events-${group.id}`}>
            <header class="guides-category-head">
              <h2 id={`events-${group.id}`}>{group.label}</h2>
              <span class="guides-category-count">{group.items.length}</span>
            </header>
            <ul class="guides-grid">
              {group.items.map((item) => (
                <li key={item.id}>
                  <article class="guide-card">
                    {item.icon ? (
                      <div class="guide-card-art is-icon" aria-hidden="true">
                        <img class="event-card-icon" src={item.icon} alt="" width="88" height="88" loading="lazy" decoding="async" />
                      </div>
                    ) : (
                      <div class="guide-card-art is-glyph" aria-hidden="true">
                        <svg class="guide-card-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                          <path d="M3.5 10h17M8 3.5V6M16 3.5V6" />
                          <rect x="7" y="13" width="3.4" height="3.2" rx=".7" fill="currentColor" stroke="none" />
                        </svg>
                      </div>
                    )}
                    <div class="guide-card-body">
                      <h3>
                        <a class="guide-card-link" href={item.href}>
                          {item.title}
                        </a>
                      </h3>
                      <p>{item.summary}</p>
                      {item.editable && item.editHref && editorial ? (
                        <EntryActions
                          kind="event"
                          slug={item.id}
                          title={item.title}
                          editHref={item.editHref}
                          canPrepare={editorial.canPrepare}
                          canPublish={editorial.canPublish}
                        />
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

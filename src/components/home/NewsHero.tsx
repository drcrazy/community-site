import { useState } from "preact/hooks";

export type NewsSlide = {
  id: string;
  href: string;
  title: string;
  summary: string;
  dateLabel: string;
  dateTime: string;
};

type Labels = {
  latestNews: string;
  allNews: string;
  readMore: string;
  newsPrevious: string;
  newsNext: string;
  newsPosition: string;
  emptyTitle: string;
  emptyLede: string;
  allNewsHref: string;
};

function Chevron({ className = "icon icon-sm" }: { className?: string }) {
  return (
    <svg class={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function positionLabel(template: string, n: number, total: number) {
  return template.replace("{n}", String(n)).replace("{total}", String(total));
}

export function NewsHero({ entries, labels }: { entries: NewsSlide[]; labels: Labels }) {
  const [index, setIndex] = useState(0);

  if (entries.length === 0) {
    return (
      <section
        class="hero hero-news"
        style={{
          "--hero-news-light": 'url("/banners/home-light.webp")',
          "--hero-news-dark": 'url("/banners/home-dark.webp")',
          "--hero-news-light-sm": 'url("/banners/home-light-sm.webp")',
          "--hero-news-dark-sm": 'url("/banners/home-dark-sm.webp")',
        }}
      >
        <div class="eyebrow">{labels.latestNews}</div>
        <h1>{labels.emptyTitle}</h1>
        <p class="lede">{labels.emptyLede}</p>
      </section>
    );
  }

  const entry = entries[Math.min(index, entries.length - 1)]!;
  const move = (step: number) =>
    setIndex((current) => (current + step + entries.length) % entries.length);

  return (
    <section
      class="hero hero-news"
      style={{
        "--hero-news-light": 'url("/banners/home-light.webp")',
        "--hero-news-dark": 'url("/banners/home-dark.webp")',
        "--hero-news-light-sm": 'url("/banners/home-light-sm.webp")',
        "--hero-news-dark-sm": 'url("/banners/home-dark-sm.webp")',
      }}
      aria-roledescription="carousel"
      aria-label={labels.latestNews}
    >
      <div class="news-slide" aria-live="polite">
        <div class="news-slide-head">
          <span class="eyebrow">{labels.latestNews}</span>
          {entries.length > 1 && (
            <div class="news-slide-controls">
              <button type="button" aria-label={labels.newsPrevious} onClick={() => move(-1)}>
                <Chevron className="icon icon-sm chevron-prev" />
              </button>
              <span class="mono">{positionLabel(labels.newsPosition, index + 1, entries.length)}</span>
              <button type="button" aria-label={labels.newsNext} onClick={() => move(1)}>
                <Chevron />
              </button>
            </div>
          )}
        </div>
        <time class="mono" dateTime={entry.dateTime}>
          {entry.dateLabel}
        </time>
        <h1>{entry.title}</h1>
        <p class="lede">{entry.summary}</p>
        <div class="hero-actions">
          <a class="button button-primary" href={entry.href}>
            {labels.readMore} <span aria-hidden="true">→</span>
          </a>
          <a class="button button-secondary" href={labels.allNewsHref}>
            {labels.allNews}
          </a>
        </div>
      </div>
    </section>
  );
}

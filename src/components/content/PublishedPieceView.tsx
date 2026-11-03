import { PublishedContentCanvas } from "./PublishedContentCanvas";
import { RichContentText } from "./RichContentText";
import type { ContentCanvas } from "../../lib/content/content-canvas";

export function PublishedPieceView({
  title,
  summary,
  intro,
  note,
  body,
  sections,
  contentCanvas,
}: {
  title: string;
  summary: string;
  intro?: string;
  note?: string;
  body?: string[];
  sections?: { heading: string; body: string[] }[];
  contentCanvas?: ContentCanvas;
}) {
  return (
    <article class="reader published-piece">
      <h1>{title}</h1>
      {summary ? <p class="summary">{summary}</p> : null}
      {intro ? <p class="intro">{intro}</p> : null}
      {contentCanvas?.blocks?.length ? (
        <PublishedContentCanvas layout={contentCanvas} />
      ) : (
        <div class="body">
          {(body ?? []).map((paragraph, index) => (
            <RichContentText key={`b-${index}`} text={paragraph} />
          ))}
          {(sections ?? []).map((section, index) => (
            <section key={`s-${index}`}>
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.body.map((paragraph, pIndex) => (
                <RichContentText key={`s-${index}-${pIndex}`} text={paragraph} />
              ))}
            </section>
          ))}
        </div>
      )}
      {note ? <p class="note">{note}</p> : null}
    </article>
  );
}

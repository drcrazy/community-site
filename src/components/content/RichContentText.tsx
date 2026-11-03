import { HEROES, heroImageUrl } from "../../lib/content/heroes";
import { GODDESSES, goddessImageUrl } from "../../lib/content/goddesses";

function safeImage(value: string) {
  return value.startsWith("/") || /^https:\/\//i.test(value);
}

function safeLink(value: string) {
  return value.startsWith("/") || /^https:\/\//i.test(value);
}

function inline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link && safeLink(link[2]!)) {
      return (
        <a key={index} href={link[2]} target={link[2]!.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {link[1]}
        </a>
      );
    }
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    return <span key={index}>{part}</span>;
  });
}

export function RichContentText({ text }: { text: string }) {
  const pieces = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {pieces.flatMap((piece, pieceIndex) => {
        if (piece.startsWith("```") && piece.endsWith("```")) {
          const code = /^```([^\n]*)\n?([\s\S]*?)\n?```$/.exec(piece);
          return [
            <pre class="content-builder-code-block" key={`code-${pieceIndex}`}>
              <code class={code?.[1] ? `language-${code[1]}` : undefined}>{code?.[2] ?? piece.slice(3, -3)}</code>
            </pre>,
          ];
        }
        return piece.split(/\n\s*\n/).map((block, index) => {
          const line = block.trim();
          if (!line) return null;
          if (/^#{2,4} /.test(line)) {
            const level = Math.min(5, (line.match(/^#+/)?.[0].length ?? 2) + 1);
            const title = line.replace(/^#{2,4} /, "");
            if (level === 3) return <h3 key={`${pieceIndex}-${index}`}>{title}</h3>;
            if (level === 4) return <h4 key={`${pieceIndex}-${index}`}>{title}</h4>;
            return <h5 key={`${pieceIndex}-${index}`}>{title}</h5>;
          }
          if (line === "---" || line === "***") return <hr key={`${pieceIndex}-${index}`} />;
          if (line.startsWith("> ")) {
            return (
              <p class="callout" key={`${pieceIndex}-${index}`}>
                {inline(line.slice(2))}
              </p>
            );
          }
          const characterIcon = /^\[\[(hero|goddess)-icon:([a-z0-9-]+)\]\]$/i.exec(line);
          if (characterIcon) {
            const kind = characterIcon[1]!.toLowerCase() as "hero" | "goddess";
            const id = characterIcon[2]!;
            const person = kind === "hero" ? HEROES.find((h) => h.id === id) : GODDESSES.find((g) => g.id === id);
            if (!person) return null;
            const src = person.images[0]
              ? kind === "hero"
                ? heroImageUrl(person.images[0])
                : goddessImageUrl(person.images[0])
              : "";
            return (
              <span class="guide-content-character-icon" key={`${pieceIndex}-${index}`}>
                {src ? <img src={src} alt={person.name} width={48} height={48} /> : person.name}
              </span>
            );
          }
          const character = /^\[\[(hero|goddess):([a-z0-9-]+)\]\]$/i.exec(line);
          if (character) {
            const kind = character[1]!.toLowerCase() as "hero" | "goddess";
            const id = character[2]!;
            const person = kind === "hero" ? HEROES.find((h) => h.id === id) : GODDESSES.find((g) => g.id === id);
            if (!person) return null;
            const src = person.images[0]
              ? kind === "hero"
                ? heroImageUrl(person.images[0])
                : goddessImageUrl(person.images[0])
              : "";
            return (
              <div class="guide-content-character" key={`${pieceIndex}-${index}`}>
                {src ? <img src={src} alt="" width={72} height={72} /> : null}
                <strong>{person.name}</strong>
              </div>
            );
          }
          const arrow = /^\[\[arrow:(right|down|left)\]\]$/i.exec(line);
          if (arrow) {
            const direction = arrow[1]!.toLowerCase();
            const symbol = direction === "down" ? "↓" : direction === "left" ? "←" : "→";
            return (
              <div class={`guide-content-arrow is-${direction}`} key={`${pieceIndex}-${index}`} aria-hidden="true">
                <span>{symbol}</span>
              </div>
            );
          }
          const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
          if (image && safeImage(image[2]!)) {
            return (
              <figure class="content-builder-inline-image" key={`${pieceIndex}-${index}`}>
                <img src={image[2]} alt={image[1]} />
                {image[1] ? <figcaption>{image[1]}</figcaption> : null}
              </figure>
            );
          }
          return <p key={`${pieceIndex}-${index}`}>{inline(line)}</p>;
        });
      })}
    </>
  );
}

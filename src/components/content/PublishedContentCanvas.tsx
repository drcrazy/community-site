import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import {
  CONTENT_CANVAS_MIN_HEIGHT,
  defaultContentPosition,
  isContentCanvasImage,
  normalizeContentCanvasPosition,
  type ContentCanvas,
} from "../../lib/content/content-canvas";
import { RichContentText } from "./RichContentText";

export function PublishedContentCanvas({ layout, className = "" }: { layout: ContentCanvas; className?: string }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const blocks = useMemo(
    () =>
      layout.blocks
        .map((block, index) => ({
          block,
          index,
          isImage: isContentCanvasImage(block.content),
          position: normalizeContentCanvasPosition(block, defaultContentPosition("paragraph")),
        }))
        .sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x),
    [layout.blocks],
  );
  const initialHeight = Math.max(
    CONTENT_CANVAS_MIN_HEIGHT,
    ...blocks.map(({ position }) => position.y + position.height + 28),
  );
  const [height, setHeight] = useState(initialHeight);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const bottom = Array.from(canvas.children).reduce((max, child) => {
        const element = child as HTMLElement;
        return Math.max(max, element.offsetTop + element.offsetHeight + 28);
      }, CONTENT_CANVAS_MIN_HEIGHT);
      setHeight((current) => (current === bottom ? current : bottom));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    Array.from(canvas.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [blocks]);

  return (
    <div
      ref={canvasRef}
      class={("published-content-canvas " + className).trim()}
      style={{ height: height + "px" }}
    >
      {blocks.map(({ block, index, isImage, position }) => (
        <section
          key={index}
          class={"published-content-canvas-block" + (isImage ? " is-image" : "")}
          style={
            {
              left: position.x + "%",
              top: position.y + "px",
              width: position.width + "%",
              height: isImage ? position.height + "px" : undefined,
              minHeight: isImage ? "0px" : position.height + "px",
            } as JSX.CSSProperties
          }
        >
          <RichContentText text={block.content} />
        </section>
      ))}
    </div>
  );
}

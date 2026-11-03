export const CONTENT_CANVAS_MIN_HEIGHT = 720;
export const CONTENT_CANVAS_SNAP_COLUMNS = 100;
export const CONTENT_CANVAS_SNAP_ROW_HEIGHT = 4;

/** Detect image-only canvas blocks so their saved height can size the picture. */
export function isContentCanvasImage(content: string): boolean {
  const value = content.trim();
  return /^!\[[^\]]*\]\([^)]+\)$/.test(value)
    || /^\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)$/.test(value);
}

const LEGACY_CANVAS_COLUMNS = 12;
const LEGACY_CANVAS_ROWS = 40;
const LEGACY_ROW_HEIGHT = 200;

export type ContentCanvasPosition = {
  /** Horizontal position as a percentage of the page frame. */
  x: number;
  /** Vertical position in CSS pixels from the top of the page frame. */
  y: number;
  /** Width as a percentage of the page frame. */
  width: number;
  /** Block height in CSS pixels. Text may grow beyond it; image blocks use a fixed frame. */
  height: number;
};

/** Keep drag-only translation out of a block after its committed position changes. */
export function contentCanvasBlockTransform(
  isDragging: boolean,
  dragTransform: string | null | undefined,
  previewOffset?: { x: number; y: number },
): string | undefined {
  const transforms: string[] = [];
  if (isDragging && dragTransform) transforms.push(dragTransform);
  if (previewOffset) transforms.push(`translate(${previewOffset.x}px, ${previewOffset.y}px)`);
  return transforms.length ? transforms.join(" ") : undefined;
}

/** Remove one builder-only canvas block, including the last remaining block. */
export function removeContentCanvasBlock<T extends { uiId: string }>(
  blocks: readonly T[],
  blockId: string,
): T[] {
  return blocks.filter((block) => block.uiId !== blockId);
}

/** Move a selected set as one group while keeping its shared horizontal bounds on the canvas. */
export function moveContentCanvasGroup<T extends { uiId: string; position: ContentCanvasPosition }>(
  blocks: readonly T[],
  selectedIds: readonly string[],
  activeId: string,
  deltaXPercent: number,
  deltaYPixels: number,
): T[] {
  const movingIds = new Set(selectedIds.includes(activeId) ? selectedIds : [activeId]);
  const moving = blocks.filter((block) => movingIds.has(block.uiId));
  if (!moving.length) return [...blocks];
  const minX = Math.min(...moving.map((block) => block.position.x));
  const maxRight = Math.max(...moving.map((block) => block.position.x + block.position.width));
  const dx = Math.max(-minX, Math.min(100 - maxRight, deltaXPercent));
  return blocks.map((block) => movingIds.has(block.uiId)
    ? { ...block, position: { ...block.position, x: block.position.x + dx, y: Math.max(0, block.position.y + deltaYPixels) } }
    : block);
}

/** Translate one block from its saved position using the pointer's pixel delta. */
export function moveContentCanvasPosition(
  position: ContentCanvasPosition,
  deltaXPercent: number,
  deltaYPixels: number,
): ContentCanvasPosition {
  return {
    ...position,
    x: Math.max(0, Math.min(100 - position.width, position.x + deltaXPercent)),
    y: Math.max(0, position.y + deltaYPixels),
  };
}

/** Commit the positions rendered by the canvas preview without recalculating them. */
export function applyContentCanvasPositions<T extends { uiId: string; position: ContentCanvasPosition }>(
  blocks: readonly T[],
  positions: readonly { uiId: string; position: ContentCanvasPosition }[],
): T[] {
  const positionsById = new Map(positions.map(({ uiId, position }) => [uiId, position]));
  return blocks.map((block) => {
    const position = positionsById.get(block.uiId);
    return position ? { ...block, position } : block;
  });
}

/** Snap a freeform canvas position to the fine alignment grid. */
export function snapContentCanvasPosition(position: ContentCanvasPosition, includeSize = false): ContentCanvasPosition {
  const column = 100 / CONTENT_CANVAS_SNAP_COLUMNS;
  const rowHeight = CONTENT_CANVAS_SNAP_ROW_HEIGHT;
  const width = includeSize ? Math.max(column, Math.round(position.width / column) * column) : position.width;
  const x = Math.max(0, Math.min(100 - width, Math.round(position.x / column) * column));
  return {
    ...position,
    x,
    y: Math.max(0, Math.round(position.y / rowHeight) * rowHeight),
    width,
    height: includeSize ? Math.max(48, Math.round(position.height / rowHeight) * rowHeight) : position.height,
  };
}

export type ContentCanvasBlock = ContentCanvasPosition & {
  content: string;
};

export type LegacyContentCanvasBlock = {
  column: number;
  row: number;
  width: number;
  content: string;
};

export type ContentCanvas = {
  blocks: Array<ContentCanvasBlock | LegacyContentCanvasBlock>;
  /** Present only on layouts exported by the old 12-column builder. */
  columns?: number;
  rows?: number;
};

export function defaultContentPosition(type: string): ContentCanvasPosition {
  const width = type === "heading" ? 82
    : type === "arrow" ? 22
      : type === "hero" || type === "goddess" ? 34
        : type === "heroIcon" || type === "goddessIcon" ? 14
        : type === "image" ? 52
          : type === "callout" ? 44
            : type === "coreLink" ? 42
              : type === "divider" ? 88
                : type === "code" ? 82
              : 50;
  const height = type === "heading" ? 105
    : type === "arrow" ? 100
      : type === "image" ? 270
        : type === "heroIcon" || type === "goddessIcon" ? 70
        : type === "hero" || type === "goddess" ? 190
          : type === "divider" ? 64
            : type === "code" ? 220
          : 165;
  return { x: 5, y: 28, width, height };
}

/** Give click-to-add a loose starting spot; dragged modules use the exact drop point. */
export function nextContentPosition(
  blocks: readonly Pick<ContentCanvasPosition, "x" | "y" | "width" | "height">[],
  type: string,
): ContentCanvasPosition {
  const base = defaultContentPosition(type);
  const index = blocks.length;
  const angle = index * 2.399963229728653;
  const radius = 18 * Math.sqrt(index + 1);
  const maxX = Math.max(0, 100 - base.width - 4);
  const x = Math.max(2, Math.min(maxX, 50 + Math.cos(angle) * radius - base.width / 2));
  const y = Math.max(24, 90 + index * 36 + Math.sin(angle) * 34);
  return { ...base, x, y };
}

export function normalizeContentCanvasPosition(value: unknown, fallback: ContentCanvasPosition): ContentCanvasPosition {
  if (typeof value !== "object" || value === null) return fallback;
  const item = value as Partial<ContentCanvasPosition & LegacyContentCanvasBlock>;
  if (Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.width)
    && item.x! >= 0 && item.x! <= 100 && item.y! >= 0 && item.width! > 0
    && item.x! + item.width! <= 100) {
    return {
      x: item.x!,
      y: item.y!,
      width: item.width!,
      height: Number.isFinite(item.height) && item.height! > 0 ? item.height! : fallback.height,
    };
  }
  if (Number.isInteger(item.column) && item.column! >= 1 && item.column! <= LEGACY_CANVAS_COLUMNS
    && Number.isInteger(item.row) && item.row! >= 1 && item.row! <= LEGACY_CANVAS_ROWS
    && Number.isInteger(item.width) && item.width! >= 1
    && item.column! + item.width! <= LEGACY_CANVAS_COLUMNS + 1) {
    return {
      x: ((item.column! - 1) / LEGACY_CANVAS_COLUMNS) * 100,
      y: (item.row! - 1) * LEGACY_ROW_HEIGHT,
      width: (item.width! / LEGACY_CANVAS_COLUMNS) * 100,
      height: fallback.height,
    };
  }
  return fallback;
}

export function chooseContentCanvasDropTargets<T extends { id: string | number }>(
  pointerCollisions: readonly T[],
  rectCollisions: readonly T[],
  canvasDropId: string,
): T[] {
  const collisions = pointerCollisions.length ? pointerCollisions : rectCollisions;
  const targets = collisions.filter((collision) => String(collision.id) !== canvasDropId);
  return targets.length ? targets : [...collisions];
}

export function shouldCommitContentCanvasDrop(
  source: unknown,
  overId: string | number | null | undefined,
  canvasDropId: string,
  blockIds: readonly string[],
): boolean {
  if (source === "canvas") return true;
  if (source !== "palette" || overId == null) return false;
  const id = String(overId);
  return id === canvasDropId || blockIds.includes(id);
}

export function isContentCanvas(value: unknown): value is ContentCanvas {
  if (typeof value !== "object" || value === null) return false;
  const canvas = value as Partial<ContentCanvas>;
  if (!Array.isArray(canvas.blocks) || canvas.blocks.length > 200) return false;
  if (canvas.columns !== undefined && canvas.columns !== LEGACY_CANVAS_COLUMNS) return false;
  if (canvas.rows !== undefined
    && (!Number.isInteger(canvas.rows) || canvas.rows! < 1 || canvas.rows! > LEGACY_CANVAS_ROWS)) return false;
  return canvas.blocks.every((block) => {
    if (typeof block !== "object" || block === null) return false;
    const item = block as Partial<ContentCanvasBlock & LegacyContentCanvasBlock>;
    if (typeof item.content !== "string" || item.content.length > 10_000) return false;
    const freeform = Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.width)
      && Number.isFinite(item.height) && item.x! >= 0 && item.y! >= 0
      && item.width! > 0 && item.height! > 0 && item.x! + item.width! <= 100;
    const legacy = canvas.columns === LEGACY_CANVAS_COLUMNS
      && Number.isInteger(item.column) && item.column! >= 1 && item.column! <= LEGACY_CANVAS_COLUMNS
      && Number.isInteger(item.row) && item.row! >= 1 && item.row! <= (canvas.rows ?? LEGACY_CANVAS_ROWS)
      && Number.isInteger(item.width) && item.width! >= 1
      && item.column! + item.width! <= LEGACY_CANVAS_COLUMNS + 1;
    return freeform || legacy;
  });
}

export function contentCanvasFromBlocks(blocks: ContentCanvasBlock[]): ContentCanvas | undefined {
  if (blocks.length === 0) return undefined;
  return { blocks };
}

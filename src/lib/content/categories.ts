export const GUIDE_CATEGORIES = [
  { id: "core-elements", label: "Core elements" },
  { id: "layouts", label: "Layouts" },
  { id: "buildings", label: "Buildings" },
  { id: "tier-lists", label: "Tier lists" },
  { id: "tips-and-tricks", label: "Tips and tricks" },
  { id: "goddess", label: "Goddess" },
  { id: "events", label: "Events" },
  { id: "grand-voyage", label: "Grand Voyage" },
] as const;

export const EVENT_CATEGORIES = [
  { id: "main-event", label: "Main event", color: "blue" },
  { id: "routine-event", label: "Routine Event", color: "orange" },
  { id: "ranking-challenge", label: "Ranking Challenge", color: "red" },
] as const;

export type GuideCategoryId = (typeof GUIDE_CATEGORIES)[number]["id"];
export type EventCategoryId = (typeof EVENT_CATEGORIES)[number]["id"];

export function isGuideCategoryId(value: string): value is GuideCategoryId {
  return GUIDE_CATEGORIES.some((c) => c.id === value);
}

export function isEventCategoryId(value: string): value is EventCategoryId {
  return EVENT_CATEGORIES.some((c) => c.id === value);
}

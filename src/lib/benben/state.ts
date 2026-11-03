export type BenbenNeeds = {
  hunger: number;
  shine: number;
  warmth: number;
  rest: number;
};

export type BenbenCareEntry = {
  name: string;
  action: CareAction;
  at: string;
};

export type BenbenState = {
  needs: BenbenNeeds;
  journeyLandscape: number;
  journeyMilestone: number;
  sunbathProgress: number;
  phoenixUntil: string | null;
  lastDecayAt: string;
  careLog: Record<string, { date: string; count: number }>;
  totalCares: number;
  streak: number;
  streakDay: string | null;
  recent: BenbenCareEntry[];
};

export type CareAction = "feed" | "polish" | "sunbathe" | "rest";

export const CARE_ACTIONS: CareAction[] = ["feed", "polish", "sunbathe", "rest"];

export function defaultBenbenState(now = new Date()): BenbenState {
  return {
    needs: { hunger: 70, shine: 70, warmth: 70, rest: 70 },
    journeyLandscape: 0,
    journeyMilestone: 0,
    sunbathProgress: 0,
    phoenixUntil: null,
    lastDecayAt: now.toISOString(),
    careLog: {},
    totalCares: 0,
    streak: 0,
    streakDay: null,
    recent: [],
  };
}

export function normalizeBenbenState(raw: Partial<BenbenState> | null | undefined, now = new Date()): BenbenState {
  const base = defaultBenbenState(now);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    needs: { ...base.needs, ...(raw.needs ?? {}) },
    careLog: raw.careLog ?? {},
    totalCares: raw.totalCares ?? 0,
    streak: raw.streak ?? 0,
    streakDay: raw.streakDay ?? null,
    recent: Array.isArray(raw.recent) ? raw.recent.slice(0, 8) : [],
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function applyHourlyDecay(state: BenbenState, now = new Date()): BenbenState {
  const last = Date.parse(state.lastDecayAt);
  if (!Number.isFinite(last)) return { ...state, lastDecayAt: now.toISOString() };
  const hours = Math.floor((now.getTime() - last) / 3_600_000);
  if (hours <= 0) return state;
  const needs = { ...state.needs };
  for (let i = 0; i < hours; i++) {
    for (const key of Object.keys(needs) as (keyof BenbenNeeds)[]) {
      const faded = needs[key] * 0.95;
      needs[key] = clamp(Math.min(faded, needs[key] - 1));
    }
  }
  const next = {
    ...state,
    needs,
    lastDecayAt: new Date(last + hours * 3_600_000).toISOString(),
  };
  if (next.phoenixUntil && Date.parse(next.phoenixUntil) <= now.getTime()) {
    next.phoenixUntil = null;
  }
  return next;
}

export function utcDayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function careCountToday(state: BenbenState, memberId: string, now = new Date()) {
  const entry = state.careLog[memberId];
  if (!entry || entry.date !== utcDayKey(now)) return 0;
  return entry.count;
}

export function applyCare(
  state: BenbenState,
  memberId: string,
  action: CareAction,
  now = new Date(),
  caretakerName = "Someone",
): { ok: true; state: BenbenState } | { ok: false; reason: string; state: BenbenState } {
  const current = applyHourlyDecay(normalizeBenbenState(state, now), now);
  const count = careCountToday(current, memberId, now);
  if (count >= 3) return { ok: false, reason: "daily_limit", state: current };

  const needs = { ...current.needs };
  if (action === "feed") needs.hunger = clamp(needs.hunger + 18);
  if (action === "polish") needs.shine = clamp(needs.shine + 18);
  if (action === "sunbathe") needs.warmth = clamp(needs.warmth + 18);
  if (action === "rest") needs.rest = clamp(needs.rest + 18);

  let journeyLandscape = current.journeyLandscape;
  let journeyMilestone = current.journeyMilestone + 1;
  if (journeyMilestone >= 5) {
    journeyMilestone = 0;
    journeyLandscape = (journeyLandscape + 1) % 7;
  }

  let sunbathProgress = current.sunbathProgress;
  let phoenixUntil = current.phoenixUntil;
  if (action === "sunbathe") {
    sunbathProgress += 1;
    if (sunbathProgress >= 12) {
      sunbathProgress = 0;
      phoenixUntil = new Date(now.getTime() + 24 * 3_600_000).toISOString();
    }
  }

  const day = utcDayKey(now);
  const yesterday = utcDayKey(new Date(now.getTime() - 86_400_000));
  const streak = current.streakDay === day ? current.streak : current.streakDay === yesterday ? current.streak + 1 : 1;
  return {
    ok: true,
    state: {
      ...current,
      needs,
      journeyLandscape,
      journeyMilestone,
      sunbathProgress,
      phoenixUntil,
      totalCares: current.totalCares + 1,
      streak,
      streakDay: day,
      recent: [{ name: caretakerName, action, at: now.toISOString() }, ...current.recent].slice(0, 8),
      careLog: {
        ...current.careLog,
        [memberId]: { date: day, count: count + 1 },
      },
    },
  };
}

export function publicBenbenView(state: BenbenState, memberId: string | null, now = new Date()) {
  const current = applyHourlyDecay(normalizeBenbenState(state, now), now);
  return {
    needs: current.needs,
    journey: {
      landscape: current.journeyLandscape,
      milestone: current.journeyMilestone,
      landscapes: 7,
      milestonesPerLandscape: 5,
    },
    sunbathProgress: current.sunbathProgress,
    sunbathGoal: 12,
    phoenixActive: Boolean(current.phoenixUntil && Date.parse(current.phoenixUntil) > now.getTime()),
    phoenixUntil: current.phoenixUntil,
    careRemaining: memberId ? Math.max(0, 3 - careCountToday(current, memberId, now)) : 0,
    totalCares: current.totalCares,
    streak: current.streak,
    recent: current.recent,
  };
}

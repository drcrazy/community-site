import type { BenbenBiomeId } from "./world";

export const BENBEN_HUNT_TILE_COUNT = 9;
export const BENBEN_HUNT_MAX_GUESSES = 3;

export const BENBEN_MEMORY_REWARD_POINTS = 10;
export const BENBEN_MEMORY_WALLET_KEY = "benben-memory-wallet-v1";
export const BENBEN_TREASURE_TRAIL_KEY = "benben-treasure-trail-v1";
export const BENBEN_PLAYER_PROGRESS_STORAGE_PREFIX = "benben-player-progress-v1:";
export const BENBEN_COSMETIC_CHANGE_EVENT = "benben-cosmetic-change";
export const BENBEN_MEMORY_SYMBOLS = ["🪷", "🪶", "💎", "🦜", "🪨", "🧊", "🌟"] as const;

export const BENBEN_COSMETICS = [
  { id: "petal-crown", symbol: "🌼", price: 30 },
  { id: "traveler-satchel", symbol: "🎒", price: 50 },
  { id: "stardust-aura", symbol: "✨", price: 80 },
] as const;

export type BenbenCosmeticId = (typeof BENBEN_COSMETICS)[number]["id"];
export type BenbenMemoryWallet = {
  points: number;
  owned: BenbenCosmeticId[];
  equipped: BenbenCosmeticId | null;
  dailyGame: BenbenMemorySession | null;
};
export type BenbenMemoryCard = { pair: number; symbol: (typeof BENBEN_MEMORY_SYMBOLS)[number] };
export type BenbenMemorySession = {
  day: string;
  cards: BenbenMemoryCard[];
  flipped: number[];
  matched: number[];
  moves: number;
  locked: boolean;
  rewarded: boolean;
};

export function isBenbenCosmeticId(value: unknown): value is BenbenCosmeticId {
  return typeof value === "string" && BENBEN_COSMETICS.some((cosmetic) => cosmetic.id === value);
}

function isBenbenMemorySession(value: unknown): value is BenbenMemorySession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<BenbenMemorySession>;
  if (typeof session.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(session.day)) return false;
  if (!Array.isArray(session.cards) || session.cards.length !== BENBEN_MEMORY_SYMBOLS.length * 2) return false;
  const counts = BENBEN_MEMORY_SYMBOLS.map(() => 0);
  for (const card of session.cards) {
    if (!card || !Number.isInteger(card.pair) || card.pair < 0 || card.pair >= BENBEN_MEMORY_SYMBOLS.length) return false;
    if (card.symbol !== BENBEN_MEMORY_SYMBOLS[card.pair]) return false;
    counts[card.pair] += 1;
  }
  if (counts.some((count) => count !== 2)) return false;
  const validIndices = (indices: unknown): indices is number[] => Array.isArray(indices)
    && new Set(indices).size === indices.length
    && indices.every((index) => Number.isInteger(index) && index >= 0 && index < session.cards!.length);
  if (!validIndices(session.flipped) || !validIndices(session.matched)) return false;
  if (session.flipped.length > 2 || session.matched.length % 2 !== 0) return false;
  if (!Number.isSafeInteger(session.moves) || session.moves! < 0 || typeof session.locked !== "boolean" || typeof session.rewarded !== "boolean") return false;
  const matchedCounts = new Map<number, number>();
  for (const index of session.matched) {
    const pair = session.cards[index].pair;
    matchedCounts.set(pair, (matchedCounts.get(pair) ?? 0) + 1);
  }
  if ([...matchedCounts.values()].some((count) => count !== 2)) return false;
  if (session.locked && (session.flipped.length !== 2 || session.cards[session.flipped[0]].pair === session.cards[session.flipped[1]].pair)) return false;
  if (!session.locked && session.flipped.length > 1) return false;
  if (session.flipped.some((index) => session.matched!.includes(index))) return false;
  if (session.rewarded && session.matched.length !== session.cards.length) return false;
  return true;
}

export function makeBenbenMemoryWallet(value?: unknown): BenbenMemoryWallet {
  if (!value || typeof value !== "object") return { points: 0, owned: [], equipped: null, dailyGame: null };
  const record = value as { points?: unknown; owned?: unknown; equipped?: unknown; dailyGame?: unknown };
  const points = typeof record.points === "number" && Number.isSafeInteger(record.points) && record.points >= 0
    ? record.points
    : 0;
  const owned = Array.isArray(record.owned)
    ? [...new Set(record.owned.filter(isBenbenCosmeticId))]
    : [];
  const equipped = isBenbenCosmeticId(record.equipped) && owned.includes(record.equipped)
    ? record.equipped
    : null;
  const dailyGame = isBenbenMemorySession(record.dailyGame) ? record.dailyGame : null;
  return { points, owned, equipped, dailyGame };
}

export function awardBenbenMemoryPoints(wallet: BenbenMemoryWallet): BenbenMemoryWallet {
  const game = wallet.dailyGame;
  if (!game || game.rewarded || game.matched.length !== game.cards.length) return wallet;
  return {
    ...wallet,
    points: Math.min(Number.MAX_SAFE_INTEGER, wallet.points + BENBEN_MEMORY_REWARD_POINTS),
    dailyGame: { ...game, rewarded: true },
  };
}

export function buyBenbenCosmetic(wallet: BenbenMemoryWallet, id: BenbenCosmeticId): BenbenMemoryWallet {
  const cosmetic = BENBEN_COSMETICS.find((item) => item.id === id);
  if (!cosmetic || wallet.owned.includes(id) || wallet.points < cosmetic.price) return wallet;
  return { ...wallet, points: wallet.points - cosmetic.price, owned: [...wallet.owned, id], equipped: id };
}

export function equipBenbenCosmetic(wallet: BenbenMemoryWallet, id: BenbenCosmeticId | null): BenbenMemoryWallet {
  if (id !== null && !wallet.owned.includes(id)) return wallet;
  return { ...wallet, equipped: id };
}

export function makeBenbenMemoryBoard(random: () => number = Math.random): BenbenMemoryCard[] {
  const cards = BENBEN_MEMORY_SYMBOLS.flatMap((symbol, pair) => [{ pair, symbol }, { pair, symbol }]);
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  return cards;
}

export function startBenbenMemoryGame(wallet: BenbenMemoryWallet, day: string, random: () => number = Math.random): BenbenMemoryWallet {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || wallet.dailyGame?.day === day) return wallet;
  return {
    ...wallet,
    dailyGame: { day, cards: makeBenbenMemoryBoard(random), flipped: [], matched: [], moves: 0, locked: false, rewarded: false },
  };
}

export function flipBenbenMemoryCard(wallet: BenbenMemoryWallet, index: number): BenbenMemoryWallet {
  const game = wallet.dailyGame;
  if (!game || game.locked || game.matched.length === game.cards.length
    || !Number.isInteger(index) || index < 0 || index >= game.cards.length
    || game.matched.includes(index) || game.flipped.includes(index)) return wallet;

  const flipped = [...game.flipped, index];
  if (flipped.length === 1) return { ...wallet, dailyGame: { ...game, flipped } };

  const [first, second] = flipped;
  if (game.cards[first].pair === game.cards[second].pair) {
    return {
      ...wallet,
      dailyGame: { ...game, flipped: [], matched: [...game.matched, first, second], moves: game.moves + 1 },
    };
  }
  return { ...wallet, dailyGame: { ...game, flipped, moves: game.moves + 1, locked: true } };
}

export function hideBenbenMemoryMismatch(wallet: BenbenMemoryWallet): BenbenMemoryWallet {
  const game = wallet.dailyGame;
  if (!game?.locked) return wallet;
  return { ...wallet, dailyGame: { ...game, flipped: [], locked: false } };
}

export function isBenbenMemoryMatch(cards: BenbenMemoryCard[], first: number, second: number): boolean {
  return first !== second && cards[first] !== undefined && cards[second] !== undefined && cards[first].pair === cards[second].pair;
}

export type BenbenHuntProgress = {
  guesses: number[];
  found: boolean;
  finished: boolean;
};

export type BenbenSavedGames = {
  day: string;
  hunts: Partial<Record<BenbenBiomeId, BenbenHuntProgress>>;
  souvenirs: BenbenBiomeId[];
};

export type BenbenPlayerProgress = {
  memoryWallet: BenbenMemoryWallet;
  treasureHunt: BenbenSavedGames;
};

export function isBenbenBiomeId(value: unknown): value is BenbenBiomeId {
  return value === "oasis" || value === "mountains" || value === "desert"
    || value === "jungle" || value === "volcano" || value === "ice" || value === "star-sea";
}

export function isBenbenHuntProgress(value: unknown): value is BenbenHuntProgress {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<BenbenHuntProgress>;
  return Array.isArray(record.guesses)
    && record.guesses.every((guess) => Number.isInteger(guess) && guess >= 0 && guess < BENBEN_HUNT_TILE_COUNT)
    && new Set(record.guesses).size === record.guesses.length
    && typeof record.found === "boolean"
    && typeof record.finished === "boolean"
    && (!record.found || record.finished)
    && (record.found || !record.finished || record.guesses.length >= BENBEN_HUNT_MAX_GUESSES);
}

export function makeBenbenSavedGames(value: unknown, day: string): BenbenSavedGames {
  if (!value || typeof value !== "object") return { day, hunts: {}, souvenirs: [] };
  const record = value as { day?: unknown; hunts?: unknown; souvenirs?: unknown };
  const souvenirs = Array.isArray(record.souvenirs) ? [...new Set(record.souvenirs.filter(isBenbenBiomeId))] : [];
  const hunts: BenbenSavedGames["hunts"] = {};
  if (record.day === day && record.hunts && typeof record.hunts === "object") {
    for (const [biome, progress] of Object.entries(record.hunts)) {
      if (isBenbenBiomeId(biome) && isBenbenHuntProgress(progress)) hunts[biome] = progress;
    }
  }
  return { day, hunts, souvenirs };
}

export function makeBenbenPlayerProgress(value: unknown, day: string): BenbenPlayerProgress {
  if (!value || typeof value !== "object") {
    return { memoryWallet: makeBenbenMemoryWallet(), treasureHunt: makeBenbenSavedGames(null, day) };
  }
  const record = value as { memoryWallet?: unknown; treasureHunt?: unknown };
  return {
    memoryWallet: makeBenbenMemoryWallet(record.memoryWallet),
    treasureHunt: makeBenbenSavedGames(record.treasureHunt, day),
  };
}

/** Keep legacy browser rewards when the first account sync imports them. */
export function mergeBenbenPlayerProgress(
  preferred: BenbenPlayerProgress,
  incoming: BenbenPlayerProgress,
  day: string,
): BenbenPlayerProgress {
  const primary = makeBenbenPlayerProgress(preferred, day);
  const secondary = makeBenbenPlayerProgress(incoming, day);
  const owned = [...new Set([...primary.memoryWallet.owned, ...secondary.memoryWallet.owned])];
  const equipped = primary.memoryWallet.equipped && owned.includes(primary.memoryWallet.equipped)
    ? primary.memoryWallet.equipped
    : secondary.memoryWallet.equipped && owned.includes(secondary.memoryWallet.equipped)
      ? secondary.memoryWallet.equipped
      : null;
  const primaryGame = primary.memoryWallet.dailyGame?.day === day ? primary.memoryWallet.dailyGame : null;
  const secondaryGame = secondary.memoryWallet.dailyGame?.day === day ? secondary.memoryWallet.dailyGame : null;
  const dailyGame = primaryGame?.day === day
    ? primaryGame.matched.length >= (secondaryGame?.day === day ? secondaryGame.matched.length : -1) ? primaryGame : secondaryGame
    : secondaryGame?.day === day ? secondaryGame : primaryGame;
  const souvenirs = [...new Set([...primary.treasureHunt.souvenirs, ...secondary.treasureHunt.souvenirs])];
  const hunts: BenbenSavedGames["hunts"] = {};
  const biomes: BenbenBiomeId[] = ["oasis", "mountains", "desert", "jungle", "volcano", "ice", "star-sea"];
  for (const biome of biomes) {
    const first = primary.treasureHunt.hunts[biome];
    const second = secondary.treasureHunt.hunts[biome];
    const score = (progress: BenbenHuntProgress | undefined) => !progress ? -1
      : progress.found ? 100 : progress.finished ? 50 + progress.guesses.length : progress.guesses.length;
    const selected = score(first) >= score(second) ? first : second;
    if (selected) hunts[biome] = selected;
  }
  return {
    memoryWallet: {
      points: Math.max(primary.memoryWallet.points, secondary.memoryWallet.points),
      owned,
      equipped,
      dailyGame,
    },
    treasureHunt: { day, hunts, souvenirs },
  };
}

export function getDailyTreasureTarget(day: string, biome: BenbenBiomeId): number {
  const key = `${day}:${biome}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
  }
  return (hash >>> 0) % BENBEN_HUNT_TILE_COUNT;
}

export function makeBenbenHuntProgress(): BenbenHuntProgress {
  return { guesses: [], found: false, finished: false };
}

export function revealTreasureTile(
  progress: BenbenHuntProgress,
  tile: number,
  target: number,
): BenbenHuntProgress {
  if (
    progress.finished
    || !Number.isInteger(tile)
    || tile < 0
    || tile >= BENBEN_HUNT_TILE_COUNT
    || progress.guesses.includes(tile)
  ) return progress;

  const guesses = [...progress.guesses, tile];
  const found = tile === target;
  return { guesses, found, finished: found || guesses.length >= BENBEN_HUNT_MAX_GUESSES };
}



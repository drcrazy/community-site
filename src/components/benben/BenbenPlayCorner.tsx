import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  BENBEN_COSMETICS,
  BENBEN_COSMETIC_CHANGE_EVENT,
  BENBEN_HUNT_MAX_GUESSES,
  BENBEN_MEMORY_REWARD_POINTS,
  BENBEN_MEMORY_WALLET_KEY,
  BENBEN_PLAYER_PROGRESS_STORAGE_PREFIX,
  BENBEN_TREASURE_TRAIL_KEY,
  awardBenbenMemoryPoints,
  buyBenbenCosmetic,
  equipBenbenCosmetic,
  flipBenbenMemoryCard,
  getDailyTreasureTarget,
  hideBenbenMemoryMismatch,
  makeBenbenHuntProgress,
  makeBenbenPlayerProgress,
  makeBenbenSavedGames,
  mergeBenbenPlayerProgress,
  revealTreasureTile,
  startBenbenMemoryGame,
  type BenbenCosmeticId,
  type BenbenMemoryWallet,
  type BenbenPlayerProgress,
  type BenbenSavedGames,
} from "../../lib/benben/play";
import type { BenbenBiomeId } from "../../lib/benben/world";
import { getBenbenUi } from "../../lib/benben/ui";
import { fillBenben } from "./labels";
import type { Locale } from "../../lib/i18n/locales";
import styles from "./benben.module.css";

type PlayableLandscape = { id: BenbenBiomeId; name: string; icon: string; state: "complete" | "current" | "locked" };
type StoredProgress = { version: 1; progress: BenbenPlayerProgress };

const SOUVENIR_ICONS: Record<BenbenBiomeId, string> = {
  oasis: "🪷",
  mountains: "🪶",
  desert: "🪷",
  jungle: "🦜",
  volcano: "🪨",
  ice: "🧊",
  "star-sea": "🌟",
};

function localDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function accountKey(memberId: string) {
  return `${BENBEN_PLAYER_PROGRESS_STORAGE_PREFIX}${memberId}`;
}

function readLegacy(day: string): BenbenPlayerProgress {
  return makeBenbenPlayerProgress(
    { memoryWallet: readJson(BENBEN_MEMORY_WALLET_KEY), treasureHunt: readJson(BENBEN_TREASURE_TRAIL_KEY) },
    day,
  );
}

function readProgress(memberId: string | null, day: string): BenbenPlayerProgress {
  if (!memberId) return readLegacy(day);
  const stored = readJson(accountKey(memberId)) as Partial<StoredProgress> | null;
  const account = stored?.version === 1
    ? makeBenbenPlayerProgress(stored.progress, day)
    : makeBenbenPlayerProgress(null, day);
  const legacy = readLegacy(day);
  return mergeBenbenPlayerProgress(account, legacy, day);
}

function writeProgress(progress: BenbenPlayerProgress, memberId: string | null) {
  try {
    if (memberId) {
      window.localStorage.setItem(accountKey(memberId), JSON.stringify({ version: 1, progress } satisfies StoredProgress));
      return;
    }
    window.localStorage.setItem(BENBEN_MEMORY_WALLET_KEY, JSON.stringify(progress.memoryWallet));
    window.localStorage.setItem(BENBEN_TREASURE_TRAIL_KEY, JSON.stringify(progress.treasureHunt));
  } catch {
    /* The page stays usable if browser storage is blocked. */
  }
}

export function BenbenPlayCorner({
  landscapes,
  currentBiome,
  locale,
  memberId,
}: {
  landscapes: PlayableLandscape[];
  currentBiome: BenbenBiomeId;
  locale: Locale;
  memberId: string | null;
}) {
  const copy = getBenbenUi(locale);
  const [selectedBiome, setSelectedBiome] = useState(currentBiome);
  const [today, setToday] = useState("");
  const [saved, setSaved] = useState<BenbenSavedGames | null>(null);
  const [memoryWallet, setMemoryWallet] = useState<BenbenMemoryWallet>(() => makeBenbenPlayerProgress(null, "1970-01-01").memoryWallet);
  const [ready, setReady] = useState(false);
  const memoryTimer = useRef<number | null>(null);
  const memoryWalletRef = useRef(memoryWallet);
  const savedRef = useRef<BenbenSavedGames | null>(saved);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const available = useMemo(() => landscapes.filter((place) => place.state !== "locked"), [landscapes]);
  const resolvedBiome = available.some((place) => place.id === selectedBiome) ? selectedBiome : currentBiome;
  const selectedLandscape = available.find((place) => place.id === resolvedBiome) ?? available[0];
  const currentSave = makeBenbenSavedGames(saved, today);
  const biomeId = selectedLandscape?.id ?? currentBiome;
  const progress = currentSave.hunts[biomeId] ?? makeBenbenHuntProgress();
  const target = today ? getDailyTreasureTarget(today, biomeId) : -1;
  const attemptsLeft = Math.max(0, BENBEN_HUNT_MAX_GUESSES - progress.guesses.length);
  const memoryGame = memoryWallet.dailyGame?.day === today ? memoryWallet.dailyGame : null;
  const memoryCards = memoryGame?.cards ?? [];
  const memoryFlipped = memoryGame?.flipped ?? [];
  const memoryMatched = memoryGame?.matched ?? [];
  const memoryMoves = memoryGame?.moves ?? 0;
  const memoryComplete = Boolean(memoryGame && memoryMatched.length === memoryCards.length && memoryCards.length > 0);
  const huntCollapsed = progress.finished;
  const nextLandscape = available.find((place) => place.id !== selectedLandscape?.id && !currentSave.hunts[place.id]?.finished);

  const commit = useCallback((wallet: BenbenMemoryWallet, treasureHunt: BenbenSavedGames, cosmeticChanged = false) => {
    const next = makeBenbenPlayerProgress({ memoryWallet: wallet, treasureHunt }, today || localDay());
    memoryWalletRef.current = next.memoryWallet;
    savedRef.current = next.treasureHunt;
    setMemoryWallet(next.memoryWallet);
    setSaved(next.treasureHunt);
    writeProgress(next, memberId);
    if (cosmeticChanged) {
      window.dispatchEvent(new CustomEvent(BENBEN_COSMETIC_CHANGE_EVENT, { detail: next.memoryWallet.equipped }));
    }
  }, [memberId, today]);

  useEffect(() => {
    const day = localDay();
    const loaded = readProgress(memberId, day);
    memoryWalletRef.current = loaded.memoryWallet;
    savedRef.current = loaded.treasureHunt;
    setToday(day);
    setMemoryWallet(loaded.memoryWallet);
    setSaved(loaded.treasureHunt);
    setReady(true);
    if (memberId) writeProgress(loaded, memberId);
    const timer = window.setInterval(() => setToday(localDay()), 60_000);
    return () => window.clearInterval(timer);
  }, [memberId]);

  useEffect(() => () => {
    if (memoryTimer.current !== null) window.clearTimeout(memoryTimer.current);
  }, []);

  const saveWallet = useCallback((wallet: BenbenMemoryWallet, cosmeticChanged = false) => {
    commit(wallet, savedRef.current ?? makeBenbenSavedGames(null, today || localDay()), cosmeticChanged);
  }, [commit, today]);

  const guess = (tile: number) => {
    const nextProgress = revealTreasureTile(progress, tile, target);
    if (nextProgress === progress || !today || !ready) return;
    const souvenirs = nextProgress.found ? [...new Set([...currentSave.souvenirs, biomeId])] : currentSave.souvenirs;
    commit(memoryWalletRef.current, { day: today, hunts: { ...currentSave.hunts, [biomeId]: nextProgress }, souvenirs });
  };

  useEffect(() => {
    if (!today || !memoryGame?.locked) return;
    memoryTimer.current = window.setTimeout(() => {
      saveWallet(hideBenbenMemoryMismatch(memoryWalletRef.current));
      memoryTimer.current = null;
    }, 750);
    return () => {
      if (memoryTimer.current !== null) window.clearTimeout(memoryTimer.current);
      memoryTimer.current = null;
    };
  }, [today, memoryGame?.locked, saveWallet]);

  const startMemory = () => {
    if (!ready || !today) return;
    if (!memoryGame) {
      saveWallet(startBenbenMemoryGame(memoryWallet, today));
      return;
    }
    boardRef.current?.focus();
    boardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const flipCard = (index: number) => {
    if (!ready || !memoryGame || memoryGame.locked) return;
    const nextWallet = flipBenbenMemoryCard(memoryWallet, index);
    if (nextWallet === memoryWallet) return;
    const completed = Boolean(nextWallet.dailyGame && nextWallet.dailyGame.matched.length === nextWallet.dailyGame.cards.length);
    saveWallet(completed ? awardBenbenMemoryPoints(nextWallet) : nextWallet);
  };

  const purchase = (id: BenbenCosmeticId) => {
    const nextWallet = buyBenbenCosmetic(memoryWallet, id);
    if (nextWallet !== memoryWallet) saveWallet(nextWallet, true);
  };

  const toggle = (id: BenbenCosmeticId) => {
    const nextWallet = equipBenbenCosmetic(memoryWallet, memoryWallet.equipped === id ? null : id);
    if (nextWallet !== memoryWallet) saveWallet(nextWallet, true);
  };

  const result = progress.found
    ? copy.huntFound
    : progress.finished
      ? copy.huntMissLast
      : progress.guesses.length > 0
        ? copy.huntMiss
        : copy.huntInstructions;

  return (
    <section class={styles.playCard} aria-labelledby="benben-play-title" aria-busy={!ready}>
      <div class={styles.playIntro}>
        <span class={styles.playIcon} aria-hidden="true">🧭</span>
        <div>
          <span class={styles.eyebrow}>{copy.playDaily}</span>
          <h2 id="benben-play-title">{copy.playTitle}</h2>
          {!huntCollapsed && <p>{copy.playLede}</p>}
        </div>
      </div>
      <div class={styles.playBody} data-hunt-complete={huntCollapsed || undefined}>
        {huntCollapsed ? (
          <div class={styles.huntDone} role="status" aria-live="polite">
            <strong><span aria-hidden="true">✓</span>{copy.huntPlayedToday}</strong>
            {nextLandscape && <button type="button" onClick={() => setSelectedBiome(nextLandscape.id)} disabled={!ready}>{copy.huntNextLandscape}</button>}
          </div>
        ) : (
          <div class={styles.huntBoard}>
            <label class={styles.landscapeSelect}>
              <span>{copy.playLandscape}</span>
              <select value={biomeId} onChange={(event) => setSelectedBiome((event.currentTarget as HTMLSelectElement).value as BenbenBiomeId)} disabled={!ready}>
                {available.filter((place) => place.id === biomeId || !currentSave.hunts[place.id]?.finished).map((place) => (
                  <option value={place.id} key={place.id}>{place.icon} {place.name}</option>
                ))}
              </select>
            </label>
            <div class={styles.treasureGrid} role="group" aria-label={copy.playTitle}>
              {Array.from({ length: 9 }, (_, tile) => {
                const guessed = progress.guesses.includes(tile);
                const found = guessed && progress.found && tile === target;
                return (
                  <button
                    type="button"
                    class={styles.treasureTile}
                    key={tile}
                    onClick={() => guess(tile)}
                    disabled={!ready || !today || !saved || progress.finished || guessed}
                    data-found={found || undefined}
                    data-missed={(guessed && !found) || undefined}
                    aria-label={fillBenben(copy.huntTile, { count: tile + 1 })}
                  >
                    {found ? SOUVENIR_ICONS[biomeId] : guessed ? "🌱" : "✧"}
                  </button>
                );
              })}
            </div>
            <div class={styles.huntStatus} role="status" aria-live="polite">
              <strong>{today && saved ? result : copy.huntInstructions}</strong>
              {!progress.finished && <span>{fillBenben(copy.huntAttempts, { count: attemptsLeft })}</span>}
            </div>
          </div>
        )}
        <div class={styles.souvenirPanel}>
          <div class={styles.souvenirHeading}>
            <strong>{copy.souvenirCollection}</strong>
            <span>{fillBenben(copy.souvenirCount, { count: currentSave.souvenirs.length })}</span>
          </div>
          <div class={styles.souvenirList} aria-label={copy.souvenirCollection}>
            {landscapes.map((place) => {
              const collected = currentSave.souvenirs.includes(place.id);
              return (
                <span class={styles.souvenir} data-collected={collected || undefined} key={place.id} title={place.name}>
                  {collected ? SOUVENIR_ICONS[place.id] : "·"}
                </span>
              );
            })}
          </div>
          <p class={styles.huntLocalNote}>{copy.huntLocalNote}</p>
        </div>
      </div>

      <div class={styles.memoryGame} aria-labelledby="benben-memory-title">
        <div class={`${styles.memoryShowcase}${memoryComplete ? ` ${styles.memoryCompleteShowcase}` : ""}`}>
          <div class={styles.memoryHeading}>
            <span class={styles.memoryBadge} aria-hidden="true">🪨</span>
            <div class={styles.memoryIntroText}>
              <span class={styles.memoryEyebrow}>{copy.memoryEyebrow}</span>
              <h3 id="benben-memory-title">{copy.memoryTitle}</h3>
              {!memoryComplete && (
                <>
                  <p>{copy.memoryLede}</p>
                  <span class={styles.memoryRewardCallout}>✦ {fillBenben(copy.memoryRewardCallout, { count: BENBEN_MEMORY_REWARD_POINTS })}</span>
                  <span class={styles.memoryDailyHint}>{copy.memoryDailyLimit}</span>
                </>
              )}
              {memoryComplete && <span class={styles.memoryDone} role="status"><span aria-hidden="true">✓</span>{copy.memoryPlayedToday}</span>}
            </div>
            <div class={styles.memoryLaunch}>
              <span class={styles.memoryBalance}><span aria-hidden="true">✦</span><strong>{memoryWallet.points}</strong><small>{copy.memoryPoints}</small></span>
              {!memoryComplete && (
                <button type="button" class={styles.memoryStart} onClick={startMemory} disabled={!ready || !today}>
                  {memoryGame ? copy.memoryContinue : copy.memoryStart}
                </button>
              )}
            </div>
          </div>
        </div>
        {memoryGame && !memoryComplete && (
          <>
            <div class={styles.memoryBoard} role="group" aria-label={copy.memoryTitle} tabIndex={-1} ref={boardRef}>
              {memoryCards.map((card, index) => {
                const visible = memoryFlipped.includes(index) || memoryMatched.includes(index);
                const matched = memoryMatched.includes(index);
                return (
                  <button
                    type="button"
                    class={styles.memoryCard}
                    key={index}
                    onClick={() => flipCard(index)}
                    disabled={!ready || memoryGame.locked || matched || memoryComplete}
                    aria-pressed={visible}
                    data-matched={matched || undefined}
                  >
                    {visible ? card.symbol : "✧"}
                  </button>
                );
              })}
            </div>
            <p class={styles.memoryStatus} role="status" aria-live="polite">
              {memoryComplete
                ? fillBenben(copy.memoryComplete, { count: memoryMoves, points: BENBEN_MEMORY_REWARD_POINTS })
                : fillBenben(copy.memoryMoves, { count: memoryMoves })}
            </p>
          </>
        )}
        <div class={styles.memoryShop} aria-labelledby="benben-shop-title">
          <div class={styles.memoryShopHeading}>
            <div><span class={styles.memoryShopEyebrow}>{copy.memoryShopEyebrow}</span><h4 id="benben-shop-title">{copy.memoryShopTitle}</h4></div>
            <span class={styles.memoryShopBalance}>✦ {memoryWallet.points} {copy.memoryPoints}</span>
          </div>
          <div class={styles.cosmeticGrid}>
            {BENBEN_COSMETICS.map((cosmetic) => {
              const owned = memoryWallet.owned.includes(cosmetic.id);
              const equipped = memoryWallet.equipped === cosmetic.id;
              const cosmeticCopy = copy.cosmetics[cosmetic.id];
              return (
                <article class={styles.cosmeticItem} key={cosmetic.id} data-equipped={equipped || undefined}>
                  <span class={styles.cosmeticIcon} aria-hidden="true">{cosmetic.symbol}</span>
                  <div class={styles.cosmeticDetails}><strong>{cosmeticCopy.name}</strong><span>{cosmeticCopy.description}</span></div>
                  {owned ? (
                    <button type="button" class={styles.cosmeticAction} data-worn={equipped || undefined} disabled={!ready} onClick={() => toggle(cosmetic.id)}>
                      {equipped ? copy.cosmeticRemove : copy.cosmeticEquip}
                    </button>
                  ) : (
                    <button type="button" class={styles.cosmeticAction} disabled={!ready || memoryWallet.points < cosmetic.price} onClick={() => purchase(cosmetic.id)}>
                      {fillBenben(copy.cosmeticBuy, { count: cosmetic.price })}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
        <p class={styles.memoryNote}>{copy.memoryLocalNote}</p>
        <div class={styles.progressNotice} data-status="local" role="status">
          <span aria-hidden="true">🔒</span>
          <span>{copy.progressLocal}</span>
        </div>
      </div>
    </section>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { BENBEN_COSMETICS, BENBEN_COSMETIC_CHANGE_EVENT, BENBEN_MEMORY_WALLET_KEY, BENBEN_PLAYER_PROGRESS_STORAGE_PREFIX, isBenbenCosmeticId, makeBenbenMemoryWallet, type BenbenCosmeticId } from "../../lib/benben/play";
import { getBenbenUi } from "../../lib/benben/ui";
import { BENBEN_WORLD_TOTAL_MILESTONES, getBenbenJourneyView, type BenbenBiomeId } from "../../lib/benben/world";
import type { Locale } from "../../lib/i18n/locales";
import { BenbenPlayCorner } from "./BenbenPlayCorner";
import { BenbenWorld } from "./BenbenWorld";
import { benbenLabels, fillBenben } from "./labels";
import styles from "./benben.module.css";

type UiAction = "feed" | "polish" | "play" | "rest";
type ApiAction = "feed" | "polish" | "sunbathe" | "rest";
type IdleMotion = "blink" | "bounce" | "curious" | "lean" | "lookLeft" | "lookRight" | "wiggle" | "sparkle";
type View = {
  needs: { hunger: number; shine: number; warmth: number; rest: number };
  journey: { landscape: number; milestone: number };
  phoenixActive: boolean;
  careRemaining: number;
  totalCares: number;
  streak: number;
  recent: Array<{ name: string; action: ApiAction; at: string }>;
};

const ICON: Record<UiAction, string> = { feed: "🍇", polish: "✨", play: "☀️", rest: "🌙" };
const ACTION_MS = 1100;

function toUiAction(action: ApiAction): UiAction {
  return action === "sunbathe" ? "play" : action;
}

function welcomeLine(copy: ReturnType<typeof getBenbenUi>, acting: UiAction | null) {
  return acting ? copy.actionEffects[acting] : copy.welcomeLine;
}

export function BenbenPage({
  locale,
  signedIn,
  signInHref,
  memberId,
}: {
  locale: Locale;
  signedIn: boolean;
  signInHref: string;
  memberId: string | null;
}) {
  const copy = getBenbenUi(locale);
  const labels = benbenLabels(locale);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const timeFormat = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), [locale]);
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<UiAction | null>(null);
  const [copied, setCopied] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [idleMotion, setIdleMotion] = useState<IdleMotion | null>(null);
  const [petPat, setPetPat] = useState(false);
  const [equipped, setEquipped] = useState<BenbenCosmeticId | null>(null);
  const [hoveredBiome, setHoveredBiome] = useState<BenbenBiomeId | null>(null);
  const [pinnedBiome, setPinnedBiome] = useState<BenbenBiomeId | null>(null);
  const happyTimer = useRef<number | null>(null);
  const actionTimer = useRef<number | null>(null);
  const patTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/benben/state/");
    if (!res.ok) {
      setError(labels.unavailable);
      return;
    }
    setView((await res.json()) as View);
    setError("");
  }, [labels.unavailable]);

  useEffect(() => {
    const key = memberId ? `${BENBEN_PLAYER_PROGRESS_STORAGE_PREFIX}${memberId}` : BENBEN_MEMORY_WALLET_KEY;
    const apply = (value: unknown) => {
      const wallet = memberId && value && typeof value === "object" && "progress" in value
        ? makeBenbenMemoryWallet((value as { progress?: { memoryWallet?: unknown } }).progress?.memoryWallet)
        : makeBenbenMemoryWallet(value);
      setEquipped(wallet.equipped);
    };
    try {
      apply(JSON.parse(window.localStorage.getItem(key) ?? "null"));
    } catch {
      apply(null);
    }
    const onChange = (event: Event) => {
      const value = (event as CustomEvent<unknown>).detail;
      setEquipped(isBenbenCosmeticId(value) ? value : null);
    };
    window.addEventListener(BENBEN_COSMETIC_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(BENBEN_COSMETIC_CHANGE_EVENT, onChange);
  }, [memberId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => () => {
    if (happyTimer.current !== null) window.clearTimeout(happyTimer.current);
    if (actionTimer.current !== null) window.clearTimeout(actionTimer.current);
    if (patTimer.current !== null) window.clearTimeout(patTimer.current);
  }, []);

  useEffect(() => {
    if (acting || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const motions: IdleMotion[] = ["blink", "bounce", "curious", "lean", "lookLeft", "lookRight", "wiggle", "sparkle"];
    let nextTimer = 0;
    let clearTimer = 0;
    const schedule = () => {
      nextTimer = window.setTimeout(() => {
        setIdleMotion(motions[Math.floor(Math.random() * motions.length)]);
        clearTimer = window.setTimeout(() => {
          setIdleMotion(null);
          schedule();
        }, 1300);
      }, 2200 + Math.random() * 4200);
    };
    schedule();
    return () => {
      window.clearTimeout(nextTimer);
      window.clearTimeout(clearTimer);
    };
  }, [acting]);

  const finishAction = (delay: number) => {
    if (actionTimer.current !== null) window.clearTimeout(actionTimer.current);
    actionTimer.current = window.setTimeout(() => {
      setActing(null);
      if (happyTimer.current !== null) window.clearTimeout(happyTimer.current);
      setCelebrating(true);
      happyTimer.current = window.setTimeout(() => setCelebrating(false), 2600);
    }, delay);
  };

  const pat = () => {
    if (acting) return;
    const motions: IdleMotion[] = ["bounce", "curious", "lean", "wiggle", "sparkle"];
    setIdleMotion(motions[Math.floor(Math.random() * motions.length)]);
    setPetPat(true);
    if (patTimer.current !== null) window.clearTimeout(patTimer.current);
    patTimer.current = window.setTimeout(() => setPetPat(false), 1800);
  };

  const care = async (action: UiAction) => {
    if (!signedIn) {
      window.location.assign(signInHref);
      return;
    }
    if (!view || acting || view.careRemaining <= 0) return;
    const delay = action === "rest" ? 2600 : action === "play" ? 2400 : ACTION_MS;
    setIdleMotion(null);
    setActing(action);
    const res = await fetch("/api/benben/care/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: action === "play" ? "sunbathe" : action }),
    });
    const payload = (await res.json()) as View & { code?: string; message?: string };
    if (!res.ok) {
      setError(payload.code === "daily_limit" || payload.message?.includes("Daily care limit") ? labels.noActions : payload.message || labels.unavailable);
      setActing(null);
      return;
    }
    setView(payload);
    setError("");
    finishAction(delay);
  };

  const fed = view?.needs.hunger ?? 0;
  const happy = view?.needs.warmth ?? 0;
  const polished = view?.needs.shine ?? 0;
  const rested = view?.needs.rest ?? 0;
  const average = view ? Math.round((fed + happy + polished + rested) / 4) : 0;
  const moodKey = average >= 85 ? "radiant" : average >= 65 ? "content" : average >= 40 ? "worried" : "gloomy";
  const moodFace = moodKey === "radiant" ? "◕ᴗ◕" : moodKey === "content" ? "◕‿◕" : moodKey === "worried" ? "◕﹏◕" : "◕︵◕";
  const mood = copy.mood[moodKey];
  const stats = view ? [
    { action: "feed" as const, label: labels.fed, value: fed, icon: "🍇", tone: "berry" },
    { action: "play" as const, label: labels.happy, value: happy, icon: "💛", tone: "sun" },
    { action: "polish" as const, label: labels.polished, value: polished, icon: "✨", tone: "shine" },
    { action: "rest" as const, label: labels.rested, value: rested, icon: "🌙", tone: "moon" },
  ] : [];
  const suggestion = stats.reduce<(typeof stats)[number] | null>((lowest, stat) => (!lowest || stat.value < lowest.value ? stat : lowest), null);
  const growth = getBenbenJourneyView(view?.journey.landscape ?? 0, view?.journey.milestone ?? 0, locale);
  const scenePreview = growth.route.find((place) => place.id === hoveredBiome && place.state === "complete")
    ?? growth.route.find((place) => place.id === pinnedBiome && place.state === "complete")
    ?? null;
  const sceneBiome = scenePreview?.id ?? growth.biomeId;
  const sceneLandmarks = scenePreview?.landmarks ?? growth.landmarks;
  const sceneStage = scenePreview?.landmarks.length ?? growth.stage;
  const actionsUsed = view && signedIn ? Math.max(0, 3 - view.careRemaining) : 0;
  const actions = [
    ["feed", labels.feed],
    ["polish", labels.polish],
    ["play", labels.play],
    ["rest", labels.rest],
  ] as const;
  const petSrc = acting === "feed" ? "/benben.webp" : acting === "rest" ? "/benben-sleeping.webp" : "/benben-calm.png";
  const blocked = Boolean(acting) || Boolean(signedIn && view && view.careRemaining <= 0);

  const share = async () => {
    if (!view) return;
    const text = [
      `Benben — ${mood} 🪨`,
      `🍇 ${labels.fed}: ${fed}% · ✨ ${labels.polished}: ${polished}%`,
      `💛 ${labels.happy}: ${happy}% · 🌙 ${labels.rested}: ${rested}%`,
      `🔥 ${view.streak} ${labels.streak} · ${numberFormat.format(view.totalCares)} ${labels.careCount}`,
      ...(view.phoenixActive ? [`🔥🐦 ${labels.phoenixVisit}`] : []),
      window.location.href,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div class={styles.page}>
      <div class={styles.dashboard}>
        <div class={styles.communityBar}>
          <span class={styles.communityIcon} aria-hidden="true">✦</span>
          <div class={styles.communityIntro}>
            <strong>{copy.communitySpace}</strong>
            <span>{copy.welcomeLine}</span>
          </div>
          <div class={styles.sharedStatus}>
            <span class={styles.statusLive} aria-hidden="true" />
            <span>{copy.liveShared}</span>
          </div>
        </div>

        <div class={styles.stage} data-mood={moodKey}>
          <section class={styles.scene} data-biome={sceneBiome} data-stage={sceneStage} aria-label={`${copy.routeLabel}: ${scenePreview?.name ?? growth.biomeName}`}>
            <BenbenWorld key={sceneBiome} biome={sceneBiome} landmarks={sceneLandmarks} />
            <div class={styles.sceneSun} aria-hidden="true" />
            <div class={styles.sceneOrbit} aria-hidden="true"><span /><span /><span /></div>
            <div class={styles.fireflies} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <div class={styles.sceneGround} aria-hidden="true" />
            <div class={styles.sceneHeading}>
              <span class={styles.sceneTag}>
                <span class={styles.sceneTagIcon}>{scenePreview?.icon ?? growth.biomeIcon}</span>
                {scenePreview?.name ?? growth.biomeName}
                {scenePreview && <small>{copy.scenePreview}</small>}
              </span>
              {scenePreview && (
                <button type="button" class={styles.returnSceneButton} onClick={() => { setHoveredBiome(null); setPinnedBiome(null); }}>
                  {copy.backToCurrent}
                </button>
              )}
              <span class={styles.moodPill}><span>{moodFace}</span>{mood}</span>
            </div>
            <div class={styles.petStage} data-action={acting ?? "idle"} data-idle={idleMotion ?? "none"} data-mood={moodKey}>
              <button type="button" class={styles.petTapTarget} onClick={pat} disabled={Boolean(acting)} aria-label={copy.petTap} title={copy.petTap}>
                <img class={`${styles.petImage}${celebrating ? ` ${styles.celebrating}` : ""}`} src={petSrc} width={1385} height={1136} alt="" />
              </button>
              {equipped && (
                <span class={styles.petCosmetic} data-cosmetic={equipped} aria-hidden="true">
                  {BENBEN_COSMETICS.find((cosmetic) => cosmetic.id === equipped)?.symbol}
                </span>
              )}
              {idleMotion === "blink" && <div class={styles.eyeBlink} aria-hidden="true"><span /><span /></div>}
              {idleMotion === "sparkle" && <div class={styles.idleSparkles} aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>}
              {view?.phoenixActive && (
                <img
                  class={`${styles.phoenix}${acting ? ` ${styles.phoenixFlying}` : ""}`}
                  src={acting ? "/benben-phoenix-flying.webp" : "/benben-phoenix.webp"}
                  width={1254}
                  height={1254}
                  alt=""
                />
              )}
              {acting === "feed" && <div class={styles.feedAnimation} aria-hidden="true"><span /><span /><span /></div>}
              {acting === "polish" && <div class={styles.polishAnimation} aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span></div>}
              {acting === "rest" && <div class={styles.restAnimation} aria-hidden="true"><span>Z</span><span>z</span><span>z</span></div>}
              {acting === "play" && <div class={styles.sunbeamAnimation} aria-hidden="true"><span /><span /><span /></div>}
              {celebrating && <div class={styles.confetti} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>}
            </div>
            <div class={styles.sceneFooter}>
              <span class={styles.sceneMoodText} aria-live="polite">
                {petPat ? copy.petTapResponse : view?.phoenixActive ? `🔥 ${labels.phoenixVisit}` : welcomeLine(copy, acting)}
              </span>
              <span class={styles.sceneCount}><strong>{numberFormat.format(view?.totalCares ?? 0)}</strong><span>{labels.careCount}</span></span>
            </div>
            {view?.phoenixActive && <div class={styles.phoenixBanner}><span aria-hidden="true">✦</span>{copy.phoenixTime}<span aria-hidden="true">✦</span></div>}
          </section>

          <section class={styles.carePanel} aria-labelledby="benben-care-title">
            <header class={styles.careHeading}>
              <div class={styles.headingIcon} aria-hidden="true">♡</div>
              <div>
                <span class={styles.eyebrow}>{copy.todayCare}</span>
                <h2 id="benben-care-title">{copy.careHeading}</h2>
                <p>{copy.careLede}</p>
              </div>
            </header>
            {view ? (
              <>
                <div class={styles.needsGrid}>
                  {stats.map((stat) => (
                    <article class={styles.needCard} data-tone={stat.tone} key={stat.action}>
                      <span class={styles.needIcon} aria-hidden="true">{stat.icon}</span>
                      <div class={styles.needDetails}>
                        <div class={styles.needLabel}><span>{stat.label}</span><strong>{stat.value}<small>%</small></strong></div>
                        <div class={styles.meter} role="progressbar" aria-label={stat.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stat.value}>
                          <span style={{ width: `${Math.max(0, Math.min(100, stat.value))}%` }} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <p class={styles.decayNote}><span aria-hidden="true">⏳</span>{copy.decayNote}</p>
                {suggestion && (
                  <div class={styles.suggestion}>
                    <div class={styles.suggestionIcon} aria-hidden="true">{suggestion.icon}</div>
                    <div class={styles.suggestionCopy}>
                      <strong>{copy.suggestion}: {suggestion.label}</strong>
                      <span>{copy.suggestionReason} · {suggestion.value}%</span>
                    </div>
                    <button type="button" class={styles.suggestionButton} onClick={() => void care(suggestion.action)} disabled={blocked}>→</button>
                  </div>
                )}
                <div class={styles.careDivider} />
                <div class={styles.dailyCare}>
                  <div>
                    <strong>{copy.todayCare}</strong>
                    <span>
                      {signedIn
                        ? (view.careRemaining > 0 ? fillBenben(labels.actionsLeft, { count: view.careRemaining }) : labels.noActions)
                        : copy.signInForCare}
                    </span>
                  </div>
                  <div class={styles.actionDots} aria-label={signedIn ? `${actionsUsed} / 3` : copy.signInForCare}>
                    {[0, 1, 2].map((index) => <span class={index < actionsUsed ? styles.actionDotUsed : ""} key={index} />)}
                  </div>
                </div>
                <div class={styles.actions}>
                  {actions.map(([action, label]) => (
                    <button class={styles.actionButton} type="button" key={action} disabled={blocked} onClick={() => void care(action)} data-action={action}>
                      <span class={styles.actionIcon} aria-hidden="true">{ICON[action]}</span>
                      <span class={styles.actionName}>{acting === action ? "…" : label}</span>
                      <span class={styles.actionEffect}>{copy.actionEffects[action]}</span>
                    </button>
                  ))}
                </div>
                <div class={styles.panelActions}>
                  {!signedIn && <a class={styles.signInButton} href={signInHref}>{labels.signIn}</a>}
                  <button class={styles.shareButton} type="button" onClick={() => void share()}><span aria-hidden="true">↗</span>{copied ? labels.copied : labels.share}</button>
                </div>
                <p class={styles.shareHint}>{copy.shareHint}</p>
              </>
            ) : (
              <div class={styles.loadingState} aria-live="polite"><span class={styles.loadingOrb} /><strong>{copy.communitySpace}</strong><span>{labels.unavailable}</span></div>
            )}
            {error && <div class="notice notice-warn" role="alert"><p>{error}</p></div>}
          </section>
        </div>

        <div class={styles.communityGrid}>
          <section class={styles.journeyCard} aria-labelledby="benben-journey-title">
            <div class={styles.sectionHeading}>
              <span class={styles.sectionIcon} aria-hidden="true">✧</span>
              <div><h2 id="benben-journey-title">{copy.journeyTitle}</h2><p>{copy.journeyLede}</p></div>
            </div>
            <div class={styles.growthSummary}>
              <div>
                <span class={styles.growthLabel}>{fillBenben(copy.landscapeProgress, { current: growth.biomeIndex + 1, total: growth.biomeCount })}</span>
                <strong>{growth.biomeIcon} {growth.biomeName}</strong>
              </div>
              <div class={styles.growthTotal}><strong>{numberFormat.format(growth.reachedTotal)}</strong><span>{labels.careCount}</span></div>
            </div>
            <div class={styles.growthTrack} role="progressbar" aria-label={copy.nextMilestone} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(growth.progress)}>
              <span style={{ width: `${growth.progress}%` }} /><i /><i /><i />
            </div>
            <div class={styles.growthFooter}><span>{copy.nextMilestone}</span><strong>{growth.next ?? copy.worldComplete}</strong></div>
            <p class={styles.growthRemaining}>
              {growth.remaining === null
                ? fillBenben(copy.milestoneCount, { current: growth.reachedTotal, total: BENBEN_WORLD_TOTAL_MILESTONES })
                : `${fillBenben(copy.careActionsToGo, { count: growth.remaining })} · ${fillBenben(copy.milestoneCount, { current: growth.reachedTotal, total: BENBEN_WORLD_TOTAL_MILESTONES })}`}
            </p>
            <h3 class={styles.milestoneHeading}>{copy.milestonesLabel}</h3>
            <div class={styles.milestoneGrid}>
              {growth.milestones.map((milestone, index) => {
                const isNext = !milestone.reached && index === growth.stage;
                return (
                  <div class={styles.milestone} data-state={milestone.reached ? "reached" : isNext ? "next" : "locked"} key={milestone.id}>
                    <span class={styles.milestoneIcon} aria-hidden="true">{milestone.reached ? "✓" : milestone.icon}</span>
                    <span class={styles.milestoneName}>
                      <strong>{milestone.name}</strong>
                      <small>{milestone.reached ? copy.milestoneReached : isNext ? copy.milestoneNext : copy.milestoneLocked}</small>
                    </span>
                    <span class={styles.milestoneTarget}>{numberFormat.format(milestone.target)}</span>
                  </div>
                );
              })}
            </div>
            <h3 class={styles.routeHeading}>{copy.routeLabel}</h3>
            <p class={styles.routeHint}>{copy.routePreviewHint}</p>
            <div class={styles.worldRoute} role="list" aria-label={copy.routeLabel}>
              {growth.route.map((place, index) => (
                <div class={styles.routeStop} data-state={place.state} key={place.id} title={place.name} role="listitem">
                  {place.state === "complete" ? (
                    <button
                      type="button"
                      class={styles.routePreviewButton}
                      onMouseEnter={() => setHoveredBiome(place.id)}
                      onMouseLeave={() => setHoveredBiome(null)}
                      onFocus={() => setHoveredBiome(place.id)}
                      onBlur={() => setHoveredBiome(null)}
                      onClick={() => setPinnedBiome((current) => (current === place.id ? null : place.id))}
                      aria-pressed={pinnedBiome === place.id}
                    >
                      <span aria-hidden="true">{place.icon}</span>
                      <small>{place.name}</small>
                    </button>
                  ) : (
                    <>
                      <span aria-hidden="true">{place.icon}</span>
                      <small>{place.name}</small>
                    </>
                  )}
                  {index < growth.route.length - 1 && <i aria-hidden="true" />}
                </div>
              ))}
            </div>
            {scenePreview && (
              <div class={styles.routePreviewCard} data-biome={scenePreview.id}>
                <div class={styles.routePreviewMap} data-biome={scenePreview.id} aria-hidden="true">
                  <BenbenWorld biome={scenePreview.id} landmarks={scenePreview.landmarks} />
                </div>
                <div class={styles.routePreviewDetails}>
                  <span>{copy.scenePreview}</span>
                  <strong>{scenePreview.icon} {scenePreview.name}</strong>
                  <small>{fillBenben(copy.previewPlaceCount, { count: scenePreview.landmarks.length })}</small>
                </div>
              </div>
            )}
          </section>

          <BenbenPlayCorner landscapes={growth.route} currentBiome={growth.biomeId} locale={locale} memberId={memberId} />

          <section class={styles.activityCard} aria-labelledby="benben-activity-title" aria-live="polite">
            <div class={styles.activityHeading}>
              <div><span class={styles.eyebrow}>{copy.liveShared}</span><h2 id="benben-activity-title">{copy.recentLive}</h2></div>
              <span class={styles.activityPulse} title={copy.updatedTogether} />
            </div>
            {view?.recent.length ? (
              <ul class={styles.activityList}>
                {view.recent.map((entry, index) => {
                  const action = toUiAction(entry.action);
                  return (
                    <li class={styles.activityItem} key={`${entry.at}-${index}`} style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}>
                      <span class={styles.activityIcon} data-action={action} aria-hidden="true">{ICON[action]}</span>
                      <div class={styles.activityDetails}>
                        <strong>{entry.name}</strong>
                        <span>{copy.activityBy} · {actions.find(([key]) => key === action)?.[1]}</span>
                      </div>
                      <time dateTime={entry.at}>{timeFormat.format(new Date(entry.at))}</time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div class={styles.emptyActivity}><span aria-hidden="true">☀</span><p>{labels.empty}</p><small>{copy.updatedTogether}</small></div>
            )}
            <div class={styles.communityStats}>
              <div class={styles.streakIcon} aria-hidden="true">🔥</div>
              <strong>{numberFormat.format(view?.streak ?? 0)}</strong>
              <span>{labels.streak} · {labels.days}</span>
            </div>
          </section>
        </div>
      </div>
      <footer class={styles.ideaCredit}>{copy.ideaCredit}</footer>
    </div>
  );
}

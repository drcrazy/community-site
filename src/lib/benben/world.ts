import type { Locale } from "../i18n/locales";

export type BenbenBiomeId = "oasis" | "mountains" | "desert" | "jungle" | "volcano" | "ice" | "star-sea";

export type LandmarkId =
  | "spring" | "lotus" | "date-palm" | "garden-pavilion" | "caravan-gate"
  | "trail-marker" | "pine-camp" | "stone-bridge" | "eagle-perch" | "summit-beacon"
  | "swamp-waterfall" | "swamp-lotus" | "willow-grove" | "swamp-pavilion" | "garden-gate"
  | "jungle-vines" | "river-pool" | "flower-grove" | "canopy-nest" | "ancient-temple"
  | "basalt-trail" | "ember-lantern" | "lava-bridge" | "phoenix-nest" | "obsidian-monument"
  | "frost-pines" | "ice-cave" | "aurora-pool" | "crystal-arch" | "ice-palace"
  | "moon-gate" | "star-garden" | "comet-bridge" | "constellation-shrine" | "sky-pyramid";

type BiomeDefinition = {
  id: BenbenBiomeId;
  icon: string;
  targets: readonly [number, number, number, number, number];
  landmarks: readonly [LandmarkId, LandmarkId, LandmarkId, LandmarkId, LandmarkId];
};

const BIOMES: readonly BiomeDefinition[] = [
  { id: "oasis", icon: "🌴", targets: [50, 200, 750, 2_000, 5_000], landmarks: ["spring", "lotus", "date-palm", "garden-pavilion", "caravan-gate"] },
  { id: "mountains", icon: "⛰️", targets: [6_500, 8_000, 10_000, 12_500, 15_000], landmarks: ["trail-marker", "pine-camp", "stone-bridge", "eagle-perch", "summit-beacon"] },
  { id: "desert", icon: "🐸", targets: [18_000, 22_000, 27_000, 33_000, 40_000], landmarks: ["swamp-waterfall", "swamp-lotus", "willow-grove", "swamp-pavilion", "garden-gate"] },
  { id: "jungle", icon: "🌿", targets: [45_000, 52_000, 60_000, 70_000, 85_000], landmarks: ["jungle-vines", "river-pool", "flower-grove", "canopy-nest", "ancient-temple"] },
  { id: "volcano", icon: "🌋", targets: [95_000, 110_000, 130_000, 155_000, 180_000], landmarks: ["basalt-trail", "ember-lantern", "lava-bridge", "phoenix-nest", "obsidian-monument"] },
  { id: "ice", icon: "❄️", targets: [200_000, 240_000, 290_000, 350_000, 420_000], landmarks: ["frost-pines", "ice-cave", "aurora-pool", "crystal-arch", "ice-palace"] },
  { id: "star-sea", icon: "🌌", targets: [450_000, 500_000, 575_000, 650_000, 750_000], landmarks: ["moon-gate", "star-garden", "comet-bridge", "constellation-shrine", "sky-pyramid"] },
];

const BIOME_NAMES: Record<Locale, Record<BenbenBiomeId, string>> = {
  en: { oasis: "The Oasis", mountains: "The Mountains", desert: "The Swamp", jungle: "The Jungle", volcano: "The Volcano", ice: "The Ice Kingdom", "star-sea": "The Star Sea" },
  de: { oasis: "Die Oase", mountains: "Die Berge", desert: "Der Sumpf", jungle: "Der Dschungel", volcano: "Der Vulkan", ice: "Das Eisreich", "star-sea": "Das Sternenmeer" },
  fr: { oasis: "L’oasis", mountains: "Les montagnes", desert: "Le marécage", jungle: "La jungle", volcano: "Le volcan", ice: "Le royaume de glace", "star-sea": "La mer des étoiles" },
  ru: { oasis: "Оазис", mountains: "Горы", desert: "Болото", jungle: "Джунгли", volcano: "Вулкан", ice: "Ледяное королевство", "star-sea": "Звёздное море" },
  es: { oasis: "El oasis", mountains: "Las montañas", desert: "El pantano", jungle: "La jungla", volcano: "El volcán", ice: "El reino de hielo", "star-sea": "El mar de estrellas" },
};

const LANDMARK_NAMES: Record<Locale, Record<LandmarkId, string>> = {
  en: {
    spring: "A clear spring", lotus: "Lotus pond", "date-palm": "Date palm grove", "garden-pavilion": "Garden pavilion", "caravan-gate": "Caravan gate",
    "trail-marker": "Mountain trail marker", "pine-camp": "Pine camp", "stone-bridge": "Stone bridge", "eagle-perch": "Eagle’s perch", "summit-beacon": "Summit beacon",
    "swamp-waterfall": "Hidden waterfall", "swamp-lotus": "Lotus pond", "willow-grove": "Weeping willow grove", "swamp-pavilion": "Swamp pavilion", "garden-gate": "Ancient garden gate",
    "jungle-vines": "Vine trail", "river-pool": "Hidden river pool", "flower-grove": "Flower grove", "canopy-nest": "Canopy nest", "ancient-temple": "Ancient temple",
    "basalt-trail": "Basalt trail", "ember-lantern": "Ember lantern", "lava-bridge": "Lava bridge", "phoenix-nest": "Phoenix nest", "obsidian-monument": "Obsidian monument",
    "frost-pines": "Frosted pines", "ice-cave": "Crystal ice cave", "aurora-pool": "Aurora pool", "crystal-arch": "Crystal arch", "ice-palace": "Ice palace",
    "moon-gate": "Moon gate", "star-garden": "Star garden", "comet-bridge": "Comet bridge", "constellation-shrine": "Constellation shrine", "sky-pyramid": "Sky pyramid",
  },
  de: {
    spring: "Eine klare Quelle", lotus: "Lotusteich", "date-palm": "Dattelpalmenhain", "garden-pavilion": "Gartenpavillon", "caravan-gate": "Karawanentor",
    "trail-marker": "Wegweiser im Gebirge", "pine-camp": "Lager im Kiefernwald", "stone-bridge": "Steinbrücke", "eagle-perch": "Adlerhorst", "summit-beacon": "Gipfelfeuer",
    "swamp-waterfall": "Versteckter Wasserfall", "swamp-lotus": "Lotusteich", "willow-grove": "Trauerweidenhain", "swamp-pavilion": "Sumpfpavillon", "garden-gate": "Altes Gartentor",
    "jungle-vines": "Lianenpfad", "river-pool": "Versteckter Wasserfall", "flower-grove": "Blütenhain", "canopy-nest": "Nest im Blätterdach", "ancient-temple": "Alter Tempel",
    "basalt-trail": "Basaltpfad", "ember-lantern": "Glutlaterne", "lava-bridge": "Lavaweg", "phoenix-nest": "Phönixnest", "obsidian-monument": "Obsidianmonument",
    "frost-pines": "Verschneite Kiefern", "ice-cave": "Kristallhöhle", "aurora-pool": "Polarlichtsee", "crystal-arch": "Kristallbogen", "ice-palace": "Eispalast",
    "moon-gate": "Mondtor", "star-garden": "Sternengarten", "comet-bridge": "Kometenbrücke", "constellation-shrine": "Sternbildschrein", "sky-pyramid": "Himmelpyramide",
  },
  fr: {
    spring: "Source limpide", lotus: "Étang aux lotus", "date-palm": "Palmeraie", "garden-pavilion": "Pavillon du jardin", "caravan-gate": "Porte des caravanes",
    "trail-marker": "Balise de montagne", "pine-camp": "Camp des pins", "stone-bridge": "Pont de pierre", "eagle-perch": "Nid d’aigle", "summit-beacon": "Phare du sommet",
    "swamp-waterfall": "Cascade cachée", "swamp-lotus": "Étang aux lotus", "willow-grove": "Bosquet de saules pleureurs", "swamp-pavilion": "Pavillon du marécage", "garden-gate": "Ancienne porte du jardin",
    "jungle-vines": "Sentier des lianes", "river-pool": "Cascade cachée", "flower-grove": "Bosquet fleuri", "canopy-nest": "Nid dans la canopée", "ancient-temple": "Temple ancien",
    "basalt-trail": "Sentier de basalte", "ember-lantern": "Lanterne ardente", "lava-bridge": "Pont de lave", "phoenix-nest": "Nid du phénix", "obsidian-monument": "Monument d’obsidienne",
    "frost-pines": "Pins givrés", "ice-cave": "Grotte de cristal", "aurora-pool": "Bassin des aurores", "crystal-arch": "Arche de cristal", "ice-palace": "Palais de glace",
    "moon-gate": "Porte de la lune", "star-garden": "Jardin des étoiles", "comet-bridge": "Pont des comètes", "constellation-shrine": "Sanctuaire céleste", "sky-pyramid": "Pyramide céleste",
  },
  ru: {
    spring: "Чистый родник", lotus: "Пруд с лотосами", "date-palm": "Роща финиковых пальм", "garden-pavilion": "Садовый павильон", "caravan-gate": "Ворота каравана",
    "trail-marker": "Горный указатель", "pine-camp": "Лагерь среди сосен", "stone-bridge": "Каменный мост", "eagle-perch": "Орлиное гнездо", "summit-beacon": "Огонь на вершине",
    "swamp-waterfall": "Скрытый водопад", "swamp-lotus": "Пруд с лотосами", "willow-grove": "Роща плакучих ив", "swamp-pavilion": "Болотный павильон", "garden-gate": "Древние садовые ворота",
    "jungle-vines": "Тропа лиан", "river-pool": "Скрытый речной омут", "flower-grove": "Цветочная роща", "canopy-nest": "Гнездо в кронах", "ancient-temple": "Древний храм",
    "basalt-trail": "Базальтовая тропа", "ember-lantern": "Тлеющий фонарь", "lava-bridge": "Лавовый мост", "phoenix-nest": "Гнездо феникса", "obsidian-monument": "Обсидиановый монумент",
    "frost-pines": "Заснеженные сосны", "ice-cave": "Ледяная хрустальная пещера", "aurora-pool": "Озеро северного сияния", "crystal-arch": "Хрустальная арка", "ice-palace": "Ледяной дворец",
    "moon-gate": "Лунные ворота", "star-garden": "Звёздный сад", "comet-bridge": "Мост комет", "constellation-shrine": "Святилище созвездий", "sky-pyramid": "Небесная пирамида",
  },
  es: {
    spring: "Manantial cristalino", lotus: "Estanque de lotos", "date-palm": "Palmeral datilero", "garden-pavilion": "Pabellón del jardín", "caravan-gate": "Puerta de la caravana",
    "trail-marker": "Señal del sendero de montaña", "pine-camp": "Campamento entre pinos", "stone-bridge": "Puente de piedra", "eagle-perch": "Posadero del águila", "summit-beacon": "Faro de la cumbre",
    "swamp-waterfall": "Cascada oculta", "swamp-lotus": "Estanque de lotos", "willow-grove": "Arboleda de sauces llorones", "swamp-pavilion": "Pabellón del pantano", "garden-gate": "Antigua puerta del jardín",
    "jungle-vines": "Sendero de lianas", "river-pool": "Remanso escondido", "flower-grove": "Bosquecillo de flores", "canopy-nest": "Nido en las copas", "ancient-temple": "Templo antiguo",
    "basalt-trail": "Sendero de basalto", "ember-lantern": "Farol de brasas", "lava-bridge": "Puente de lava", "phoenix-nest": "Nido del fénix", "obsidian-monument": "Monumento de obsidiana",
    "frost-pines": "Pinos escarchados", "ice-cave": "Cueva de hielo cristalino", "aurora-pool": "Laguna de la aurora", "crystal-arch": "Arco de cristal", "ice-palace": "Palacio de hielo",
    "moon-gate": "Puerta lunar", "star-garden": "Jardín de estrellas", "comet-bridge": "Puente de cometas", "constellation-shrine": "Santuario de las constelaciones", "sky-pyramid": "Pirámide celeste",
  },
};

export type BenbenWorldProgress = {
  total: number;
  biomeId: BenbenBiomeId;
  biomeName: string;
  biomeIcon: string;
  biomeIndex: number;
  biomeCount: number;
  stage: number;
  stageCount: number;
  reachedTotal: number;
  current: string;
  next: string | null;
  progress: number;
  remaining: number | null;
  landmarks: Array<{ id: LandmarkId; name: string; icon: string }>;
  milestones: Array<{ id: LandmarkId; name: string; icon: string; target: number; reached: boolean }>;
  route: Array<{
    id: BenbenBiomeId;
    name: string;
    icon: string;
    state: "complete" | "current" | "locked";
    landmarks: Array<{ id: LandmarkId; name: string; icon: string }>;
  }>;
};

const LANDMARK_ICONS: Record<LandmarkId, string> = {
  spring: "💧", lotus: "🪷", "date-palm": "🌴", "garden-pavilion": "🏛️", "caravan-gate": "🐪",
  "trail-marker": "🧭", "pine-camp": "🌲", "stone-bridge": "🌉", "eagle-perch": "🦅", "summit-beacon": "🔆",
  "swamp-waterfall": "💦", "swamp-lotus": "🪷", "willow-grove": "🌳", "swamp-pavilion": "🏯", "garden-gate": "⛩️",
  "jungle-vines": "🌿", "river-pool": "💦", "flower-grove": "🌺", "canopy-nest": "🦜", "ancient-temple": "🛕",
  "basalt-trail": "🪨", "ember-lantern": "🏮", "lava-bridge": "🌋", "phoenix-nest": "🔥", "obsidian-monument": "💎",
  "frost-pines": "🌲", "ice-cave": "🧊", "aurora-pool": "🌌", "crystal-arch": "❄️", "ice-palace": "🏰",
  "moon-gate": "🌙", "star-garden": "✨", "comet-bridge": "☄️", "constellation-shrine": "⭐", "sky-pyramid": "🔺",
};

export function getBenbenWorldProgress(total: number, locale: Locale): BenbenWorldProgress {
  const count = Math.max(0, Math.floor(total));
  let biomeIndex = BIOMES.findIndex((biome) => count < biome.targets[4]);
  if (biomeIndex < 0) biomeIndex = BIOMES.length - 1;
  const biome = BIOMES[biomeIndex];
  const reachedBefore = biomeIndex === 0 ? 0 : BIOMES[biomeIndex - 1].targets[4];
  const reachedInBiome = biome.targets.filter((target) => count >= target).length;
  const nextTarget = biome.targets[reachedInBiome];
  const previousTarget = reachedInBiome === 0 ? reachedBefore : biome.targets[reachedInBiome - 1];
  const progress = nextTarget === undefined ? 100 : Math.max(0, Math.min(100, ((count - previousTarget) / (nextTarget - previousTarget)) * 100));
  const names = LANDMARK_NAMES[locale];
  const route = BIOMES.map((item, index) => {
    const state = count >= BIOMES[BIOMES.length - 1].targets[4]
      ? "complete" as const
      : index < biomeIndex ? "complete" as const : index === biomeIndex ? "current" as const : "locked" as const;
    const unlockedCount = state === "complete" ? item.landmarks.length : index === biomeIndex ? reachedInBiome : 0;
    return {
      id: item.id,
      name: BIOME_NAMES[locale][item.id],
      icon: item.icon,
      state,
      landmarks: item.landmarks.slice(0, unlockedCount).map((id) => ({ id, name: LANDMARK_NAMES[locale][id], icon: LANDMARK_ICONS[id] })),
    };
  });

  return {
    total: count,
    biomeId: biome.id,
    biomeName: BIOME_NAMES[locale][biome.id],
    biomeIcon: biome.icon,
    biomeIndex,
    biomeCount: BIOMES.length,
    stage: reachedInBiome,
    stageCount: biome.landmarks.length,
    reachedTotal: BIOMES.slice(0, biomeIndex).reduce((sum, item) => sum + item.landmarks.length, 0) + reachedInBiome,
    current: reachedInBiome === 0 ? BIOME_NAMES[locale][biome.id] : names[biome.landmarks[reachedInBiome - 1]],
    next: biome.landmarks[reachedInBiome] ? names[biome.landmarks[reachedInBiome]] : null,
    progress,
    remaining: nextTarget === undefined ? null : nextTarget - count,
    landmarks: biome.landmarks.slice(0, reachedInBiome).map((id) => ({ id, name: names[id], icon: LANDMARK_ICONS[id] })),
    milestones: biome.landmarks.map((id, index) => ({ id, name: names[id], icon: LANDMARK_ICONS[id], target: biome.targets[index], reached: index < reachedInBiome })),
    route,
  };
}

export const BENBEN_WORLD_TOTAL_MILESTONES = BIOMES.reduce((sum, biome) => sum + biome.landmarks.length, 0);

/** Community Benben advances one landmark per care, five per landscape. */
export function getBenbenJourneyView(landscape: number, milestone: number, locale: Locale): BenbenWorldProgress {
  const biomeCount = BIOMES.length;
  const stageCount = 5;
  const biomeIndex = ((Math.floor(landscape) % biomeCount) + biomeCount) % biomeCount;
  const reachedInBiome = Math.max(0, Math.min(stageCount, Math.floor(milestone)));
  const biome = BIOMES[biomeIndex];
  const names = LANDMARK_NAMES[locale];
  const progress = (reachedInBiome / stageCount) * 100;
  const route = BIOMES.map((item, index) => {
    const state = index < biomeIndex ? "complete" as const : index === biomeIndex ? "current" as const : "locked" as const;
    const unlockedCount = state === "complete" ? item.landmarks.length : index === biomeIndex ? reachedInBiome : 0;
    return {
      id: item.id,
      name: BIOME_NAMES[locale][item.id],
      icon: item.icon,
      state,
      landmarks: item.landmarks.slice(0, unlockedCount).map((id) => ({ id, name: LANDMARK_NAMES[locale][id], icon: LANDMARK_ICONS[id] })),
    };
  });
  const nextLandmark = biome.landmarks[reachedInBiome];
  return {
    total: biomeIndex * stageCount + reachedInBiome,
    biomeId: biome.id,
    biomeName: BIOME_NAMES[locale][biome.id],
    biomeIcon: biome.icon,
    biomeIndex,
    biomeCount,
    stage: reachedInBiome,
    stageCount,
    reachedTotal: biomeIndex * stageCount + reachedInBiome,
    current: reachedInBiome === 0 ? BIOME_NAMES[locale][biome.id] : names[biome.landmarks[reachedInBiome - 1]],
    next: nextLandmark ? names[nextLandmark] : null,
    progress,
    remaining: reachedInBiome >= stageCount ? null : stageCount - reachedInBiome,
    landmarks: biome.landmarks.slice(0, reachedInBiome).map((id) => ({ id, name: names[id], icon: LANDMARK_ICONS[id] })),
    milestones: biome.landmarks.map((id, index) => ({
      id,
      name: names[id],
      icon: LANDMARK_ICONS[id],
      target: index + 1,
      reached: index < reachedInBiome,
    })),
    route,
  };
}

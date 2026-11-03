export type CalculatorListing = {
  id: string;
  name: string;
  description: string;
  icon: string;
  hrefId: string;
  premium?: boolean;
  assumptions?: readonly string[];
};

/** Index order matches epochpedia.com/calculators/ (Premium theater listed, locked). */
export const CALCULATOR_LISTINGS: readonly CalculatorListing[] = [
  {
    id: "goddess-materials",
    hrefId: "goddess-materials",
    name: "Goddess materials",
    description: "Convert Olive Branches, Corollas, and Tribute Plates into Goddess points.",
    icon: "/tool-icons/goddess-materials.webp",
    assumptions: ["Quantities are whole non-negative numbers.", "Points use the published event schedule."],
  },
  {
    id: "goddess-xp",
    hrefId: "goddess-xp",
    name: "Goddess XP",
    description: "Find the XP required to progress between two Goddess levels.",
    icon: "/tool-icons/goddess-xp.webp",
    assumptions: ["Levels are whole numbers from 1 to 150.", "Intended level must be higher than current."],
  },
  {
    id: "theater-income",
    hrefId: "theater-income",
    name: "Theater income",
    description: "Muse Coins and Red Carpet points for every Goddess Theater play, with your upgrades and goddesses.",
    icon: "/tool-icons/theater-income.webp",
    premium: true,
  },
  {
    id: "red-carpet-materials",
    hrefId: "red-carpet-materials",
    name: "Red Carpet materials",
    description: "Calculate event points from Cheer Sticks, Clappers, and Vintage Cameras.",
    icon: "/tool-icons/red-carpet-materials.webp",
    assumptions: ["Quantities are whole non-negative numbers.", "Points use the published event schedule."],
  },
  {
    id: "city-upgrade",
    hrefId: "city-upgrade",
    name: "City upgrade",
    description: "Plan Bills of Exchange for a city and its required group milestones.",
    icon: "/tool-icons/city-upgrade.webp",
    assumptions: ["Costs follow the Grand Voyage city tables.", "Peer levels must be within each city’s cap."],
  },
  {
    id: "signet-rings",
    hrefId: "signet-rings",
    name: "Hero Level Calculator",
    description: "Estimate the coins and Signet Rings needed to level a hero from A to B.",
    icon: "/tool-icons/signet-rings.webp",
    assumptions: ["Levels are whole numbers from 1 to 500.", "Ascension rings charge only when the target passes a milestone."],
  },
  {
    id: "grand-voyage-route",
    hrefId: "grand-voyage-route",
    name: "Route calculator",
    description: "Compare travel time, profit, and efficiency for a two-to-six-city round trip.",
    icon: "/tool-icons/grand-voyage-route.webp",
    assumptions: ["Choose 2–6 distinct cities.", "Travel hours and profits come from the published route matrix."],
  },
] as const;

/** Free tools that have working pages (excludes Premium theater-income). */
export const FREE_CALCULATORS = CALCULATOR_LISTINGS.filter(
  (tool): tool is CalculatorListing & { assumptions: readonly string[] } => !tool.premium && Boolean(tool.assumptions),
);

export type FreeCalculatorId = (typeof FREE_CALCULATORS)[number]["id"];

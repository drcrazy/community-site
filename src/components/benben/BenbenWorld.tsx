import styles from "./benben.module.css";
import type { BenbenBiomeId } from "../../lib/benben/world";

export function BenbenWorld({ biome, landmarks }: { biome: BenbenBiomeId; landmarks: Array<{ id: string }> }) {
  const stage = Math.min(5, landmarks.length);
  const imageBiome = biome === "desert" ? "swamp" : biome;
  const viewBox = biome === "oasis" ? "0 0 1000 1000" : "0 0 1000 663";
  const imageHeight = biome === "oasis" ? 1000 : 663;
  return (
    <div class={styles.worldBackdrop} data-biome={biome} data-stage={stage} aria-hidden="true">
      <svg class={styles.landscapeArt} viewBox={viewBox} preserveAspectRatio="none">
        <image
          href={`/benben-${imageBiome}-stage-${stage}.webp`}
          x="0"
          y="0"
          width="1000"
          height={imageHeight}
          preserveAspectRatio="none"
        />
      </svg>
    </div>
  );
}

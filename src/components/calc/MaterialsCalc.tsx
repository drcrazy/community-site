import { useMemo, useState } from "preact/hooks";
import { calculateMaterials } from "../../lib/calculators/event-materials";

type Material = { key: string; name: string; pointsEach: number };

export function MaterialsCalc({
  materials,
  resultLabel = "Total points",
}: {
  materials: readonly Material[];
  resultLabel?: string;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(materials.map((m) => [m.key, 0])),
  );

  const result = useMemo(
    () =>
      calculateMaterials(
        materials.map((material) => ({
          name: material.name,
          pointsEach: material.pointsEach,
          quantity: quantities[material.key] ?? 0,
        })),
      ),
    [materials, quantities],
  );

  return (
    <div class="calc">
      {materials.map((material) => (
        <label class="calc-row">
          <span>
            {material.name} <small>({material.pointsEach} pts)</small>
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={quantities[material.key] ?? 0}
            onInput={(event) => {
              const value = Number((event.currentTarget as HTMLInputElement).value);
              setQuantities((prev) => ({ ...prev, [material.key]: value }));
            }}
          />
        </label>
      ))}
      <p class="calc-result">
        {resultLabel}: <strong>{result.total}</strong>
      </p>
    </div>
  );
}

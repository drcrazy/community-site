import { useMemo, useState } from "preact/hooks";
import { buildUpgradePlan, CITIES } from "../../lib/calculators/city-upgrades";
import { isCalculatorError } from "../../lib/calculators/errors";

export function CityUpgradeCalc() {
  const [cityName, setCityName] = useState(CITIES[0]?.name ?? "Gibraltar");
  const [current, setCurrent] = useState(0);
  const [target, setTarget] = useState(5);
  const city = CITIES.find((item) => item.name === cityName) ?? CITIES[0]!;
  const peers = CITIES.filter((item) => item.group === city.group && item.name !== city.name);
  const [groupLevels, setGroupLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(peers.map((peer) => [peer.name, 0])),
  );

  const result = useMemo(() => {
    try {
      return { ok: true as const, plan: buildUpgradePlan(cityName, current, target, groupLevels) };
    } catch (error) {
      return { ok: false as const, message: isCalculatorError(error) ? error.message : "Invalid input." };
    }
  }, [cityName, current, target, groupLevels]);

  return (
    <div class="calc">
      <label class="calc-row">
        <span>City</span>
        <select value={cityName} onChange={(e) => {
          const next = (e.currentTarget as HTMLSelectElement).value;
          setCityName(next);
          const nextCity = CITIES.find((item) => item.name === next)!;
          const nextPeers = CITIES.filter((item) => item.group === nextCity.group && item.name !== nextCity.name);
          setGroupLevels(Object.fromEntries(nextPeers.map((peer) => [peer.name, groupLevels[peer.name] ?? 0])));
        }}>
          {CITIES.map((item) => <option value={item.name}>{item.name}</option>)}
        </select>
      </label>
      <label class="calc-row">
        <span>Current level</span>
        <input type="number" min={0} max={city.maximumLevel} value={current} onInput={(e) => setCurrent(Number((e.currentTarget as HTMLInputElement).value))} />
      </label>
      <label class="calc-row">
        <span>Target level</span>
        <input type="number" min={0} max={city.maximumLevel} value={target} onInput={(e) => setTarget(Number((e.currentTarget as HTMLInputElement).value))} />
      </label>
      {peers.map((peer) => (
        <label class="calc-row">
          <span>{peer.name} level</span>
          <input
            type="number"
            min={0}
            max={peer.maximumLevel}
            value={groupLevels[peer.name] ?? 0}
            onInput={(e) => setGroupLevels((prev) => ({ ...prev, [peer.name]: Number((e.currentTarget as HTMLInputElement).value) }))}
          />
        </label>
      ))}
      {result.ok ? (
        <div class="calc-result">
          <p>Total cost: <strong>{result.plan.totalCost.toLocaleString("en-US")}</strong></p>
          <p>Required group level: <strong>{result.plan.requiredGroupLevel}</strong></p>
        </div>
      ) : (
        <p class="calc-error">{result.message}</p>
      )}
    </div>
  );
}

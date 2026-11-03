import { useMemo, useState } from "preact/hooks";
import { calculateRoute, formatDuration, ROUTE_CITIES } from "../../lib/calculators/grand-voyage-route";
import { isCalculatorError } from "../../lib/calculators/errors";

export function GrandVoyageCalc() {
  const [selected, setSelected] = useState<string[]>(["Gibraltar", "Lisbon"]);

  const result = useMemo(() => {
    try {
      return { ok: true as const, value: calculateRoute(selected) };
    } catch (error) {
      return { ok: false as const, message: isCalculatorError(error) ? error.message : "Invalid input." };
    }
  }, [selected]);

  function toggle(city: string) {
    setSelected((prev) => (prev.includes(city) ? prev.filter((item) => item !== city) : [...prev, city]));
  }

  return (
    <div class="calc">
      <div class="calc-grid">
        {ROUTE_CITIES.map((city) => (
          <label class="calc-check">
            <input type="checkbox" checked={selected.includes(city)} onChange={() => toggle(city)} />
            {city}
          </label>
        ))}
      </div>
      {result.ok ? (
        <div class="calc-result">
          <p>Total profit: <strong>{result.value.totalProfit.toLocaleString("en-US")}</strong></p>
          <p>Travel: <strong>{formatDuration(result.value.totalTravelHours)}</strong></p>
          <p>Profit / hour: <strong>{Math.round(result.value.profitPerHour).toLocaleString("en-US")}</strong></p>
        </div>
      ) : (
        <p class="calc-error">{result.message}</p>
      )}
    </div>
  );
}

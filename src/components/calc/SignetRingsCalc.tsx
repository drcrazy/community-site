import { useMemo, useState } from "preact/hooks";
import { calculateSignetRingCost, MAXIMUM_SIGNET_LEVEL } from "../../lib/calculators/signet-ring-cost";
import { isCalculatorError } from "../../lib/calculators/errors";

export function SignetRingsCalc() {
  const [current, setCurrent] = useState(1);
  const [target, setTarget] = useState(20);

  const result = useMemo(() => {
    try {
      return { ok: true as const, value: calculateSignetRingCost(current, target) };
    } catch (error) {
      return { ok: false as const, message: isCalculatorError(error) ? error.message : "Invalid input." };
    }
  }, [current, target]);

  return (
    <div class="calc">
      <label class="calc-row">
        <span>Current level</span>
        <input type="number" min={1} max={MAXIMUM_SIGNET_LEVEL} value={current} onInput={(e) => setCurrent(Number((e.currentTarget as HTMLInputElement).value))} />
      </label>
      <label class="calc-row">
        <span>Target level</span>
        <input type="number" min={1} max={MAXIMUM_SIGNET_LEVEL} value={target} onInput={(e) => setTarget(Number((e.currentTarget as HTMLInputElement).value))} />
      </label>
      {result.ok ? (
        <div class="calc-result">
          <p>Coins: <strong>{result.value.coins.toLocaleString("en-US")}</strong></p>
          <p>Signet rings: <strong>{result.value.signetRings}</strong></p>
        </div>
      ) : (
        <p class="calc-error">{result.message}</p>
      )}
    </div>
  );
}

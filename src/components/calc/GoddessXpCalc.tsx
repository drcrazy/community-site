import { useMemo, useState } from "preact/hooks";
import { calculateGoddessXp, MAX_GODDESS_LEVEL, MIN_GODDESS_LEVEL } from "../../lib/calculators/goddess-xp";
import { isCalculatorError } from "../../lib/calculators/errors";

export function GoddessXpCalc() {
  const [current, setCurrent] = useState(1);
  const [intended, setIntended] = useState(2);

  const result = useMemo(() => {
    try {
      return { ok: true as const, xp: calculateGoddessXp(current, intended) };
    } catch (error) {
      return {
        ok: false as const,
        message: isCalculatorError(error) ? error.message : "Invalid input.",
      };
    }
  }, [current, intended]);

  return (
    <div class="calc">
      <label class="calc-row">
        <span>Current level</span>
        <input type="number" min={MIN_GODDESS_LEVEL} max={MAX_GODDESS_LEVEL} value={current} onInput={(e) => setCurrent(Number((e.currentTarget as HTMLInputElement).value))} />
      </label>
      <label class="calc-row">
        <span>Intended level</span>
        <input type="number" min={MIN_GODDESS_LEVEL} max={MAX_GODDESS_LEVEL} value={intended} onInput={(e) => setIntended(Number((e.currentTarget as HTMLInputElement).value))} />
      </label>
      {result.ok ? (
        <p class="calc-result">
          XP needed: <strong>{result.xp}</strong>
        </p>
      ) : (
        <p class="calc-error">{result.message}</p>
      )}
    </div>
  );
}

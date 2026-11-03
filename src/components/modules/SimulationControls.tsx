import { Pause, Play, RotateCcw, Zap } from "lucide-react";
import { useAppStore } from "../../store";
import { isPreview } from "../../lib/runtime";
export default function SimulationControls({
  transactions = false,
}: {
  transactions?: boolean;
}) {
  const s = useAppStore();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 flex items-center gap-1.5 text-xs text-muted">
        <span
          className={`h-1.5 w-1.5 rounded-full ${s.simulationRunning ? "animate-pulse bg-success" : "bg-gold"}`}
        />
        SIMULATION
      </span>
      <button
        aria-label={
          s.simulationRunning
            ? "Pause fleet simulation"
            : "Play fleet simulation"
        }
        onClick={() => s.setSimulationRunning(!s.simulationRunning)}
        className="flex items-center gap-1.5 rounded border-[0.5px] border-edge bg-surface px-2 py-1.5 text-sm"
      >
        {s.simulationRunning ? (
          <Pause aria-hidden size={11} />
        ) : (
          <Play aria-hidden size={11} />
        )}{" "}
        {s.simulationRunning ? "Pause" : "Play"}
      </button>
      <select
        aria-label="Fleet simulation speed"
        className="!px-2 !py-1.5 !text-sm"
        value={s.simulationSpeed}
        onChange={(e) => s.setSimulationSpeed(Number(e.target.value))}
      >
        <option value={1}>1× speed</option>
        <option value={4}>4× speed</option>
        <option value={12}>12× speed</option>
      </select>
      <button
        aria-label="Restart fleet routes"
        className="rounded border-[0.5px] border-edge bg-surface p-1.5 text-muted"
        onClick={s.resetFleet}
      >
        <RotateCcw aria-hidden size={12} />
      </button>
      {transactions && isPreview && (
        <button
          aria-label={
            s.autoTransactions
              ? "Stop transaction demo"
              : "Run transaction demo"
          }
          onClick={() => s.setAutoTransactions(!s.autoTransactions)}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${s.autoTransactions ? "bg-gold/10 text-gold" : "bg-noir text-gold"}`}
        >
          <Zap aria-hidden size={11} />
          {s.autoTransactions ? "Demo running · stop" : "Run transaction demo"}
        </button>
      )}
    </div>
  );
}

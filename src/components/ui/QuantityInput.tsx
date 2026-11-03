import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
export default function QuantityInput({
  value,
  onChange,
  label,
  compact = false,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  compact?: boolean;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <div
      className={`flex items-center overflow-hidden rounded border-[0.5px] border-edge bg-surface ${compact ? "h-7" : "h-9"}`}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className="h-full px-2 text-muted hover:bg-ivory"
        onClick={() => onChange(value - 1)}
      >
        <Minus aria-hidden size={11} />
      </button>
      <input
        aria-label={label}
        type="number"
        inputMode="numeric"
        min="1"
        max="1000000"
        step="1"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (
            e.target.value &&
            Number.isSafeInteger(n) &&
            n >= 1 &&
            n <= 1000000
          )
            onChange(n);
        }}
        onBlur={() => setText(String(value))}
        className="!min-w-0 !w-full !rounded-none !border-0 !px-0 !py-1 text-center !text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className="h-full px-2 text-muted hover:bg-ivory"
        disabled={value >= 1000000}
        onClick={() => onChange(Math.min(1000000, value + 1))}
      >
        <Plus aria-hidden size={11} />
      </button>
    </div>
  );
}

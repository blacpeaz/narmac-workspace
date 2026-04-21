"use client";

import { useState } from "react";

const PRESETS = [7, 14, 30] as const;
const UNITS = ["days", "months", "years"] as const;
type Unit = (typeof UNITS)[number];

function toDays(value: number, unit: Unit): number {
  if (unit === "months") return Math.round(value * 30.44);
  if (unit === "years")  return Math.round(value * 365);
  return value;
}

/** Human-readable label for a given number of days. */
export function getRangeLabel(days: number): string {
  if (days === 7)  return "Last 7 days";
  if (days === 14) return "Last 14 days";
  if (days === 30) return "Last 30 days";
  const years = days / 365;
  if (Number.isInteger(years)) return `Last ${years} year${years > 1 ? "s" : ""}`;
  const months = Math.round(days / 30.44);
  if (Math.abs(toDays(months, "months") - days) <= 1) return `Last ${months} month${months > 1 ? "s" : ""}`;
  return `Last ${days} days`;
}

interface DayRangePickerProps {
  /** Current number of days being shown (used to highlight active preset). */
  days: number;
  onChange: (days: number) => void;
}

/**
 * Day-range picker with preset buttons (7d / 14d / 30d) and a custom
 * input that accepts a number plus a days / months / years unit selector.
 */
export function DayRangePicker({ days, onChange }: DayRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("1");
  const [customUnit, setCustomUnit] = useState<Unit>("months");

  const btnBase =
    "px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap";
  const activeBtn = `${btnBase} bg-[var(--primary)] text-white`;
  const idleBtn   = `${btnBase} bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]`;

  const handlePreset = (d: number) => {
    setShowCustom(false);
    onChange(d);
  };

  const handleCustomApply = () => {
    const n = Math.max(1, parseInt(customValue, 10) || 1);
    onChange(toDays(n, customUnit));
    setShowCustom(false);
  };

  const isPresetActive = PRESETS.includes(days as (typeof PRESETS)[number]);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Quick-pick row */}
      <div className="flex gap-1 flex-wrap justify-end">
        {PRESETS.map((d) => (
          <button key={d} onClick={() => handlePreset(d)}
            className={days === d && isPresetActive ? activeBtn : idleBtn}>
            {d}d
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={!isPresetActive || showCustom ? activeBtn : idleBtn}
        >
          Custom
        </button>
      </div>

      {/* Custom input — shown when "Custom" is active */}
      {showCustom && (
        <div className="flex items-center gap-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <input
            type="number"
            min={1}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomApply()}
            className="w-14 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value as Unit)}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--ring)]"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button
            onClick={handleCustomApply}
            className="px-2 py-1 text-xs rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}


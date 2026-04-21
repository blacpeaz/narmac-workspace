"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ChartPickerCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Whether this card is the currently active/selected chart. */
  isActive: boolean;
  onClick: (id: string) => void;
}

/**
 * A clickable card that represents a single chart option.
 * Active state shows a coloured left border and tinted background.
 * Clicking an already-active card deselects it (hides the chart).
 */
export function ChartPickerCard({
  id,
  title,
  description,
  icon: Icon,
  isActive,
  onClick,
}: ChartPickerCardProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        // Base styles — card shape and smooth transitions
        "w-full text-left rounded-xl border p-4 transition-all duration-150 group",
        "flex items-start gap-4",
        isActive
          ? // Active: primary-coloured border + tinted background
            "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
          : // Idle: subtle border with lift on hover
            "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40 hover:shadow-sm hover:-translate-y-0.5"
      )}
    >
      {/* Icon container — tinted when active */}
      <div
        className={cn(
          "mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
          isActive
            ? "bg-[var(--primary)] text-white"
            : "bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold leading-tight",
            isActive ? "text-[var(--primary)]" : "text-[var(--foreground)]"
          )}
        >
          {title}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-snug">
          {description}
        </p>
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <div className="ml-auto mt-1 w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
      )}
    </button>
  );
}

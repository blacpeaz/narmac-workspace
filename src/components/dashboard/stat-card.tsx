"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY_SYMBOL } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

function formatValue(value: string | number, isCurrency: boolean): string {
  if (typeof value === "number" || !isNaN(Number(value))) {
    const num = typeof value === "number" ? value : Number(value);
    const suffix = isCurrency ? ` ${CURRENCY_SYMBOL}` : "";
    const formatted = num.toLocaleString(undefined, { minimumFractionDigits: isCurrency ? 2 : 0 });
    return `${formatted}${suffix}`;
  }
  return String(value);
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
  isCurrency?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = "var(--primary)",
  subtitle,
  isCurrency = false,
}: StatCardProps) {
  const display = formatValue(value, isCurrency);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              {title}
            </p>
            <p
              className="text-2xl font-bold mt-1"
              style={{ color }}
            >
              {display}
            </p>
            {subtitle && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

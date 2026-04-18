"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color = "var(--primary)",
  subtitle,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              {title}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

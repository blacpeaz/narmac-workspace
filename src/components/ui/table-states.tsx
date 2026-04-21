"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders three skeleton rows inside a padded container — used as the loading
 * placeholder for data tables while their query is in-flight.
 */
export function TableLoadingSkeleton() {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

interface TableEmptyStateProps {
  /** Message to display when there is no data. */
  message: string;
  /** Number of columns the empty row should span. Defaults to 10. */
  colSpan?: number;
}

/**
 * Renders a centred empty-state message inside a table cell.
 * Use this as the sole `<TableRow>` inside `<TableBody>` when the data array is empty.
 */
export function TableEmptyRow({ message, colSpan = 10 }: TableEmptyStateProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="p-12 text-center text-[var(--muted-foreground)]"
      >
        {message}
      </td>
    </tr>
  );
}

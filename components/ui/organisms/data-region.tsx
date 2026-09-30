import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataRegionProps {
  children: ReactNode;
  className?: string;
}

/** Full-width filter and table plane. Structural separators live on the table, not an outer card. */
export function DataRegion({ children, className }: DataRegionProps) {
  return (
    <section className={cn("console-data-region w-full min-w-0", className)}>{children}</section>
  );
}

"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { buildMuxonMarkSvg } from "@/lib/muxon-logo-svg";

export type BrandMarkProps = {
  className?: string;
  /** Logical display size in pixels */
  size?: number;
};

/** Single Muxon mark. Stroke gradient follows the OSS or Enterprise primary palette. */
export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  const id = `mk${useId().replace(/:/g, "")}`;
  const svg = buildMuxonMarkSvg(id, "var(--brand-mark-from)", "var(--brand-mark-to)");

  return (
    <span
      className={cn("inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

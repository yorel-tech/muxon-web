"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { buildMuxonLockupSvg, LOCKUP_ASPECT } from "@/lib/muxon-logo-svg";

export type BrandLockupTone = "bar" | "theme" | "onDark";

export type BrandLockupProps = {
  className?: string;
  /** Rendered height in pixels. Width follows the lockup aspect ratio. */
  height?: number;
  /**
   * `bar` — dark gray mark and word on the blue top bar.
   * `theme` — mark in the edition theme color, word two shades darker (light surfaces).
   * `onDark` — same relationship, using lighter theme shades so it stays readable on a dark page.
   */
  tone?: BrandLockupTone;
};

const TONE_COLORS: Record<BrandLockupTone, { mark: string; word: string }> = {
  bar: { mark: "var(--brand-on-bar)", word: "var(--brand-on-bar)" },
  theme: { mark: "var(--brand-lockup-mark)", word: "var(--brand-lockup-word)" },
  onDark: { mark: "var(--brand-on-dark-mark)", word: "var(--brand-on-dark-word)" },
};

/** Muxon mark plus wordmark. */
export function BrandLockup({ className, height = 32, tone = "theme" }: BrandLockupProps) {
  const id = `lk${useId().replace(/:/g, "")}`;
  const { mark, word } = TONE_COLORS[tone];
  const svg = buildMuxonLockupSvg(id, mark, word);

  return (
    <span
      className={cn("inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full", className)}
      style={{ height, width: Math.round(height * LOCKUP_ASPECT) }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

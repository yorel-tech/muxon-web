"use client";

import { useEffect } from "react";
import { useProductInfo } from "@lib/product-info-context";
import { buildMuxonMarkSvg } from "@/lib/muxon-logo-svg";

/** Persisted color scheme for Enterprise (Core is always light). */
export const MUXON_UI_THEME_KEY = "muxon-ui-theme";

function applyBrandFavicon() {
  const from = getComputedStyle(document.documentElement)
    .getPropertyValue("--brand-mark-from")
    .trim();
  const to = getComputedStyle(document.documentElement).getPropertyValue("--brand-mark-to").trim();
  if (!from || !to) return;
  const href = `data:image/svg+xml,${encodeURIComponent(buildMuxonMarkSvg("favicon", from, to))}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
}

/**
 * Sets `data-edition` on <html> for CSS tokens. Core forces light mode; Enterprise respects
 * `localStorage` `muxon-ui-theme` (`light` | `dark`).
 */
export function EditionThemeSync() {
  const { edition, loading } = useProductInfo();

  useEffect(() => {
    if (loading) return;
    const root = document.documentElement;
    const ed = edition.toLowerCase();
    const isEnterpriseEdition = ed === "enterprise";
    root.dataset.edition = isEnterpriseEdition ? ed : "core";

    if (!isEnterpriseEdition) {
      root.classList.remove("dark");
    } else {
      const pref = localStorage.getItem(MUXON_UI_THEME_KEY);
      if (pref === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }

    applyBrandFavicon();
  }, [edition, loading]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => applyBrandFavicon());
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-edition"] });
    return () => observer.disconnect();
  }, []);

  return null;
}

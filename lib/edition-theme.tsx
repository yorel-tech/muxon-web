"use client";

import { useEffect } from "react";
import { useProductInfo } from "@lib/product-info-context";

/** Persisted color scheme for Enterprise (Core is always light). */
export const MUXON_UI_THEME_KEY = "muxon-ui-theme";

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
      return;
    }

    const pref = localStorage.getItem(MUXON_UI_THEME_KEY);
    if (pref === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [edition, loading]);

  return null;
}

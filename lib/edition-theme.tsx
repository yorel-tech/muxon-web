'use client';

import { useEffect } from 'react';
import { useProductInfo } from '@lib/product-info-context';

/** Persisted color scheme for Nexus / Enterprise (Core is always light). */
export const INFRON_UI_THEME_KEY = 'infron-ui-theme';

/**
 * Sets `data-edition` on <html> for CSS tokens. Core forces light mode; Nexus respects
 * `localStorage` `infron-ui-theme` (`light` | `dark`).
 */
export function EditionThemeSync() {
  const { edition, loading } = useProductInfo();

  useEffect(() => {
    if (loading) return;
    const root = document.documentElement;
    const ed = edition.toLowerCase();
    const isNexus = ed === 'nexus' || ed === 'enterprise';
    root.dataset.edition = isNexus ? ed : 'core';

    if (!isNexus) {
      root.classList.remove('dark');
      return;
    }

    const pref = localStorage.getItem(INFRON_UI_THEME_KEY);
    if (pref === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [edition, loading]);

  return null;
}

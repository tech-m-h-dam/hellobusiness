"use client";

/**
 * The app's UI language.
 *
 * Kept in a tiny Zustand store rather than React context so any component can
 * read it without the whole editor tree being wrapped in a provider, and
 * persisted to localStorage (not IndexedDB) because it's a single short string
 * that we want available synchronously on first paint.
 */
import { useEffect } from "react";
import { create } from "zustand";
import { type AppLocale, type MessageKey, isAppLocale, translate } from "./messages";

const STORAGE_KEY = "app-locale";

type LocaleState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    set({ locale });
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    } catch {
      // Private browsing or blocked storage — the choice just won't persist.
    }
  },
}));

/**
 * Restore the saved language once on mount.
 *
 * Deliberately not read during render: the server renders `en`, so reading
 * localStorage while rendering would produce a hydration mismatch. Applying it
 * in an effect means a saved non-English choice paints English for one frame,
 * which is the correct trade against a hydration error.
 */
export function useRestoreLocale() {
  const setLocale = useLocaleStore((s) => s.setLocale);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && isAppLocale(saved) && saved !== "en") setLocale(saved);
    } catch {
      /* ignore */
    }
  }, [setLocale]);
}

/** `const t = useT(); t("downloadPdf")` */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: MessageKey) => translate(locale, key);
}

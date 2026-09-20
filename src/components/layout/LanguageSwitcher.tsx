"use client";

import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LOCALES, LOCALE_NAMES, type AppLocale } from "@/lib/i18n/messages";
import { useLocaleStore, useT } from "@/lib/i18n/use-locale";

/** Switches the language of the editor interface (not the invoice document). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useT();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Languages className="hidden size-4 shrink-0 text-ink-400 sm:block" aria-hidden="true" />
      <Select value={locale} onValueChange={(v) => setLocale(v as AppLocale)}>
        {/*
         * Narrow on small screens: the full language name plus the primary CTA
         * overflowed the header below ~800px and forced horizontal page scroll.
         * The selected value is shown as a short code there instead.
         */}
        <SelectTrigger
          className="h-8 w-[4.25rem] px-2 sm:w-36 sm:px-3"
          aria-label={t("language")}
        >
          {/*
           * The label is rendered directly rather than through <SelectValue>:
           * SelectValue emits its own element, so pairing it with a responsive
           * short code showed both at once on small screens.
           */}
          <span className="truncate sm:hidden">{locale.toUpperCase()}</span>
          <span className="hidden truncate sm:inline">{LOCALE_NAMES[locale]}</span>
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((l) => (
            <SelectItem key={l} value={l}>
              {LOCALE_NAMES[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

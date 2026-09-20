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
         * Narrow until the header has room for the full language name, which
         * is not until `lg`: that is where the nav links and the long form of
         * the primary CTA also appear. This used to widen at `sm` (640px),
         * which put roughly 100px of language name into a header that was
         * already full between 640px and 1024px and scrolled the page
         * sideways. The selected value is shown as a short code below that.
         */}
        <SelectTrigger
          className="h-8 w-[4.25rem] px-2 lg:w-36 lg:px-3"
          aria-label={t("language")}
        >
          {/*
           * The label is rendered directly rather than through <SelectValue>:
           * SelectValue emits its own element, so pairing it with a responsive
           * short code showed both at once on small screens.
           *
           * Both forms are wrapped in one span because SelectTrigger styles
           * its direct span children (`[&>span]:line-clamp-1`), and that
           * descendant selector outranks a plain `hidden` on the span itself —
           * so as direct children neither could ever be hidden and the trigger
           * showed the code and the name at once, each ellipsised to a letter.
           */}
          <span>
            <span className="truncate lg:hidden">{locale.toUpperCase()}</span>
            <span className="hidden truncate lg:inline">{LOCALE_NAMES[locale]}</span>
          </span>
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

"use client";

import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES, LOCALE_NAMES, type AppLocale } from "@/lib/i18n/messages";
import { useLocaleStore, useT } from "@/lib/i18n/use-locale";

/** Switches the language of the editor interface (not the invoice document). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useT();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Languages className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
      <Select value={locale} onValueChange={(v) => setLocale(v as AppLocale)}>
        <SelectTrigger className="h-8 w-36" aria-label={t("language")}>
          <SelectValue />
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

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/contexts/user-context";
import { type Locale, localeNames, locales } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Changes the site's language: same page in the other language, kept for the
 * next visits (cookie), and saved on the account so e-mails and notifications
 * follow.
 */
export default function LanguageSelect({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const { isAuthenticated } = useUser();
  const save = trpc.auth.setLanguage.useMutation();

  const change = async (next: Locale) => {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    if (isAuthenticated) await save.mutateAsync({ language: next }).catch(() => null);
    const { pathname, search, hash } = window.location;
    const path = pathname.replace(/^\/(fr|en|pt|ar)(?=\/|$)/, `/${next}`);
    // A full load: the page direction (Arabic) and server texts change too.
    window.location.assign(`${path}${search}${hash}`);
  };

  return (
    <Select value={locale} onValueChange={(value) => value && void change(value as Locale)}>
      <SelectTrigger
        aria-label={t("language.choose")}
        className={cn("rounded-full border-[#d7e6f4] bg-white", className)}
      >
        <LanguagesIcon className="size-4 text-slate-500" aria-hidden />
        <SelectValue>{localeNames[locale as Locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((code) => (
          <SelectItem key={code} value={code} label={localeNames[code]}>
            <span lang={code} dir={code === "ar" ? "rtl" : "ltr"}>
              {localeNames[code]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

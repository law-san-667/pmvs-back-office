import { LocalePrefix, Pathnames } from "next-intl/routing";

export const locales = ["fr", "en", "pt", "ar"] as const;

export type Locales = typeof locales;
export type Locale = Locales[number];

export const defaultLocale: Locale = "fr";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value);

/** Each language named in itself, for the language menu. */
export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  pt: "Português",
  ar: "العربية",
};

/** Arabic is written right to left. */
export const localeDirection = (locale: string) => (locale === "ar" ? "rtl" : "ltr");

/** For Intl: dates and numbers of each language, Latin digits in Arabic too. */
export const intlLocale = (locale: string) =>
  ({ fr: "fr-FR", en: "en-GB", pt: "pt-PT", ar: "ar-u-nu-latn" })[locale] ?? "fr-FR";

export const pathnames: Pathnames<Locales> = {
  "/": "/",
  "/auth": "/auth",
  "/pathnames": "/pathnames",
};

export const localePrefix: LocalePrefix<Locales> = "always";

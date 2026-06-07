import { LocalePrefix, Pathnames } from "next-intl/routing";

export const locales = ["fr", "en", "pt"] as const;

export type Locales = typeof locales;

export const pathnames: Pathnames<Locales> = {
  "/": "/",
  "/auth": "/auth",
  "/pathnames": "/pathnames",
};

export const localePrefix: LocalePrefix<Locales> = "always";

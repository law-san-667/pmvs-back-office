import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "./config";

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const resolvedLocale = locale ?? (await requestLocale);

  if (
    !resolvedLocale ||
    !locales.includes(resolvedLocale as (typeof locales)[number])
  ) {
    console.warn(`Locale "${resolvedLocale}" not found`);
    notFound();
  }

  return {
    messages: (await import(`./locales/${resolvedLocale}.json`)).default,
    locale: resolvedLocale,
  };
});

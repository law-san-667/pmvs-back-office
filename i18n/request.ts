import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "./config";
import { messages } from "./messages";

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const resolvedLocale = locale ?? (await requestLocale);

  if (!isLocale(resolvedLocale)) {
    console.warn(`Locale "${resolvedLocale}" not found`);
    notFound();
  }

  return {
    messages: messages[resolvedLocale],
    locale: resolvedLocale,
  };
});

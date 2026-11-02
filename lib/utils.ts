import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { intlLocale } from "@/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "12 500 XOF" in French, "12,500 XOF" in English: pass the page's locale. */
export function formatPrice(amountMinor: number, currency: string, locale = "fr") {
  return new Intl.NumberFormat(intlLocale(locale)).format(amountMinor) + " " + currency;
}

/** A number written for the page's language (Latin digits everywhere). */
export function formatNumber(value: number, locale = "fr", options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

/** A date written for the page's language: "2 novembre 2026", "2 November 2026"… */
export function formatDate(
  value: string | number | Date,
  locale = "fr",
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
) {
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(new Date(value));
}


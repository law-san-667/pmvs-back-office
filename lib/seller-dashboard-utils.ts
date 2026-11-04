import { intlLocale } from "@/i18n/config";

export const formatMoney = (
  amountMinor: number,
  currency: string,
  locale = "fr",
) => {
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amountMinor);
  } catch {
    return `${amountMinor.toLocaleString(intlLocale(locale))} ${currency}`;
  }
};

export const formatDate = (date: string, withTime = false, locale = "fr") =>
  new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(date));

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const getListingImage = (images: unknown) => {
  if (!Array.isArray(images)) return null;

  return (
    images
      .filter(
        (image): image is { order?: number; url: string } =>
          typeof image === "object" &&
          image !== null &&
          "url" in image &&
          typeof image.url === "string",
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.url ?? null
  );
};

export const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

/** "#3EE53124", kept in this order inside Arabic text (left-to-right isolate). */
export const getOrderReference = (id: string) =>
  `\u2066#${id.slice(0, 8).toUpperCase()}\u2069`;

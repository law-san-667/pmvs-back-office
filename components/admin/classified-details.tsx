"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { intlLocale } from "@/i18n/config";
import { formatDate } from "@/lib/seller-dashboard-utils";
import type { Classified } from "@/server/trpc/_procedures/classifieds";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const STATUS_CLASSES: Record<Classified["status"] | "EXPIRED", string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PUBLISHED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-600",
  EXPIRED: "border-slate-200 bg-slate-50 text-slate-600",
};

/** A closed classified cannot be moderated any more (backend rule). */
export const canApprove = (classified: Classified) =>
  classified.status !== "PUBLISHED" && classified.status !== "CLOSED";
export const canReject = (classified: Classified) =>
  classified.status !== "REJECTED" && classified.status !== "CLOSED";

export function ClassifiedStatusBadge({
  classified,
  short = false,
}: {
  classified: Classified;
  short?: boolean;
}) {
  const t = useTranslations("adminClassifieds");
  const status =
    classified.status === "PUBLISHED" && !classified.isActive
      ? "EXPIRED"
      : classified.status;
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {short && status === "PENDING"
        ? t("pendingShort")
        : t(`status.${status}`)}
    </Badge>
  );
}

/** Labels shared by the table and the detail panel. */
export function useClassifiedFormat() {
  const t = useTranslations("adminClassifieds");
  const locale = useLocale();
  const lang = intlLocale(locale);

  const country = (code: string) => {
    try {
      return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };
  const quantity = (classified: Classified) =>
    classified.quantity === null
      ? null
      : [classified.quantity.toLocaleString(lang), classified.unit]
          .filter(Boolean)
          .join(" ");
  const price = (classified: Classified) => {
    if (classified.priceMinor === null) return null;
    let text: string;
    try {
      const format = new Intl.NumberFormat(lang, {
        style: "currency",
        currency: classified.currency,
      });
      const digits = format.resolvedOptions().maximumFractionDigits ?? 0;
      text = format.format(classified.priceMinor / 10 ** digits);
    } catch {
      text = `${classified.priceMinor.toLocaleString(lang)} ${classified.currency}`;
    }
    return classified.unit
      ? t("pricePerUnit", { price: text, unit: classified.unit })
      : text;
  };
  const publisher = (classified: Classified) =>
    classified.publisherBusiness?.name ?? classified.publisherName ?? "—";
  const diffusion = (classified: Classified) =>
    classified.diffusionScope === "COUNTRIES" &&
    classified.diffusionCountries.length
      ? `${t(`diffusion.${classified.diffusionScope}`)} (${classified.diffusionCountries.map(country).join(", ")})`
      : t(`diffusion.${classified.diffusionScope}`);
  const category = (classified: Classified) =>
    [classified.category.name, classified.subCategory?.name]
      .filter(Boolean)
      .join(" › ");
  const date = (value: string | null, withTime = false) =>
    value ? formatDate(value, withTime, locale) : null;

  return { country, quantity, price, publisher, diffusion, category, date };
}

/** Lot H « offre commerciale » fields, in display order. */
const COMMERCIAL_FIELDS = [
  "productName",
  "productModel",
  "productBrand",
  "hsCode",
  "productionCapacity",
  "deliveryLead",
  "minimumOrder",
  "certifications",
  "paymentTerms",
] as const satisfies readonly (keyof Classified)[];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">
        <bdi>{value || "—"}</bdi>
      </span>
    </div>
  );
}

/** Side panel with everything the moderator needs to decide. */
export function ClassifiedSheet({
  classified,
  isPending,
  onClose,
  onApprove,
  onReject,
}: {
  classified: Classified;
  isPending: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations("adminClassifieds");
  const format = useClassifiedFormat();
  const commercialFields = COMMERCIAL_FIELDS.filter(
    (field) => classified[field],
  );
  const hasCommercialDetails =
    Boolean(classified.originCountryCode) || commercialFields.length > 0;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2 pe-8">
            <Badge variant="secondary">
              {t(`typeLong.${classified.type}`)}
            </Badge>
            <ClassifiedStatusBadge classified={classified} />
          </div>
          <SheetTitle className="text-lg">
            <bdi>{classified.title}</bdi>
          </SheetTitle>
          <SheetDescription>
            <bdi>{format.publisher(classified)}</bdi> ·{" "}
            {t(`profile.${classified.publisherProfile}`)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
          {classified.status === "REJECTED" && classified.moderationReason && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">{t("fields.moderationReason")}</p>
              <p className="mt-1 whitespace-pre-line">
                {classified.moderationReason}
              </p>
            </div>
          )}

          <section>
            <h3 className="mb-1 text-sm font-semibold">
              {t("fields.description")}
            </h3>
            <p
              dir="auto"
              className="text-sm leading-relaxed break-words whitespace-pre-line"
            >
              {classified.description}
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("fields.images")}</h3>
            {classified.images.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {classified.images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={classified.title}
                      className="bg-muted aspect-square w-full rounded-lg object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("noImages")}</p>
            )}
          </section>

          <section className="divide-y">
            <Row
              label={t("fields.publisher")}
              value={format.publisher(classified)}
            />
            <Row
              label={
                classified.type === "OFFER"
                  ? t("fields.productRole")
                  : t("fields.profile")
              }
              value={t(`profile.${classified.publisherProfile}`)}
            />
            <Row
              label={t("fields.category")}
              value={format.category(classified)}
            />
            <Row
              label={t("fields.location")}
              value={[classified.city, format.country(classified.countryCode)]
                .filter(Boolean)
                .join(", ")}
            />
            <Row
              label={t("fields.diffusion")}
              value={format.diffusion(classified)}
            />
            <Row
              label={t("fields.quantity")}
              value={format.quantity(classified)}
            />
            <Row
              label={t("fields.price")}
              value={
                format.price(classified) && (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {format.price(classified)}
                    {classified.priceKind && (
                      <Badge variant="outline">
                        {t(`priceKind.${classified.priceKind}`)}
                      </Badge>
                    )}
                  </span>
                )
              }
            />
            <Row label={t("fields.incoterm")} value={classified.incoterm} />
            <Row
              label={t("fields.createdAt")}
              value={format.date(classified.createdAt, true)}
            />
            <Row
              label={t("fields.updatedAt")}
              value={format.date(classified.updatedAt, true)}
            />
            <Row
              label={t("fields.publishedAt")}
              value={format.date(classified.publishedAt, true)}
            />
            <Row
              label={t("fields.expiresAt")}
              value={format.date(classified.expiresAt)}
            />
          </section>

          {hasCommercialDetails && (
            <section>
              <h3 className="mb-1 text-sm font-semibold">
                {t(`commercial.${classified.type}`)}
              </h3>
              <div className="divide-y">
                {classified.originCountryCode && (
                  <Row
                    label={t("fields.originCountry")}
                    value={format.country(classified.originCountryCode)}
                  />
                )}
                {commercialFields.map((field) => (
                  <Row
                    key={field}
                    label={t(`fields.${field}`)}
                    value={classified[field]}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {(canApprove(classified) || canReject(classified)) && (
          <SheetFooter className="flex-row justify-end gap-2 border-t">
            {canReject(classified) && (
              <Button variant="outline" disabled={isPending} onClick={onReject}>
                <XCircleIcon /> {t("reject")}
              </Button>
            )}
            {canApprove(classified) && (
              <Button disabled={isPending} onClick={onApprove}>
                <CheckCircle2Icon /> {t("approve")}
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

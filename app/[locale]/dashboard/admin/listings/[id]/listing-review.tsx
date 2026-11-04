"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ListingModerationDialog } from "@/components/admin/listing-moderation-dialog";
import IsLoadingScreen from "@/components/is-loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/i18n/navigation";
import { MODERATION_STATUS_CLASSES } from "@/lib/moderation-utils";
import { formatDate, formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ImageIcon,
  XCircleIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground col-span-1">{label}</span>
      <span className="col-span-2 break-words">{value || "—"}</span>
    </div>
  );
}

const imageUrls = (images: unknown): string[] => {
  if (!Array.isArray(images)) return [];

  return images
    .filter(
      (image): image is { order?: number; url: string } =>
        typeof image === "object" &&
        image !== null &&
        "url" in image &&
        typeof image.url === "string",
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((image) => image.url);
};

export function AdminListingReview({ id }: { id: string }) {
  const t = useTranslations("adminCommerce");
  const tProducts = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );

  const listing = trpc.admin.listing.useQuery({ id });
  const business = trpc.admin.business.useQuery(
    { idOrSlug: listing.data?.businessId ?? "" },
    { enabled: Boolean(listing.data?.businessId) },
  );

  const refresh = async () => {
    await Promise.all([
      utils.admin.listing.invalidate({ id }),
      utils.admin.listings.invalidate(),
      utils.admin.moderationSummary.invalidate(),
    ]);
  };

  if (listing.isLoading) {
    return <IsLoadingScreen text={t("listing.loading")} />;
  }

  if (listing.error || !listing.data) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/admin/listings")}
        >
          <ArrowLeftIcon /> {t("common.back")}
        </Button>
        <p className="text-destructive text-sm">
          {listing.error?.message ?? t("listing.notFound")}
        </p>
      </div>
    );
  }

  const value = listing.data;
  const images = imageUrls(value.images);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <Button
        variant="ghost"
        className="w-fit"
        onClick={() => router.push("/dashboard/admin/listings")}
      >
        <ArrowLeftIcon /> {t("listing.backToModeration")}
      </Button>

      <AdminPageHeader
        title={value.title}
        description={t(
          value.isService
            ? "listing.submittedService"
            : "listing.submittedProduct",
          {
            date: formatDate(
              value.submittedForReviewAt ?? value.createdAt,
              true,
              locale,
            ),
          },
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={MODERATION_STATUS_CLASSES[value.moderationStatus]}
        >
          {tProducts(`moderation.${value.moderationStatus}`)}
        </Badge>
        <Badge variant="outline">
          {t.has(`listingStatus.${value.status}`)
            ? t(`listingStatus.${value.status}`)
            : value.status}
        </Badge>
        <div className="ms-auto flex flex-wrap gap-2">
          {value.moderationStatus !== "APPROVED" && (
            <Button onClick={() => setDecision("APPROVED")}>
              <CheckCircle2Icon /> {t("common.approve")}
            </Button>
          )}
          {value.moderationStatus !== "REJECTED" && (
            <Button
              variant="destructive"
              onClick={() => setDecision("REJECTED")}
            >
              <XCircleIcon /> {t("common.reject")}
            </Button>
          )}
        </div>
      </div>

      {value.moderationStatus === "REJECTED" && value.moderationReason && (
        <div className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-sm">
          <p className="font-medium">{t("listing.rejectionReason")}</p>
          <p className="text-muted-foreground">{value.moderationReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("listing.media", { count: images.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="bg-muted text-muted-foreground flex h-32 items-center justify-center rounded-lg">
                <ImageIcon className="size-6" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={value.title}
                      className="bg-muted size-32 rounded-lg object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("listing.offer")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              label={t("listing.price")}
              value={
                value.priceAmountMinor < 0
                  ? t("listings.onQuote")
                  : formatMoney(value.priceAmountMinor, value.currency, locale)
              }
            />
            <Row label={t("listing.stock")} value={value.quantityAvailable} />
            <Row
              label={t("listing.location")}
              value={`${value.cities?.join(", ") || "—"} (${value.countryCode})`}
            />
            <Row label={t("listing.condition")} value={value.condition} />
            <Separator className="my-2" />
            <Row
              label={t("listing.supplier")}
              value={
                business.data ? (
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() =>
                      router.push(
                        `/dashboard/admin/businesses/${value.businessId}`,
                      )
                    }
                  >
                    {business.data.name}
                  </button>
                ) : (
                  value.businessId.slice(0, 8)
                )
              }
            />
            <Row
              label={t("listing.lastModeration")}
              value={
                value.moderatedAt
                  ? formatDate(value.moderatedAt, true, locale)
                  : null
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("listing.description")}</CardTitle>
          </CardHeader>
          <CardContent>
            {value.description ? (
              <div
                className="prose prose-sm max-w-none"
                // The description is rich text authored by the seller; it is
                // exactly what the moderator needs to review.
                dangerouslySetInnerHTML={{ __html: value.description }}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("listing.noDescription")}
              </p>
            )}
            {value.specificsSections?.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {value.specificsSections.map((section) => (
                  <div key={section.title}>
                    <p className="text-sm font-medium">{section.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {section.items
                        .map((item) => String(item.value ?? item.label))
                        .join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {decision && (
        <ListingModerationDialog
          listing={value}
          decision={decision}
          onClose={() => setDecision(null)}
          onModerated={refresh}
        />
      )}
    </div>
  );
}

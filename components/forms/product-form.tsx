"use client";

import EnterpriseProductForm from "@/components/forms/enterprise-product-form";
import IndividualProductForm from "@/components/forms/individual-product-form";
import IsLoadingScreen from "@/components/is-loading-screen";
import { useBusiness } from "@/contexts/business-context";
import { isLegalBusinessCategory } from "@/lib/business-categories";
import type { Listing } from "@/lib/validators/listings-services";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";

/**
 * Picks the product sheet matching the supplier's categorisation:
 * SMEs and large enterprises fill the detailed 5-step sheet, physical
 * persons the short one. Waits for the listing when editing so the forms
 * can initialise from it directly.
 */
export default function ProductForm({ listingId }: { listingId?: string }) {
  const t = useTranslations("productForm");
  const { business, isLoading: isBusinessLoading } = useBusiness();
  const listingDetail = trpc.listings.detail.useQuery(
    { id: listingId ?? "" },
    { enabled: Boolean(listingId) },
  );

  if (isBusinessLoading || (listingId && listingDetail.isLoading)) {
    return <IsLoadingScreen text={t("loading")} />;
  }

  if (listingId && (listingDetail.error || !listingDetail.data)) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">
          {listingDetail.error?.message ?? t("notFound")}
        </p>
      </div>
    );
  }

  const listing = listingId ? listingDetail.data : undefined;

  return (
    <>
      {listing && <ModerationBanner listing={listing} />}
      {isLegalBusinessCategory(business?.businessCategory) ? (
        <EnterpriseProductForm key={listing?.id ?? "new"} listing={listing} />
      ) : (
        <IndividualProductForm key={listing?.id ?? "new"} listing={listing} />
      )}
    </>
  );
}

/** Tells the seller where their listing stands in the review queue. */
function ModerationBanner({ listing }: { listing: Listing }) {
  const t = useTranslations("productForm.moderation");
  if (listing.moderationStatus === "APPROVED") return null;

  const isRejected = listing.moderationStatus === "REJECTED";

  return (
    <div
      className={`mx-4 mt-4 rounded-md border p-3 text-sm lg:mx-6 ${
        isRejected
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <p className="font-medium">
        {isRejected ? t("rejectedTitle") : t("pendingTitle")}
      </p>
      <p className="text-muted-foreground">
        {isRejected
          ? listing.moderationReason ?? t("rejectedHint")
          : t("pendingHint")}
      </p>
    </div>
  );
}

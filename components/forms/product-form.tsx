"use client";

import EnterpriseProductForm from "@/components/forms/enterprise-product-form";
import IndividualProductForm from "@/components/forms/individual-product-form";
import IsLoadingScreen from "@/components/is-loading-screen";
import { useBusiness } from "@/contexts/business-context";
import { isLegalBusinessCategory } from "@/lib/business-categories";
import { trpc } from "@/server/trpc/client";

/**
 * Picks the product sheet matching the supplier's categorisation:
 * SMEs and large enterprises fill the detailed 5-step sheet, physical
 * persons the short one. Waits for the listing when editing so the forms
 * can initialise from it directly.
 */
export default function ProductForm({ listingId }: { listingId?: string }) {
  const { business, isLoading: isBusinessLoading } = useBusiness();
  const listingDetail = trpc.listings.detail.useQuery(
    { id: listingId ?? "" },
    { enabled: Boolean(listingId) },
  );

  if (isBusinessLoading || (listingId && listingDetail.isLoading)) {
    return <IsLoadingScreen text="Chargement..." />;
  }

  if (listingId && (listingDetail.error || !listingDetail.data)) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">
          {listingDetail.error?.message ?? "Produit introuvable."}
        </p>
      </div>
    );
  }

  const listing = listingId ? listingDetail.data : undefined;

  return isLegalBusinessCategory(business?.businessCategory) ? (
    <EnterpriseProductForm key={listing?.id ?? "new"} listing={listing} />
  ) : (
    <IndividualProductForm key={listing?.id ?? "new"} listing={listing} />
  );
}

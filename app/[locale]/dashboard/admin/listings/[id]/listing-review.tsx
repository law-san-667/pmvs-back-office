"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ListingModerationDialog } from "@/components/admin/listing-moderation-dialog";
import IsLoadingScreen from "@/components/is-loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/i18n/navigation";
import {
  LISTING_STATUS_LABELS,
  MODERATION_STATUS_CLASSES,
  MODERATION_STATUS_LABELS,
} from "@/lib/moderation-utils";
import { formatDate, formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ImageIcon,
  XCircleIcon,
} from "lucide-react";
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
    return <IsLoadingScreen text="Chargement de l'annonce..." />;
  }

  if (listing.error || !listing.data) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/admin/listings")}
        >
          <ArrowLeftIcon /> Retour
        </Button>
        <p className="text-destructive text-sm">
          {listing.error?.message ?? "Annonce introuvable."}
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
        <ArrowLeftIcon /> Retour à la modération
      </Button>

      <AdminPageHeader
        title={value.title}
        description={`${value.isService ? "Service" : "Produit"} soumis le ${formatDate(
          value.submittedForReviewAt ?? value.createdAt,
          true,
        )}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={MODERATION_STATUS_CLASSES[value.moderationStatus]}
        >
          {MODERATION_STATUS_LABELS[value.moderationStatus]}
        </Badge>
        <Badge variant="outline">
          {LISTING_STATUS_LABELS[value.status] ?? value.status}
        </Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          {value.moderationStatus !== "APPROVED" && (
            <Button onClick={() => setDecision("APPROVED")}>
              <CheckCircle2Icon /> Valider
            </Button>
          )}
          {value.moderationStatus !== "REJECTED" && (
            <Button
              variant="destructive"
              onClick={() => setDecision("REJECTED")}
            >
              <XCircleIcon /> Refuser
            </Button>
          )}
        </div>
      </div>

      {value.moderationStatus === "REJECTED" && value.moderationReason && (
        <div className="border-destructive/30 bg-destructive/5 rounded-md border p-3 text-sm">
          <p className="font-medium">Motif du refus communiqué au vendeur</p>
          <p className="text-muted-foreground">{value.moderationReason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Médias ({images.length})</CardTitle>
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
            <CardTitle>Offre</CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              label="Prix"
              value={
                value.priceAmountMinor < 0
                  ? "Sur devis"
                  : formatMoney(value.priceAmountMinor, value.currency)
              }
            />
            <Row label="Stock" value={value.quantityAvailable} />
            <Row
              label="Localisation"
              value={`${value.cities?.join(", ") || "—"} (${value.countryCode})`}
            />
            <Row label="État" value={value.condition} />
            <Separator className="my-2" />
            <Row
              label="Fournisseur"
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
              label="Dernière modération"
              value={
                value.moderatedAt ? formatDate(value.moderatedAt, true) : null
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
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
                Aucune description fournie.
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

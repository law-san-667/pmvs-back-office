"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { ListingModerationDialog } from "@/components/admin/listing-moderation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import type { AdminListing } from "@/lib/admin-types";
import {
  LISTING_STATUS_LABELS,
  MODERATION_STATUS_CLASSES,
  MODERATION_STATUS_LABELS,
} from "@/lib/moderation-utils";
import {
  formatDate,
  formatMoney,
  getListingImage,
} from "@/lib/seller-dashboard-utils";
import type { ListingModerationStatus } from "@/lib/backend-resource-types";
import { trpc } from "@/server/trpc/client";
import {
  CheckCircle2Icon,
  EyeIcon,
  ImageIcon,
  MoreHorizontalIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type TypeFilter = "ALL" | "PRODUCT" | "SERVICE";
type ModerationFilter = "ALL" | ListingModerationStatus;

type ModerationTarget = {
  listing: AdminListing;
  decision: "APPROVED" | "REJECTED";
};

const QUEUE_TABS: { label: string; value: ModerationFilter }[] = [
  { label: "À valider", value: "PENDING" },
  { label: "Validés", value: "APPROVED" },
  { label: "Refusés", value: "REJECTED" },
  { label: "Tout", value: "ALL" },
];

export default function AdminListingsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [moderationFilter, setModerationFilter] =
    useState<ModerationFilter>("PENDING");
  const [target, setTarget] = useState<ModerationTarget | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const summary = trpc.admin.moderationSummary.useQuery();
  const listings = trpc.admin.listings.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    title: deferredSearch || undefined,
    isService:
      typeFilter === "ALL" ? undefined : typeFilter === "SERVICE" ? true : false,
    moderationStatus:
      moderationFilter === "ALL" ? undefined : moderationFilter,
  });

  const refresh = async () => {
    await Promise.all([
      utils.admin.listings.invalidate(),
      utils.admin.listing.invalidate(),
      utils.admin.moderationSummary.invalidate(),
      utils.admin.stats.invalidate(),
    ]);
  };

  const countFor = (value: ModerationFilter) => {
    if (!summary.data) return null;
    if (value === "ALL") {
      return (
        summary.data.pending + summary.data.approved + summary.data.rejected
      );
    }
    return summary.data[
      value.toLowerCase() as "pending" | "approved" | "rejected"
    ];
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Modération des produits & services"
        description="Chaque annonce publiée par un fournisseur doit être validée avant d'être visible par les acheteurs."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {QUEUE_TABS.find((tab) => tab.value === moderationFilter)?.label} (
            {listings.data?.total ?? 0})
          </CardTitle>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as TypeFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label="Filtrer par type"
              >
                <option value="ALL">Tout</option>
                <option value="PRODUCT">Produits</option>
                <option value="SERVICE">Services</option>
              </select>
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Rechercher..."
                  className="h-9 w-56 pl-8"
                />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <div className="flex flex-wrap gap-2">
            {QUEUE_TABS.map((tab) => {
              const count = countFor(tab.value);
              return (
                <Button
                  key={tab.value}
                  size="sm"
                  variant={
                    moderationFilter === tab.value ? "default" : "outline"
                  }
                  onClick={() => {
                    setModerationFilter(tab.value);
                    setPage(1);
                  }}
                >
                  {tab.label}
                  {count !== null && ` (${count})`}
                </Button>
              );
            })}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élément</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Soumis le</TableHead>
                <TableHead>Publication</TableHead>
                <TableHead>Modération</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={8}
                isLoading={listings.isLoading}
                error={listings.error?.message}
                isEmpty={!listings.data?.items.length}
                loadingLabel="Chargement du catalogue..."
                emptyLabel={
                  moderationFilter === "PENDING"
                    ? "Aucune annonce en attente de validation."
                    : "Aucun produit ou service trouvé."
                }
              />
              {listings.data?.items.map((listing) => {
                const image = getListingImage(listing.images);

                return (
                  <TableRow
                    key={listing.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/admin/listings/${listing.id}`)
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={listing.title}
                            className="bg-muted size-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-lg">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          {listing.moderationStatus === "REJECTED" &&
                            listing.moderationReason && (
                              <p className="text-muted-foreground max-w-xs truncate text-xs">
                                {listing.moderationReason}
                              </p>
                            )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {listing.isService ? "Service" : "Produit"}
                    </TableCell>
                    <TableCell>{listing.countryCode}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {listing.priceAmountMinor < 0
                        ? "Sur devis"
                        : formatMoney(
                            listing.priceAmountMinor,
                            listing.currency,
                          )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(
                        listing.submittedForReviewAt ?? listing.createdAt,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {LISTING_STATUS_LABELS[listing.status] ??
                          listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          MODERATION_STATUS_CLASSES[listing.moderationStatus]
                        }
                      >
                        {MODERATION_STATUS_LABELS[listing.moderationStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions pour ${listing.title}`}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/admin/listings/${listing.id}`,
                              )
                            }
                          >
                            <EyeIcon /> Examiner
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {listing.moderationStatus !== "APPROVED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setTarget({ listing, decision: "APPROVED" })
                              }
                            >
                              <CheckCircle2Icon /> Valider
                            </DropdownMenuItem>
                          )}
                          {listing.moderationStatus !== "REJECTED" && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                setTarget({ listing, decision: "REJECTED" })
                              }
                            >
                              <XCircleIcon /> Refuser
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={listings.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {target && (
        <ListingModerationDialog
          listing={target.listing}
          decision={target.decision}
          onClose={() => setTarget(null)}
          onModerated={refresh}
        />
      )}
    </div>
  );
}

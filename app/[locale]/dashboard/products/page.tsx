"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useRouter } from "@/i18n/navigation";
import type { Listing } from "@/lib/validators/listings-services";
import { trpc } from "@/server/trpc/client";
import {
  ImageIcon,
  PackageSearchIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

type FilterTab = "all" | "products" | "services";

const PAGE_SIZE = 10;

const getListingImage = (images: unknown) => {
  if (!Array.isArray(images)) return null;

  const orderedImages = images
    .filter(
      (image): image is { order?: number; url: string } =>
        typeof image === "object" &&
        image !== null &&
        "url" in image &&
        typeof image.url === "string",
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return orderedImages[0]?.url ?? null;
};

const getSpecificValue = (listing: Listing, title: string) => {
  const section = listing.specificsSections.find((item) =>
    item.title.toLowerCase().includes(title),
  );
  const values = section?.items
    .map((item) => item.label || item.value)
    .filter((value) => value !== null && value !== undefined)
    .map(String);

  return values?.length ? values.join(", ") : "Variable";
};

const getSpecificCount = (listing: Listing, title: string) => {
  const section = listing.specificsSections.find((item) =>
    item.title.toLowerCase().includes(title),
  );

  return section?.items.length ?? 0;
};

const formatPrice = (amountMinor: number, currency: string) => {
  const amount = amountMinor;

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
};

const getListingStatus = (listing: Listing) => {
  if (listing.isService) return "-";
  return listing.quantityAvailable > 0 ? "Stock" : "Rupture";
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

type DeleteTarget =
  | { type: "single"; id: string; title: string }
  | { type: "bulk"; ids: string[] };

export default function ProductsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const updateActiveTab = (tab: FilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const listingQueryInput = useMemo(
    () => ({
      page: currentPage,
      limit: PAGE_SIZE,
      orderBy: "createdAt" as const,
      order: "desc" as const,
      title: search.trim() || undefined,
      isService:
        activeTab === "services"
          ? ("true" as const)
          : activeTab === "products"
            ? ("false" as const)
            : undefined,
    }),
    [activeTab, currentPage, search],
  );

  const listings = trpc.listings.list.useQuery(listingQueryInput);
  const listingData = listings.data;
  const listingItems = listingData?.items ?? [];
  const totalListings = listingData?.total ?? 0;
  const totalPages = Math.max(listingData?.totalPages ?? 1, 1);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const hasTrailingPages =
    visiblePages.length > 0 &&
    visiblePages[visiblePages.length - 1] < totalPages;

  const allSelected =
    listingItems.length > 0 &&
    listingItems.every((listing) => selectedIds.has(listing.id));

  const deleteListing = trpc.listings.delete.useMutation();

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(
      checked ? new Set(listingItems.map((listing) => listing.id)) : new Set(),
    );
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const ids =
      deleteTarget.type === "single" ? [deleteTarget.id] : deleteTarget.ids;

    await Promise.all(ids.map((id) => deleteListing.mutateAsync({ id })));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteTarget(null);
    await utils.listings.list.invalidate();
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Link href="/dashboard/products/new">
            <Button
              variant="outline"
              className="h-14 w-full border-dashed text-base"
            >
              <PlusIcon className="size-5" />
              Ajouter un produit
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>
                Liste des produits et services ({totalListings})
              </CardTitle>
              <CardAction>
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Recherche..."
                    value={search}
                    onChange={(event) => updateSearch(event.target.value)}
                    className="h-8 w-48 pl-8"
                  />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={activeTab === "all" ? "default" : "outline"}
                    onClick={() => updateActiveTab("all")}
                  >
                    Tout
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "products" ? "default" : "outline"}
                    onClick={() => updateActiveTab("products")}
                  >
                    Produits
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "services" ? "default" : "outline"}
                    onClick={() => updateActiveTab("services")}
                  >
                    Services
                  </Button>
                </div>

                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleteTarget({
                        type: "bulk",
                        ids: Array.from(selectedIds),
                      })
                    }
                  >
                    <Trash2Icon className="size-4" />
                    Supprimer la sélection ({selectedIds.size})
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          toggleSelectAll(!!checked)
                        }
                        aria-label="Tout sélectionner"
                        disabled={listingItems.length === 0}
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Produit
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Prix
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Nb vendu
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                          <Spinner />
                          Chargement des produits...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : listings.isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-sm">
                          <PackageSearchIcon className="text-muted-foreground size-8" />
                          <p className="font-medium">
                            Impossible de charger les produits.
                          </p>
                          <p className="text-muted-foreground">
                            {listings.error.message}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : listingItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-sm">
                          <PackageSearchIcon className="text-muted-foreground size-9" />
                          <p className="font-medium">
                            Aucun produit ou service trouvé.
                          </p>
                          <p className="text-muted-foreground">
                            Ajustez votre recherche ou ajoutez un nouvel
                            élément.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    listingItems.map((listing) => {
                      const image = getListingImage(listing.images);
                      const size = getSpecificValue(listing, "taille");
                      const colorCount = getSpecificCount(listing, "couleur");
                      const status = getListingStatus(listing);

                      const perQuote = listing.priceAmountMinor < 0;

                      return (
                        <TableRow
                          key={listing.id}
                          className="h-24 hover:bg-transparent"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(listing.id)}
                              onCheckedChange={(checked) =>
                                toggleSelectOne(listing.id, !!checked)
                              }
                              aria-label={`Sélectionner ${listing.title}`}
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={image}
                                  alt={listing.title}
                                  className="bg-muted size-14 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-lg">
                                  <ImageIcon className="size-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-bold">
                                  {listing.title}
                                </p>
                                <p className="text-sm">Taille: {size}</p>
                                {!listing.isService && (
                                  <p className="text-sm">
                                    Couleurs: {colorCount}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {perQuote
                              ? "Par devis"
                              : formatPrice(
                                  listing.priceAmountMinor,
                                  listing.currency,
                                )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            -
                          </TableCell>
                          <TableCell>
                            {status === "Stock" ? (
                              <span className="font-medium text-green-500">
                                Stock
                              </span>
                            ) : status === "Rupture" ? (
                              <span className="text-muted-foreground">
                                Rupture
                              </span>
                            ) : (
                              <span className="text-green-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-foreground"
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/products/${listing.id}/edit`,
                                        )
                                      }
                                    />
                                  }
                                >
                                  <PencilIcon className="size-4" />
                                  <span className="sr-only">Modifier</span>
                                </TooltipTrigger>
                                <TooltipContent>Modifier</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-foreground hover:text-destructive"
                                      onClick={() =>
                                        setDeleteTarget({
                                          type: "single",
                                          id: listing.id,
                                          title: listing.title,
                                        })
                                      }
                                    />
                                  }
                                >
                                  <Trash2Icon className="size-4" />
                                  <span className="sr-only">Supprimer</span>
                                </TooltipTrigger>
                                <TooltipContent>Supprimer</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text=""
                      href="#"
                      aria-disabled={currentPage <= 1}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((page) => Math.max(page - 1, 1));
                      }}
                    />
                  </PaginationItem>
                  {visiblePages.map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {hasTrailingPages && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === totalPages}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      text=""
                      href="#"
                      aria-disabled={currentPage >= totalPages}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages),
                        );
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="font-bold">Les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border/70 flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
              <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
                <ShoppingBagIcon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Aucune vente enregistrée</p>
                <p className="text-muted-foreground text-sm">
                  Les produits les plus vendus apparaîtront ici.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "bulk"
                ? `Voulez-vous vraiment supprimer ${deleteTarget.ids.length} élément(s) ? Cette action est irréversible.`
                : `Voulez-vous vraiment supprimer « ${deleteTarget?.title} » ? Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteListing.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteListing.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {deleteListing.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

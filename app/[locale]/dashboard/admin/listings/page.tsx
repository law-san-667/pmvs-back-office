"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatMoney,
  getListingImage,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { ImageIcon, SearchIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type ListingFilter = "ALL" | "PRODUCT" | "SERVICE";

export default function AdminListingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ListingFilter>("ALL");
  const deferredSearch = useDeferredValue(search.trim());
  const listings = trpc.admin.listings.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    title: deferredSearch || undefined,
    isService:
      filter === "ALL" ? undefined : filter === "SERVICE" ? true : false,
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Produits & services"
        description="Catalogue publié par les entreprises actives de la plateforme."
      />

      <Card>
        <CardHeader>
          <CardTitle>Éléments publiés ({listings.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as ListingFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élément</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Publié le</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={listings.isLoading}
                error={listings.error?.message}
                isEmpty={!listings.data?.items.length}
                loadingLabel="Chargement du catalogue..."
                emptyLabel="Aucun produit ou service trouvé."
              />
              {listings.data?.items.map((listing) => {
                const image = getListingImage(listing.images);

                return (
                  <TableRow key={listing.id}>
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
                        <p className="font-medium">{listing.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {listing.isService ? "Service" : "Produit"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {listing.businessId.slice(0, 8)}
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
                      {formatDate(listing.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{listing.status}</Badge>
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
    </div>
  );
}

"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { BusinessStatus } from "@/lib/backend-resource-types";
import { formatDate, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | BusinessStatus;

const STATUS_LABELS: Record<BusinessStatus, string> = {
  PENDING_VERIFICATION: "À vérifier",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspendue",
  DELETED: "Supprimée",
};

export default function AdminBusinessesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const deferredSearch = useDeferredValue(search.trim());
  const businesses = trpc.admin.businesses.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    name: deferredSearch || undefined,
    status: status === "ALL" ? undefined : status,
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Entreprises"
        description="Consultez toutes les entreprises enregistrées et leur statut."
      />

      <Card>
        <CardHeader>
          <CardTitle>Entreprises ({businesses.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label="Filtrer par statut"
              >
                <option value="ALL">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
                <TableHead>Entreprise</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={businesses.isLoading}
                error={businesses.error?.message}
                isEmpty={!businesses.data?.items.length}
                loadingLabel="Chargement des entreprises..."
                emptyLabel="Aucune entreprise trouvée."
              />
              {businesses.data?.items.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={business.image ?? undefined}
                          alt={business.name}
                        />
                        <AvatarFallback>
                          {getInitials(business.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{business.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {business.slug ?? business.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {business.citySlug}, {business.countryCode}
                  </TableCell>
                  <TableCell>
                    {business.contactEmail ?? business.whatsappPhone ?? "—"}
                  </TableCell>
                  <TableCell>
                    {business.legalBusiness ? "Formelle" : "Informelle"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(business.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {STATUS_LABELS[business.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={businesses.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

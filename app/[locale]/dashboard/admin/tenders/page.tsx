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
import type { TenderType } from "@/lib/backend-resource-types";
import { formatDate, formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type TypeFilter = "ALL" | TenderType;

const TYPE_LABELS: Record<TenderType, string> = {
  SUPPLY: "Fourniture",
  SERVICE: "Service",
  WORKS: "Travaux",
  INTELLECTUAL_SERVICE: "Prestation intellectuelle",
};

export default function AdminTendersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const deferredSearch = useDeferredValue(search.trim());
  const tenders = trpc.admin.tenders.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    title: deferredSearch || undefined,
    type: type === "ALL" ? undefined : type,
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Appels d’offres"
        description="Appels d’offres ouverts et visibles sur la plateforme."
      />

      <Card>
        <CardHeader>
          <CardTitle>Appels d’offres ({tenders.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as TypeFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="ALL">Tous les types</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
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
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Publication</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={tenders.isLoading}
                error={tenders.error?.message}
                isEmpty={!tenders.data?.items.length}
                loadingLabel="Chargement des appels d’offres..."
                emptyLabel="Aucun appel d’offres trouvé."
              />
              {tenders.data?.items.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell className="font-medium">{tender.title}</TableCell>
                  <TableCell>{TYPE_LABELS[tender.type]}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {tender.publisherBusinessId?.slice(0, 8) ?? "Particulier"}
                  </TableCell>
                  <TableCell>
                    {[tender.location, tender.countryCode]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {tender.budgetMinMinor === null &&
                    tender.budgetMaxMinor === null
                      ? "Non précisé"
                      : `${tender.budgetMinMinor === null ? "" : formatMoney(tender.budgetMinMinor, tender.currency)}${tender.budgetMinMinor !== null && tender.budgetMaxMinor !== null ? " – " : ""}${tender.budgetMaxMinor === null ? "" : formatMoney(tender.budgetMaxMinor, tender.currency)}`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(tender.submissionDeadline)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tender.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={tenders.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

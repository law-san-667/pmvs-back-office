"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { BusinessDeleteDialog } from "@/components/admin/business-delete-dialog";
import { BusinessDetailsSheet } from "@/components/admin/business-details-sheet";
import { BusinessEditorDialog } from "@/components/admin/business-editor-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  BUSINESS_STATUS_BADGE_CLASSES,
  BUSINESS_STATUS_LABELS,
} from "@/lib/admin-business-utils";
import type { AdminBusiness } from "@/lib/admin-types";
import type { BusinessStatus } from "@/lib/backend-resource-types";
import { formatDate, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  BanIcon,
  CheckCircle2Icon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | BusinessStatus;

export default function AdminBusinessesPage() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [detailsTarget, setDetailsTarget] = useState<AdminBusiness | null>(null);
  const [editorTarget, setEditorTarget] = useState<AdminBusiness | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBusiness | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const businesses = trpc.admin.businesses.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    name: deferredSearch || undefined,
    status: status === "ALL" ? undefined : status,
  });
  const updateStatus = trpc.admin.updateBusiness.useMutation();

  const refresh = async () => {
    await Promise.all([
      utils.admin.businesses.invalidate(),
      utils.admin.business.invalidate(),
      utils.admin.stats.invalidate(),
    ]);
  };

  const changeStatus = async (
    business: AdminBusiness,
    nextStatus: BusinessStatus,
  ) => {
    try {
      await updateStatus.mutateAsync({ id: business.id, status: nextStatus });
      await refresh();
    } catch {
      // The mutation error is surfaced below the table.
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Entreprises"
        description="Consultez toutes les entreprises enregistrées, validez-les et gérez leur statut."
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
                {Object.entries(BUSINESS_STATUS_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
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
          {updateStatus.error && (
            <p className="text-destructive text-sm">
              {updateStatus.error.message}
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[1%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
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
                    <Badge
                      variant="outline"
                      className={BUSINESS_STATUS_BADGE_CLASSES[business.status]}
                    >
                      {BUSINESS_STATUS_LABELS[business.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions pour ${business.name}`}
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDetailsTarget(business)}
                        >
                          <EyeIcon /> Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditorTarget(business)}
                        >
                          <PencilIcon /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {business.status !== "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => void changeStatus(business, "ACTIVE")}
                          >
                            <CheckCircle2Icon />
                            {business.status === "PENDING_VERIFICATION"
                              ? "Valider"
                              : "Réactiver"}
                          </DropdownMenuItem>
                        )}
                        {business.status !== "SUSPENDED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              void changeStatus(business, "SUSPENDED")
                            }
                          >
                            <BanIcon /> Suspendre
                          </DropdownMenuItem>
                        )}
                        {business.status !== "INACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              void changeStatus(business, "INACTIVE")
                            }
                          >
                            <RotateCcwIcon /> Désactiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(business)}
                        >
                          <Trash2Icon /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {detailsTarget && (
        <BusinessDetailsSheet
          business={detailsTarget}
          onClose={() => setDetailsTarget(null)}
          onEdit={() => {
            setEditorTarget(detailsTarget);
            setDetailsTarget(null);
          }}
        />
      )}
      {editorTarget && (
        <BusinessEditorDialog
          business={editorTarget}
          onClose={() => setEditorTarget(null)}
          onSaved={refresh}
        />
      )}
      {deleteTarget && (
        <BusinessDeleteDialog
          business={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}

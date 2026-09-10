"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { CreateAdminDialog } from "@/components/forms/create-admin-form";
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
import { useUser } from "@/contexts/user-context";
import type { StaffRole, UserStatus } from "@/lib/admin-types";
import { formatDate } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 10;
type RoleFilter = "ALL" | StaffRole;

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  OPERATOR: "Opérateur",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  PENDING_VERIFICATION: "En attente de vérification",
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  DELETED: "Supprimé",
};

const STATUS_CLASSES: Record<UserStatus, string> = {
  PENDING_VERIFICATION: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
  DELETED: "border-red-200 bg-red-50 text-red-700",
};

export default function AdminAdministratorsPage() {
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const admins = trpc.admin.admins.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    role: role === "ALL" ? undefined : role,
    search: search.trim() || undefined,
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Administrateurs"
        description="Comptes ayant accès au back-office. Créez-en de nouveaux et consultez ceux qui existent déjà."
      />

      <Card>
        <CardHeader>
          <CardTitle>Comptes ({admins.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Nom, email, téléphone..."
                  className="h-9 w-56 pl-8"
                />
              </div>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as RoleFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="ALL">Tous les rôles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <CreateAdminDialog onCreated={() => admins.refetch()} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={admins.isLoading}
                error={admins.error?.message}
                isEmpty={!admins.data?.items.length}
                loadingLabel="Chargement des administrateurs..."
                emptyLabel="Aucun administrateur trouvé."
              />
              {admins.data?.items.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <p className="font-medium">
                      {admin.firstName} {admin.lastName}
                      {admin.id === user?.id && (
                        <span className="text-muted-foreground ml-2 text-xs font-normal">
                          (vous)
                        </span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{admin.email ?? "—"}</p>
                    <p className="text-muted-foreground text-xs">
                      {admin.phoneNumber ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>{ROLE_LABELS[admin.role]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASSES[admin.status]}
                    >
                      {STATUS_LABELS[admin.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {admin.lastLoginAt
                      ? formatDate(admin.lastLoginAt, true)
                      : "Jamais"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(admin.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={admins.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

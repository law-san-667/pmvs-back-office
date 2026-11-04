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
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const PAGE_SIZE = 10;
type RoleFilter = "ALL" | StaffRole;

const ROLES: StaffRole[] = ["ADMIN", "MODERATOR", "OPERATOR"];

const STATUS_CLASSES: Record<UserStatus, string> = {
  PENDING_VERIFICATION: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
  DELETED: "border-red-200 bg-red-50 text-red-700",
};

export default function AdminAdministratorsPage() {
  const t = useTranslations("adminAccounts");
  const locale = useLocale();
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
        title={t("administrators.title")}
        description={t("administrators.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("administrators.count", { count: admins.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 start-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("administrators.searchPlaceholder")}
                  className="h-9 w-56 ps-8"
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
                <option value="ALL">{t("administrators.allRoles")}</option>
                {ROLES.map((value) => (
                  <option key={value} value={value}>
                    {t(`staffRole.${value}`)}
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
                <TableHead>{t("administrators.columns.account")}</TableHead>
                <TableHead>{t("administrators.columns.contact")}</TableHead>
                <TableHead>{t("administrators.columns.role")}</TableHead>
                <TableHead>{t("administrators.columns.status")}</TableHead>
                <TableHead>{t("administrators.columns.lastLogin")}</TableHead>
                <TableHead>{t("administrators.columns.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={admins.isLoading}
                error={admins.error?.message}
                isEmpty={!admins.data?.items.length}
                loadingLabel={t("administrators.loading")}
                emptyLabel={t("administrators.empty")}
              />
              {admins.data?.items.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <p className="font-medium">
                      {admin.firstName} {admin.lastName}
                      {admin.id === user?.id && (
                        <span className="text-muted-foreground ms-2 text-xs font-normal">
                          {t("administrators.you")}
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
                  <TableCell>{t(`staffRole.${admin.role}`)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASSES[admin.status]}
                    >
                      {t(`userStatus.${admin.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {admin.lastLoginAt
                      ? formatDate(admin.lastLoginAt, true, locale)
                      : t("administrators.never")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(admin.createdAt, false, locale)}
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

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BusinessMemberRole } from "@/lib/admin-types";
import { formatDate } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const PAGE_SIZE = 10;
type RoleFilter = "ALL" | BusinessMemberRole;

const ROLES: BusinessMemberRole[] = ["OWNER", "ADMIN", "MEMBER"];

export default function AdminTeamMembersPage() {
  const t = useTranslations("adminAccounts");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [businessId, setBusinessId] = useState("ALL");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const businesses = trpc.admin.businesses.useQuery({
    page: 1,
    limit: 100,
    orderBy: "name",
    order: "asc",
  });
  const members = trpc.admin.members.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    businessId: businessId === "ALL" ? undefined : businessId,
    role: role === "ALL" ? undefined : role,
  });
  const businessesById = new Map(
    businesses.data?.items.map((business) => [business.id, business.name]) ??
      [],
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("teamMembers.title")}
        description={t("teamMembers.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("teamMembers.count", { count: members.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={businessId}
                onChange={(event) => {
                  setBusinessId(event.target.value);
                  setPage(1);
                }}
                className="border-input bg-background h-9 max-w-56 rounded-md border px-3 text-sm"
              >
                <option value="ALL">{t("teamMembers.allBusinesses")}</option>
                {businesses.data?.items.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as RoleFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="ALL">{t("teamMembers.allRoles")}</option>
                {ROLES.map((value) => (
                  <option key={value} value={value}>
                    {t(`memberRole.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("teamMembers.columns.user")}</TableHead>
                <TableHead>{t("teamMembers.columns.business")}</TableHead>
                <TableHead>{t("teamMembers.columns.role")}</TableHead>
                <TableHead>{t("teamMembers.columns.status")}</TableHead>
                <TableHead>{t("teamMembers.columns.addedAt")}</TableHead>
                <TableHead>{t("teamMembers.columns.updatedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={members.isLoading}
                error={members.error?.message}
                isEmpty={!members.data?.items.length}
                loadingLabel={t("teamMembers.loading")}
                emptyLabel={t("teamMembers.empty")}
              />
              {members.data?.items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.user ? (
                      <div>
                        <p className="font-medium">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {member.user.email ??
                            member.user.phoneNumber ??
                            member.userId}
                        </p>
                      </div>
                    ) : (
                      <span className="font-mono text-xs">{member.userId}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {businessesById.get(member.businessId) ?? (
                      <span className="font-mono text-xs">
                        {member.businessId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{t(`memberRole.${member.role}`)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`memberStatus.${member.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.createdAt, false, locale)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.updatedAt, false, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={members.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

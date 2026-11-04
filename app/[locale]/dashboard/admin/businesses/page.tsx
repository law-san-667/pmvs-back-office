"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { BusinessDeleteDialog } from "@/components/admin/business-delete-dialog";
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
import { useRouter } from "@/i18n/navigation";
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
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | BusinessStatus;

export default function AdminBusinessesPage() {
  const t = useTranslations("adminAccounts");
  const tCategory = useTranslations("onboarding.category.options");
  const locale = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
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
        title={t("businesses.title")}
        description={t("businesses.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("businesses.count", { count: businesses.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label={t("businesses.filterByStatus")}
              >
                <option value="ALL">{t("businesses.allStatuses")}</option>
                {(Object.keys(BUSINESS_STATUS_LABELS) as BusinessStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {t(`businessStatus.${value}`)}
                    </option>
                  ),
                )}
              </select>
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 start-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("businesses.searchPlaceholder")}
                  className="h-9 w-56 ps-8"
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
                <TableHead>{t("businesses.columns.business")}</TableHead>
                <TableHead>{t("businesses.columns.location")}</TableHead>
                <TableHead>{t("businesses.columns.contact")}</TableHead>
                <TableHead>{t("businesses.columns.category")}</TableHead>
                <TableHead>{t("businesses.columns.registeredAt")}</TableHead>
                <TableHead>{t("businesses.columns.status")}</TableHead>
                <TableHead className="w-[1%] text-end">
                  {t("businesses.columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={businesses.isLoading}
                error={businesses.error?.message}
                isEmpty={!businesses.data?.items.length}
                loadingLabel={t("businesses.loading")}
                emptyLabel={t("businesses.empty")}
              />
              {businesses.data?.items.map((business) => (
                <TableRow
                  key={business.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/admin/businesses/${business.id}`)
                  }
                >
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
                    {tCategory(`${business.businessCategory}.label`)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(business.createdAt, false, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={BUSINESS_STATUS_BADGE_CLASSES[business.status]}
                    >
                      {t(`businessStatus.${business.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-end"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("businesses.actionsFor", {
                              name: business.name,
                            })}
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/businesses/${business.id}`,
                            )
                          }
                        >
                          <EyeIcon /> {t("actions.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditorTarget(business)}
                        >
                          <PencilIcon /> {t("actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {business.status !== "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              void changeStatus(business, "ACTIVE")
                            }
                          >
                            <CheckCircle2Icon />
                            {business.status === "PENDING_VERIFICATION"
                              ? t("actions.validate")
                              : t("actions.reactivate")}
                          </DropdownMenuItem>
                        )}
                        {business.status !== "SUSPENDED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              void changeStatus(business, "SUSPENDED")
                            }
                          >
                            <BanIcon /> {t("actions.suspend")}
                          </DropdownMenuItem>
                        )}
                        {business.status !== "INACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              void changeStatus(business, "INACTIVE")
                            }
                          >
                            <RotateCcwIcon /> {t("actions.deactivate")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(business)}
                        >
                          <Trash2Icon /> {t("actions.delete")}
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

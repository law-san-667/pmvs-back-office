"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import {
  canApprove,
  canReject,
  ClassifiedSheet,
  ClassifiedStatusBadge,
  useClassifiedFormat,
} from "@/components/admin/classified-details";
import { ClassifiedRejectDialog } from "@/components/admin/classified-reject-dialog";
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
import type {
  Classified,
  ClassifiedStatus,
  ClassifiedType,
} from "@/server/trpc/_procedures/classifieds";
import { trpc } from "@/server/trpc/client";
import {
  CheckCircle2Icon,
  EyeIcon,
  ImageIcon,
  MoreHorizontalIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;
type StatusFilter = "ALL" | ClassifiedStatus;
type TypeFilter = "ALL" | ClassifiedType;
const QUEUE_TABS: StatusFilter[] = [
  "PENDING",
  "PUBLISHED",
  "REJECTED",
  "CLOSED",
  "ALL",
];

/** Moderation of the « petites annonces » (offer and request ads). */
export default function AdminClassifiedsPage() {
  const t = useTranslations("adminClassifieds");
  const format = useClassifiedFormat();
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Classified | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const classifieds = trpc.classifieds.adminList.useQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    search: deferredSearch || undefined,
  });
  const moderate = trpc.classifieds.moderate.useMutation();
  const selected =
    classifieds.data?.items.find((item) => item.id === selectedId) ?? null;

  const decide = async (
    classified: Classified,
    status: "PUBLISHED" | "REJECTED",
    reason?: string,
  ) => {
    try {
      await moderate.mutateAsync({ id: classified.id, status, reason });
      toast.success(status === "PUBLISHED" ? t("approved") : t("rejected"));
      setRejecting(null);
      setSelectedId(null);
      await utils.classifieds.adminList.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failed"));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("withCount", {
              label: t(`queue.${statusFilter}`),
              count: classifieds.data?.total ?? 0,
            })}
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
                aria-label={t("filterType")}
              >
                <option value="ALL">{t("type.ALL")}</option>
                <option value="OFFER">{t("type.OFFER")}</option>
                <option value="DEMAND">{t("type.DEMAND")}</option>
              </select>
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("search")}
                  className="h-9 w-56 ps-8"
                />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <div className="flex flex-wrap gap-2">
            {QUEUE_TABS.map((tab) => (
              <Button
                key={tab}
                size="sm"
                variant={statusFilter === tab ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
              >
                {t(`queue.${tab}`)}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.title")}</TableHead>
                <TableHead>{t("columns.publisher")}</TableHead>
                <TableHead>{t("columns.country")}</TableHead>
                <TableHead>{t("columns.terms")}</TableHead>
                <TableHead>{t("columns.date")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="w-[1%] text-end">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={classifieds.isLoading}
                error={classifieds.error?.message}
                isEmpty={!classifieds.data?.items.length}
                loadingLabel={t("loading")}
                emptyLabel={
                  statusFilter === "PENDING" ? t("emptyPending") : t("empty")
                }
              />
              {classifieds.data?.items.map((classified) => {
                const image = classified.images[0];
                const terms = [
                  format.quantity(classified),
                  format.price(classified),
                  classified.priceKind &&
                    t(`priceKind.${classified.priceKind}`),
                  classified.incoterm,
                ].filter(Boolean);
                return (
                  <TableRow
                    key={classified.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(classified.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={classified.title}
                            className="bg-muted size-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-52 truncate font-medium">
                            <bdi>{classified.title}</bdi>
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary">
                              {t(`type.${classified.type}`)}
                            </Badge>
                            <span
                              className="text-muted-foreground max-w-32 truncate text-xs"
                              title={format.category(classified)}
                            >
                              {format.category(classified)}
                            </span>
                          </div>
                          {classified.status === "REJECTED" &&
                            classified.moderationReason && (
                              <p className="text-muted-foreground mt-1 max-w-52 truncate text-xs">
                                {classified.moderationReason}
                              </p>
                            )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-40 truncate">
                        <bdi>{format.publisher(classified)}</bdi>
                      </p>
                      <p className="text-muted-foreground max-w-40 text-xs">
                        {t(`profile.${classified.publisherProfile}`)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="whitespace-nowrap">
                        {format.country(classified.countryCode)}
                      </p>
                      <p
                        className="text-muted-foreground max-w-36 truncate text-xs"
                        title={format.diffusion(classified)}
                      >
                        {format.diffusion(classified)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {terms.length
                        ? terms.map((term) => (
                            <p key={term} className="whitespace-nowrap">
                              <bdi>{term}</bdi>
                            </p>
                          ))
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p>{format.date(classified.createdAt)}</p>
                      {classified.updatedAt !== classified.createdAt && (
                        <p className="text-muted-foreground text-xs">
                          {t("updated", {
                            date: format.date(classified.updatedAt) ?? "",
                          })}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <ClassifiedStatusBadge classified={classified} short />
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
                              aria-label={t("actionsFor", {
                                title: classified.title,
                              })}
                            />
                          }
                        >
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedId(classified.id)}
                          >
                            <EyeIcon /> {t("view")}
                          </DropdownMenuItem>
                          {(canApprove(classified) ||
                            canReject(classified)) && <DropdownMenuSeparator />}
                          {canApprove(classified) && (
                            <DropdownMenuItem
                              disabled={moderate.isPending}
                              onClick={() =>
                                void decide(classified, "PUBLISHED")
                              }
                            >
                              <CheckCircle2Icon /> {t("approve")}
                            </DropdownMenuItem>
                          )}
                          {canReject(classified) && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setRejecting(classified)}
                            >
                              <XCircleIcon /> {t("reject")}
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
            totalPages={classifieds.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {selected && !rejecting && (
        <ClassifiedSheet
          classified={selected}
          isPending={moderate.isPending}
          onClose={() => setSelectedId(null)}
          onApprove={() => void decide(selected, "PUBLISHED")}
          onReject={() => setRejecting(selected)}
        />
      )}
      {rejecting && (
        <ClassifiedRejectDialog
          classified={rejecting}
          isPending={moderate.isPending}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => void decide(rejecting, "REJECTED", reason)}
        />
      )}
    </div>
  );
}

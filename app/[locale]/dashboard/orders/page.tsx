"use client";

import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useBusiness } from "@/contexts/business-context";
import { Link } from "@/i18n/navigation";
import type { OrderStatus } from "@/lib/seller-dashboard-types";
import { formatAmount } from "@/lib/payment-utils";
import {
  getOrderReference,
  getVisiblePages,
} from "@/lib/seller-dashboard-utils";
import { formatDate } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { EyeIcon, PackageSearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | OrderStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrdersPage() {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { businessId, isLoading: isBusinessLoading } = useBusiness();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const orders = trpc.orders.listBusiness.useQuery(
    {
      businessId: businessId ?? "00000000-0000-0000-0000-000000000000",
      page: currentPage,
      limit: PAGE_SIZE,
      orderBy: "createdAt",
      order: "desc",
      status: status === "ALL" ? undefined : status,
    },
    { enabled: Boolean(businessId) },
  );

  const items = orders.data?.items ?? [];
  const totalOrders = orders.data?.total ?? 0;
  const totalPages = Math.max(orders.data?.totalPages ?? 1, 1);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const hasTrailingPages =
    visiblePages.length > 0 &&
    visiblePages[visiblePages.length - 1] < totalPages;

  const updateStatus = (value: StatusFilter) => {
    setStatus(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("list.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("list.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("list.count", { count: totalOrders })}</CardTitle>
          <CardAction>
            <select
              value={status}
              onChange={(event) =>
                updateStatus(event.target.value as StatusFilter)
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              aria-label={t("list.filterLabel")}
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter} value={filter}>
                  {filter === "ALL"
                    ? t("list.allStatuses")
                    : t(`status.${filter}`)}
                </option>
              ))}
            </select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("list.columns.order")}</TableHead>
                <TableHead>{t("list.columns.recipient")}</TableHead>
                <TableHead>{t("list.columns.items")}</TableHead>
                <TableHead>{t("list.columns.date")}</TableHead>
                <TableHead>{t("list.columns.total")}</TableHead>
                <TableHead>{t("list.columns.status")}</TableHead>
                <TableHead className="text-end">
                  {t("list.columns.details")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBusinessLoading || orders.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center">
                    <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                      <Spinner /> {t("list.loading")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : !businessId ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center">
                    {t("list.noBusiness")}
                  </TableCell>
                </TableRow>
              ) : orders.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <PackageSearchIcon className="text-muted-foreground size-9" />
                      <p className="font-medium">{t("list.loadError")}</p>
                      <p className="text-muted-foreground">
                        {orders.error.message}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <PackageSearchIcon className="text-muted-foreground size-9" />
                      <p className="font-medium">{t("list.emptyTitle")}</p>
                      <p className="text-muted-foreground">
                        {status === "ALL"
                          ? t("list.emptyText")
                          : t("list.emptyFiltered")}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((order) => (
                  <TableRow key={order.id} className="hover:bg-transparent">
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-bold hover:underline"
                      >
                        {getOrderReference(order.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {order.shippingAddress?.recipientName ??
                          t("list.notProvided")}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {order.shippingAddress?.phoneNumber ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt, locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="font-bold whitespace-nowrap">
                      {formatAmount(
                        order.totalAmountMinor,
                        order.currency,
                        locale,
                      )}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        render={<Link href={`/dashboard/orders/${order.id}`} />}
                      >
                        <EyeIcon className="size-4" />
                        <span className="sr-only">{t("list.view")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
                    setCurrentPage((page) => Math.min(page + 1, totalPages));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
}

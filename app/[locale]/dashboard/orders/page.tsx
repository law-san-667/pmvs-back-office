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
import {
  formatDate,
  formatMoney,
  getOrderReference,
  getVisiblePages,
  ORDER_STATUS_LABELS,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { EyeIcon, PackageSearchIcon } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | OrderStatus;

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "PROCESSING", label: ORDER_STATUS_LABELS.PROCESSING },
  { value: "SHIPPED", label: ORDER_STATUS_LABELS.SHIPPED },
  { value: "DELIVERED", label: ORDER_STATUS_LABELS.DELIVERED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
  { value: "REFUNDED", label: ORDER_STATUS_LABELS.REFUNDED },
];

export default function OrdersPage() {
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
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-muted-foreground text-sm">
          Suivez toutes les commandes passées auprès de votre entreprise
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes ({totalOrders})</CardTitle>
          <CardAction>
            <select
              value={status}
              onChange={(event) =>
                updateStatus(event.target.value as StatusFilter)
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              aria-label="Filtrer par statut"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Commande</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBusinessLoading || orders.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center">
                    <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                      <Spinner /> Chargement des commandes...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !businessId ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center">
                    Aucune entreprise active n’a été trouvée.
                  </TableCell>
                </TableRow>
              ) : orders.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm">
                      <PackageSearchIcon className="text-muted-foreground size-9" />
                      <p className="font-medium">
                        Impossible de charger les commandes.
                      </p>
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
                      <p className="font-medium">Aucune commande trouvée.</p>
                      <p className="text-muted-foreground">
                        {status === "ALL"
                          ? "Les nouvelles commandes apparaîtront ici."
                          : "Aucune commande ne correspond à ce statut."}
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
                          "Non renseigné"}
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
                      {formatDate(order.createdAt, true)}
                    </TableCell>
                    <TableCell className="font-bold whitespace-nowrap">
                      {formatMoney(order.totalAmountMinor, order.currency)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/dashboard/orders/${order.id}`} />}
                      >
                        <EyeIcon className="size-4" />
                        <span className="sr-only">Voir la commande</span>
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

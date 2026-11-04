"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import {
  formatDate,
  formatMoney,
  getOrderReference,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { EyeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const PAGE_SIZE = 10;

export default function AdminOrdersPage() {
  const t = useTranslations("adminCommerce");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const payments = trpc.admin.payments.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("orders.title")}
        description={t("orders.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("orders.cardTitle", { count: payments.data?.total ?? 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("orders.columns.order")}</TableHead>
                <TableHead>{t("orders.columns.client")}</TableHead>
                <TableHead>{t("orders.columns.business")}</TableHead>
                <TableHead>{t("orders.columns.date")}</TableHead>
                <TableHead>{t("orders.columns.total")}</TableHead>
                <TableHead>{t("orders.columns.status")}</TableHead>
                <TableHead className="text-end">
                  {t("orders.columns.details")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={payments.isLoading}
                error={payments.error?.message}
                isEmpty={!payments.data?.items.length}
                loadingLabel={t("orders.loading")}
                emptyLabel={t("orders.empty")}
              />
              {payments.data?.items.map((payment) => {
                const order = payment.order;
                const payerName =
                  `${payment.payer.firstName} ${payment.payer.lastName}`.trim();

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-bold">
                      {getOrderReference(order.id)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{payerName}</p>
                      <p className="text-muted-foreground text-xs">
                        {payment.payer.email ??
                          payment.payer.phoneNumber ??
                          "—"}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {order.businessId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(order.createdAt, true, locale)}
                    </TableCell>
                    <TableCell className="font-bold whitespace-nowrap">
                      {formatMoney(order.totalAmountMinor, order.currency, locale)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={
                          <Link href={`/dashboard/admin/orders/${order.id}`} />
                        }
                      >
                        <EyeIcon className="size-4" />
                        <span className="sr-only">{t("orders.view")}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={payments.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

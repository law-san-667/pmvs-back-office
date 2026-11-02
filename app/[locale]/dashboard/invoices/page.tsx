"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Badge } from "@/components/ui/badge";
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
import { useBusiness } from "@/contexts/business-context";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/server/trpc/client";
import { formatDate, formatNumber } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const formatAmount = (amount: number, currency: string, locale: string) =>
  `${formatNumber(amount, locale)} ${
    currency === "XOF" || currency === "XAF" ? "FCFA" : currency
  }`;

/** The shop's invoices and credit notes, issued when orders are confirmed. */
export default function InvoicesPage() {
  const t = useTranslations("invoices");
  const locale = useLocale();
  const { businessId } = useBusiness();
  const [page, setPage] = useState(1);
  const invoices = trpc.invoices.business.useQuery(
    { businessId: businessId ?? "", page, limit: 20 },
    { enabled: Boolean(businessId) },
  );
  const link = trpc.invoices.link.useMutation();

  const open = async (id: string) => {
    const tab = window.open("", "_blank");
    try {
      const { url } = await link.mutateAsync({ id });
      if (tab) tab.location.replace(url);
      else window.location.assign(url);
    } catch {
      tab?.close();
      toast.error(t("page.openError"));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("page.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("page.description")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("page.documents", { count: invoices.data?.total ?? 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("page.columns.number")}</TableHead>
                <TableHead>{t("page.columns.type")}</TableHead>
                <TableHead>{t("page.columns.date")}</TableHead>
                <TableHead>{t("page.columns.order")}</TableHead>
                <TableHead className="text-end">
                  {t("page.columns.amount")}
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={invoices.isLoading}
                error={invoices.error?.message}
                isEmpty={!invoices.data?.items.length}
                loadingLabel={t("page.loading")}
                emptyLabel={t("page.empty")}
              />
              {invoices.data?.items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.number}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invoice.type === "CREDIT_NOTE"
                        ? t("type.CREDIT_NOTE")
                        : t("type.INVOICE")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(invoice.issuedAt, locale, {
                      dateStyle: "short",
                    })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${invoice.orderId}`}
                      className="text-primary hover:underline"
                    >
                      <bdi>#{invoice.orderId.slice(0, 8).toUpperCase()}</bdi>
                    </Link>
                  </TableCell>
                  <TableCell className="text-end whitespace-nowrap">
                    {formatAmount(
                      invoice.totalAmountMinor,
                      invoice.currency,
                      locale,
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={link.isPending}
                      onClick={() => void open(invoice.id)}
                    >
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={invoices.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

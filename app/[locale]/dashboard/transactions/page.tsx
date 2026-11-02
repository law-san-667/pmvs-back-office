"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Link } from "@/i18n/navigation";
import type { PaymentStatus, PayoutStatus } from "@/lib/admin-types";
import {
  formatAmount,
  PAYMENT_STATUS_CLASSES,
  PAYOUT_STATUS_CLASSES,
} from "@/lib/payment-utils";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import {
  BanknoteIcon,
  ClockIcon,
  EyeIcon,
  PercentIcon,
  SearchIcon,
  WalletIcon,
} from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;

type Filter =
  | { kind: "all" }
  | { kind: "status"; status: PaymentStatus }
  | { kind: "payout"; payoutStatus: PayoutStatus };

const FILTERS: {
  label: "all" | "paid" | "pending" | "paidOut" | "payoutFailed" | "refunded";
  value: Filter;
}[] = [
  { label: "all", value: { kind: "all" } },
  { label: "paid", value: { kind: "status", status: "SUCCEEDED" } },
  { label: "pending", value: { kind: "status", status: "PENDING" } },
  { label: "paidOut", value: { kind: "payout", payoutStatus: "SUCCEEDED" } },
  {
    label: "payoutFailed",
    value: { kind: "payout", payoutStatus: "FAILED" },
  },
  { label: "refunded", value: { kind: "status", status: "REFUNDED" } },
];

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">
          {title}
        </CardTitle>
        <CardAction>
          <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
            {icon}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const tOrders = useTranslations("orders");
  const locale = useLocale();
  const formatMoney = (amountMinor: number, currency: string) =>
    formatAmount(amountMinor, currency, locale);
  const [filterIndex, setFilterIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const filter = FILTERS[filterIndex].value;

  const summary = trpc.sellerDashboard.transactionsSummary.useQuery();
  const transactions = trpc.sellerDashboard.transactions.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    status: filter.kind === "status" ? filter.status : undefined,
    payoutStatus: filter.kind === "payout" ? filter.payoutStatus : undefined,
    search: deferredSearch || undefined,
  });

  // Suppliers almost always trade in one currency; show the first one and
  // list the others underneath when they exist.
  const [main, ...others] = summary.data ?? [];
  const currency = main?.currency ?? "XOF";

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("stats.sales")}
          value={formatMoney(main?.grossMinor ?? 0, currency)}
          hint={t("stats.salesHint", { count: main?.transactionCount ?? 0 })}
          icon={<BanknoteIcon className="size-5" />}
        />
        <StatCard
          title={t("stats.paidOut")}
          value={formatMoney(main?.paidOutMinor ?? 0, currency)}
          hint={t("stats.paidOutHint")}
          icon={<WalletIcon className="size-5" />}
        />
        <StatCard
          title={t("stats.pendingPayouts")}
          value={formatMoney(main?.pendingPayoutMinor ?? 0, currency)}
          hint={
            main?.failedPayoutMinor
              ? t("stats.failedHint", {
                  amount: formatMoney(main.failedPayoutMinor, currency),
                })
              : t("stats.pendingHint", { count: main?.pendingCount ?? 0 })
          }
          icon={<ClockIcon className="size-5" />}
        />
        <StatCard
          title={t("stats.fees")}
          value={formatMoney(
            (main?.platformFeesMinor ?? 0) + (main?.commissionMinor ?? 0),
            currency,
          )}
          hint={t("stats.feesHint", {
            fees: formatMoney(main?.platformFeesMinor ?? 0, currency),
            commission: formatMoney(main?.commissionMinor ?? 0, currency),
          })}
          icon={<PercentIcon className="size-5" />}
        />
      </div>

      {others.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {t("otherCurrencies", {
            list: others
              .map((row) =>
                t("otherCurrency", {
                  currency: row.currency,
                  gross: formatMoney(row.grossMinor, row.currency),
                  paidOut: formatMoney(row.paidOutMinor, row.currency),
                }),
              )
              .join(" · "),
          })}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {t("history", { count: transactions.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-8 w-48 ps-8"
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item, index) => (
              <Button
                key={item.label}
                size="sm"
                variant={filterIndex === index ? "default" : "outline"}
                onClick={() => {
                  setFilterIndex(index);
                  setPage(1);
                }}
              >
                {t(`filters.${item.label}`)}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.reference")}</TableHead>
                <TableHead>{t("columns.client")}</TableHead>
                <TableHead>{t("columns.method")}</TableHead>
                <TableHead>{t("columns.date")}</TableHead>
                <TableHead>{t("columns.amount")}</TableHead>
                <TableHead>{t("columns.netPaidOut")}</TableHead>
                <TableHead>{t("columns.payment")}</TableHead>
                <TableHead>{t("columns.payout")}</TableHead>
                <TableHead className="w-[1%]">{t("columns.order")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={9}
                isLoading={transactions.isLoading}
                error={transactions.error?.message}
                isEmpty={!transactions.data?.items.length}
                loadingLabel={t("loading")}
                emptyLabel={t("empty")}
              />
              {transactions.data?.items.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.transactionReference ??
                      (transaction.provider === "CASH"
                        ? t("cash")
                        : transaction.id.slice(0, 8).toUpperCase())}
                  </TableCell>
                  <TableCell>
                    {transaction.payer.firstName} {transaction.payer.lastName}
                  </TableCell>
                  <TableCell>
                    {transaction.providerPaymentMethod ??
                      tOrders(`paymentMethod.${transaction.method}`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(
                      transaction.paidAt ?? transaction.createdAt,
                      locale,
                      { dateStyle: "medium" },
                    )}
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatMoney(transaction.amountMinor, transaction.currency)}
                  </TableCell>
                  <TableCell>
                    {transaction.payoutAmountMinor !== null
                      ? formatMoney(
                          transaction.payoutAmountMinor,
                          transaction.currency,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PAYMENT_STATUS_CLASSES[transaction.status]}
                    >
                      {t(`paymentStatus.${transaction.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.payoutStatus === "NOT_APPLICABLE" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge
                        variant="outline"
                        className={
                          PAYOUT_STATUS_CLASSES[transaction.payoutStatus]
                        }
                        title={transaction.payoutError ?? undefined}
                      >
                        {t(`payoutStatus.${transaction.payoutStatus}`)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={
                        <Link
                          href={`/dashboard/orders/${transaction.orderId}`}
                        />
                      }
                      aria-label={t("viewOrder")}
                    >
                      <EyeIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <AdminPagination
            page={page}
            totalPages={transactions.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

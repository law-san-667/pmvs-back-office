"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
import type {
  LedgerAccount,
  PaymentStatus,
  PayoutStatus,
} from "@/lib/admin-types";
import {
  PAYMENT_STATUS_CLASSES,
  PAYOUT_STATUS_CLASSES,
} from "@/lib/payment-utils";
import { formatDate, formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { RefreshCwIcon, SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | PaymentStatus;
type PayoutFilter = "ALL" | PayoutStatus;

/** Accounts shown as headline figures, in reading order. */
const HEADLINE_ACCOUNTS: LedgerAccount[] = [
  "SALES",
  "PLATFORM_REVENUE",
  "PROVIDER_FEES",
  "SUPPLIER_PAYABLE",
  "SUPPLIER_PAID",
  "REFUNDS",
];

export default function AdminTransactionsPage() {
  const t = useTranslations("adminCommerce");
  const tTransactions = useTranslations("transactions");
  const tOrders = useTranslations("orders");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [payoutStatus, setPayoutStatus] = useState<PayoutFilter>("ALL");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  const summary = trpc.admin.ledgerSummary.useQuery({});
  const payments = trpc.admin.payments.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    status: status === "ALL" ? undefined : status,
    payoutStatus: payoutStatus === "ALL" ? undefined : payoutStatus,
    transactionReference: deferredSearch || undefined,
  });
  const syncPayment = trpc.admin.syncPayment.useMutation({
    onSuccess: () =>
      Promise.all([
        utils.admin.payments.invalidate(),
        utils.admin.ledgerSummary.invalidate(),
      ]),
  });

  const balances = summary.data?.balances ?? [];
  const balanceFor = (account: LedgerAccount) =>
    balances.filter((row) => row.account === account);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("transactions.title")}
        description={t("transactions.description")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {HEADLINE_ACCOUNTS.map((account) => {
          const rows = balanceFor(account);
          return (
            <Card key={account}>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  {t(`transactions.ledger.${account}`)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <p className="text-2xl font-bold">—</p>
                ) : (
                  rows.map((row) => (
                    <p key={row.currency} className="text-2xl font-bold">
                      {formatMoney(
                        Math.abs(row.balanceMinor),
                        row.currency,
                        locale,
                      )}
                    </p>
                  ))
                )}
                <p className="text-muted-foreground text-sm">
                  {t("transactions.entries", {
                    count: rows.reduce((sum, row) => sum + row.entryCount, 0),
                  })}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {summary.data && (
        <p className="text-muted-foreground text-sm">
          {t("transactions.summary.succeeded", {
            count: summary.data.payments.succeeded,
          })}{" "}
          ·{" "}
          {t("transactions.summary.pending", {
            count: summary.data.payments.pending,
          })}{" "}
          ·{" "}
          {t("transactions.summary.failed", {
            count: summary.data.payments.failed,
          })}{" "}
          ·{" "}
          {t("transactions.summary.refunded", {
            count: summary.data.payments.refunded,
          })}{" "}
          ·{" "}
          {t("transactions.summary.payoutsPending", {
            count: summary.data.payments.payoutsPending,
          })}{" "}
          ·{" "}
          <span
            className={
              summary.data.payments.payoutsFailed ? "text-destructive" : ""
            }
          >
            {t("transactions.summary.payoutsFailed", {
              count: summary.data.payments.payoutsFailed,
            })}
          </span>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {t("transactions.cardTitle", { count: payments.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label={t("transactions.filterPaymentStatus")}
              >
                <option value="ALL">{t("transactions.allPayments")}</option>
                {(Object.keys(PAYMENT_STATUS_CLASSES) as PaymentStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {tTransactions(`paymentStatus.${value}`)}
                    </option>
                  ),
                )}
              </select>
              <select
                value={payoutStatus}
                onChange={(event) => {
                  setPayoutStatus(event.target.value as PayoutFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label={t("transactions.filterPayoutStatus")}
              >
                <option value="ALL">{t("transactions.allPayouts")}</option>
                {(Object.keys(PAYOUT_STATUS_CLASSES) as PayoutStatus[])
                  .filter((value) => value !== "NOT_APPLICABLE")
                  .map((value) => (
                    <option key={value} value={value}>
                      {tTransactions(`payoutStatus.${value}`)}
                    </option>
                  ))}
              </select>
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 start-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder={t("transactions.searchPlaceholder")}
                  className="h-9 w-48 ps-8"
                />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          {syncPayment.error && (
            <p className="text-destructive text-sm">{syncPayment.error.message}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("transactions.columns.reference")}</TableHead>
                <TableHead>{t("transactions.columns.payer")}</TableHead>
                <TableHead>{t("transactions.columns.method")}</TableHead>
                <TableHead>{t("transactions.columns.amount")}</TableHead>
                <TableHead>{t("transactions.columns.lawpayFees")}</TableHead>
                <TableHead>{t("transactions.columns.commission")}</TableHead>
                <TableHead>{t("transactions.columns.supplierNet")}</TableHead>
                <TableHead>{t("transactions.columns.payment")}</TableHead>
                <TableHead>{t("transactions.columns.payout")}</TableHead>
                <TableHead>{t("transactions.columns.date")}</TableHead>
                <TableHead className="w-[1%]">
                  {t("transactions.columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={11}
                isLoading={payments.isLoading}
                error={payments.error?.message}
                isEmpty={!payments.data?.items.length}
                loadingLabel={t("transactions.loading")}
                emptyLabel={t("transactions.empty")}
              />
              {payments.data?.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <p className="font-medium">
                      {payment.transactionReference ??
                        (payment.provider === "CASH" ? t("transactions.cash") : "—")}
                    </p>
                    <Link
                      href={`/dashboard/admin/orders/${payment.orderId}`}
                      className="text-muted-foreground text-xs underline"
                    >
                      {t("transactions.orderRef", {
                        ref: payment.orderId.slice(0, 8).toUpperCase(),
                      })}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p>
                      {payment.payer.firstName} {payment.payer.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {payment.payer.email ?? payment.payer.phoneNumber ?? ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    {payment.providerPaymentMethod ??
                      tOrders(`paymentMethod.${payment.method}`)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(payment.amountMinor, payment.currency, locale)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(payment.platformFeeMinor, payment.currency, locale)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(
                      payment.applicationFeeMinor,
                      payment.currency,
                      locale,
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.payoutAmountMinor !== null
                      ? formatMoney(
                          payment.payoutAmountMinor,
                          payment.currency,
                          locale,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PAYMENT_STATUS_CLASSES[payment.status]}
                      title={payment.failureReason ?? undefined}
                    >
                      {tTransactions(`paymentStatus.${payment.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.payoutStatus === "NOT_APPLICABLE" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge
                        variant="outline"
                        className={PAYOUT_STATUS_CLASSES[payment.payoutStatus]}
                        title={payment.payoutError ?? payment.payoutReference ?? undefined}
                      >
                        {tTransactions(`payoutStatus.${payment.payoutStatus}`)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(payment.paidAt ?? payment.createdAt, true, locale)}
                  </TableCell>
                  <TableCell>
                    {payment.provider === "LAWPAY" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("transactions.resync")}
                        title={t("transactions.resync")}
                        disabled={syncPayment.isPending}
                        onClick={() => syncPayment.mutate({ id: payment.id })}
                      >
                        <RefreshCwIcon className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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

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
  LEDGER_ACCOUNT_LABELS,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABELS,
  PAYOUT_STATUS_CLASSES,
  PAYOUT_STATUS_LABELS,
} from "@/lib/payment-utils";
import {
  formatDate,
  formatMoney,
  PAYMENT_METHOD_LABELS,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { RefreshCwIcon, SearchIcon } from "lucide-react";
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
        title="Transactions"
        description="Paiements LawPay, reversements aux fournisseurs et journal comptable de la plateforme."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {HEADLINE_ACCOUNTS.map((account) => {
          const rows = balanceFor(account);
          return (
            <Card key={account}>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  {LEDGER_ACCOUNT_LABELS[account]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <p className="text-2xl font-bold">—</p>
                ) : (
                  rows.map((row) => (
                    <p key={row.currency} className="text-2xl font-bold">
                      {formatMoney(Math.abs(row.balanceMinor), row.currency)}
                    </p>
                  ))
                )}
                <p className="text-muted-foreground text-sm">
                  {rows.reduce((sum, row) => sum + row.entryCount, 0)} écriture(s)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {summary.data && (
        <p className="text-muted-foreground text-sm">
          {summary.data.payments.succeeded} paiement(s) réussi(s) ·{" "}
          {summary.data.payments.pending} en attente ·{" "}
          {summary.data.payments.failed} échoué(s)/annulé(s) ·{" "}
          {summary.data.payments.refunded} remboursé(s) ·{" "}
          {summary.data.payments.payoutsPending} reversement(s) en cours ·{" "}
          <span
            className={
              summary.data.payments.payoutsFailed ? "text-destructive" : ""
            }
          >
            {summary.data.payments.payoutsFailed} reversement(s) en échec
          </span>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Paiements ({payments.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label="Filtrer par statut de paiement"
              >
                <option value="ALL">Tous les paiements</option>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={payoutStatus}
                onChange={(event) => {
                  setPayoutStatus(event.target.value as PayoutFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label="Filtrer par statut de reversement"
              >
                <option value="ALL">Tous les reversements</option>
                {Object.entries(PAYOUT_STATUS_LABELS)
                  .filter(([value]) => value !== "NOT_APPLICABLE")
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Référence LP-..."
                  className="h-9 w-48 pl-8"
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
                <TableHead>Référence</TableHead>
                <TableHead>Payeur</TableHead>
                <TableHead>Moyen</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Frais LawPay</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Net fournisseur</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Reversement</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[1%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={11}
                isLoading={payments.isLoading}
                error={payments.error?.message}
                isEmpty={!payments.data?.items.length}
                loadingLabel="Chargement des transactions..."
                emptyLabel="Aucune transaction trouvée."
              />
              {payments.data?.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <p className="font-medium">
                      {payment.transactionReference ??
                        (payment.provider === "CASH" ? "Espèces" : "—")}
                    </p>
                    <Link
                      href={`/dashboard/admin/orders/${payment.orderId}`}
                      className="text-muted-foreground text-xs underline"
                    >
                      Commande {payment.orderId.slice(0, 8).toUpperCase()}
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
                      PAYMENT_METHOD_LABELS[payment.method]}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(payment.amountMinor, payment.currency)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(payment.platformFeeMinor, payment.currency)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(payment.applicationFeeMinor, payment.currency)}
                  </TableCell>
                  <TableCell>
                    {payment.payoutAmountMinor !== null
                      ? formatMoney(payment.payoutAmountMinor, payment.currency)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PAYMENT_STATUS_CLASSES[payment.status]}
                      title={payment.failureReason ?? undefined}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status]}
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
                        {PAYOUT_STATUS_LABELS[payment.payoutStatus]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(payment.paidAt ?? payment.createdAt, true)}
                  </TableCell>
                  <TableCell>
                    {payment.provider === "LAWPAY" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Resynchroniser avec LawPay"
                        title="Resynchroniser avec LawPay"
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

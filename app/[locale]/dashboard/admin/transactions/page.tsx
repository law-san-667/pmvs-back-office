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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentStatus } from "@/lib/admin-types";
import {
  formatDate,
  formatMoney,
  PAYMENT_METHOD_LABELS,
} from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | PaymentStatus;

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  SUCCEEDED: "Réussie",
  CANCELLED: "Annulée",
  ERRORED: "Échouée",
};

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const payments = trpc.admin.payments.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    status: status === "ALL" ? undefined : status,
    transactionReference: deferredSearch || undefined,
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Transactions"
        description="Historique global des paiements de la plateforme."
      />

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({payments.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="ALL">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
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
                  placeholder="Référence..."
                  className="h-9 w-52 pl-8"
                />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Payeur</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Moyen</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={payments.isLoading}
                error={payments.error?.message}
                isEmpty={!payments.data?.items.length}
                loadingLabel="Chargement des transactions..."
                emptyLabel="Aucune transaction trouvée."
              />
              {payments.data?.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">
                    {payment.transactionReference ?? payment.id.slice(0, 12)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {payment.payer.firstName} {payment.payer.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {payment.payer.email ?? payment.payer.phoneNumber ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.orderId.slice(0, 8)}
                  </TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(payment.createdAt, true)}
                  </TableCell>
                  <TableCell className="font-bold whitespace-nowrap">
                    {formatMoney(payment.amountMinor, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {STATUS_LABELS[payment.status]}
                    </Badge>
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

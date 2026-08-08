"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatMoney, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  orderCount: number;
  totals: Map<string, number>;
};

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const payments = trpc.admin.payments.useQuery({
    page: 1,
    limit: 100,
    orderBy: "createdAt",
    order: "desc",
  });

  const customers = useMemo(() => {
    const rows = new Map<string, CustomerRow>();

    for (const payment of payments.data?.items ?? []) {
      const current = rows.get(payment.payer.id) ?? {
        id: payment.payer.id,
        name: `${payment.payer.firstName} ${payment.payer.lastName}`.trim(),
        email: payment.payer.email,
        phoneNumber: payment.payer.phoneNumber,
        orderCount: 0,
        totals: new Map<string, number>(),
      };

      current.orderCount += 1;
      current.totals.set(
        payment.currency,
        (current.totals.get(payment.currency) ?? 0) + payment.amountMinor,
      );
      rows.set(payment.payer.id, current);
    }

    const query = search.trim().toLowerCase();
    return Array.from(rows.values()).filter((customer) =>
      query
        ? [customer.name, customer.email, customer.phoneNumber]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true,
    );
  }, [payments.data?.items, search]);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Clients"
        description="Acheteurs identifiés à partir des transactions récentes de la plateforme."
      />

      <Card>
        <CardHeader>
          <CardTitle>Clients ({customers.length})</CardTitle>
          <CardAction>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom, email, téléphone..."
                className="h-9 w-64 pl-8"
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Commandes récentes</TableHead>
                <TableHead>Montant récent</TableHead>
                <TableHead>Identifiant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={5}
                isLoading={payments.isLoading}
                error={payments.error?.message}
                isEmpty={!customers.length}
                loadingLabel="Chargement des clients..."
                emptyLabel="Aucun client trouvé dans les transactions récentes."
              />
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {customer.email ?? "Aucun email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.phoneNumber ?? "—"}</TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell className="font-bold">
                    {Array.from(customer.totals.entries()).map(
                      ([currency, amount]) => (
                        <p key={currency} className="whitespace-nowrap">
                          {formatMoney(amount, currency)}
                        </p>
                      ),
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {customer.id.slice(0, 8)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

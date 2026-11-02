"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  ticketReference,
} from "@/lib/support";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";

type Filter = "open" | "mine" | "none" | "overdue" | "resolved";

const FILTERS: Record<Filter, string> = {
  open: "En cours",
  mine: "Mes demandes",
  none: "Non attribuées",
  overdue: "En retard",
  resolved: "Résolues",
};

/** Team queue: buyer and seller requests, most urgent first. */
export default function AdminSupportPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("open");
  const queue = trpc.support.queue.useQuery({
    page: 1,
    ...(filter === "mine" && { assignee: "me" as const }),
    ...(filter === "none" && { assignee: "none" as const }),
    ...(filter === "overdue" && { overdue: true }),
    ...(filter === "resolved" && { status: "RESOLVED" as const }),
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Service client"
        description="Demandes des acheteurs et des vendeurs. Délai de première réponse : 4 h pour les paiements et commandes, 24 h sinon."
      />
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTERS) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              filter === key && "bg-primary text-primary-foreground",
            )}
          >
            {FILTERS[key]}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Demande</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Réponse attendue</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={queue.isLoading}
                error={queue.error?.message}
                isEmpty={!queue.data?.items.length}
                loadingLabel="Chargement des demandes..."
                emptyLabel="Aucune demande."
              />
              {queue.data?.items.map((ticket) => {
                const late =
                  !ticket.firstRespondedAt &&
                  new Date(ticket.firstResponseDueAt).getTime() < queue.dataUpdatedAt;
                return (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/support/${ticket.id}`)
                    }
                  >
                    <TableCell>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-muted-foreground text-xs">
                        {ticketReference(ticket.id)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {ticket.requester
                        ? `${ticket.requester.firstName} ${ticket.requester.lastName}`
                        : "—"}
                      {ticket.business && (
                        <p className="text-muted-foreground text-xs">
                          Boutique {ticket.business.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </TableCell>
                    <TableCell>
                      {TICKET_PRIORITY_LABELS[ticket.priority]}
                    </TableCell>
                    <TableCell
                      className={cn(late && "font-medium text-red-600")}
                    >
                      {ticket.firstRespondedAt
                        ? "Répondu"
                        : new Date(ticket.firstResponseDueAt).toLocaleString(
                            "fr-FR",
                          )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

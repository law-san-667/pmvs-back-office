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
import { intlLocale } from "@/i18n/config";
import { ticketReference } from "@/lib/support";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type Filter = "open" | "mine" | "none" | "overdue" | "resolved";

const FILTERS: Filter[] = ["open", "mine", "none", "overdue", "resolved"];

/** Team queue: buyer and seller requests, most urgent first. */
export default function AdminSupportPage() {
  const router = useRouter();
  const t = useTranslations("adminSystem");
  const tSupport = useTranslations("support");
  const locale = useLocale();
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
        title={t("pages.support.title")}
        description={t("pages.support.description")}
      />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              filter === key && "bg-primary text-primary-foreground",
            )}
          >
            {t(`pages.support.filters.${key}`)}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.support.columns.request")}</TableHead>
                <TableHead>{t("pages.support.columns.requester")}</TableHead>
                <TableHead>{t("pages.support.columns.subject")}</TableHead>
                <TableHead>{t("pages.support.columns.priority")}</TableHead>
                <TableHead>{t("pages.support.columns.responseDue")}</TableHead>
                <TableHead>{t("pages.support.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={queue.isLoading}
                error={queue.error?.message}
                isEmpty={!queue.data?.items.length}
                loadingLabel={t("pages.support.loading")}
                emptyLabel={t("pages.support.empty")}
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
                          {tSupport("ticket.shop", { name: ticket.business.name })}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {tSupport(`category.${ticket.category}`)}
                    </TableCell>
                    <TableCell>
                      {tSupport(`priority.${ticket.priority}`)}
                    </TableCell>
                    <TableCell
                      className={cn(late && "font-medium text-red-600")}
                    >
                      {ticket.firstRespondedAt
                        ? t("pages.support.answered")
                        : new Date(ticket.firstResponseDueAt).toLocaleString(
                            intlLocale(locale),
                          )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tSupport(`status.${ticket.status}`)}
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

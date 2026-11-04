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
import type { TenderType } from "@/lib/backend-resource-types";
import { formatDate, formatMoney } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";

const PAGE_SIZE = 10;
type TypeFilter = "ALL" | TenderType;

const TENDER_TYPES: TenderType[] = [
  "SUPPLY",
  "SERVICE",
  "WORKS",
  "INTELLECTUAL_SERVICE",
];

export default function AdminTendersPage() {
  const t = useTranslations("adminCommerce");
  const tTenders = useTranslations("tenders");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const deferredSearch = useDeferredValue(search.trim());
  const tenders = trpc.admin.tenders.useQuery({
    page,
    limit: PAGE_SIZE,
    orderBy: "createdAt",
    order: "desc",
    title: deferredSearch || undefined,
    type: type === "ALL" ? undefined : type,
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("tenders.title")}
        description={t("tenders.description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("tenders.cardTitle", { count: tenders.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as TypeFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                <option value="ALL">{t("tenders.allTypes")}</option>
                {TENDER_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {tTenders(`type.${value}`)}
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
                  placeholder={t("common.search")}
                  className="h-9 w-56 ps-8"
                />
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenders.columns.title")}</TableHead>
                <TableHead>{t("tenders.columns.type")}</TableHead>
                <TableHead>{t("tenders.columns.publisher")}</TableHead>
                <TableHead>{t("tenders.columns.location")}</TableHead>
                <TableHead>{t("tenders.columns.budget")}</TableHead>
                <TableHead>{t("tenders.columns.deadline")}</TableHead>
                <TableHead>{t("tenders.columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={tenders.isLoading}
                error={tenders.error?.message}
                isEmpty={!tenders.data?.items.length}
                loadingLabel={t("tenders.loading")}
                emptyLabel={t("tenders.empty")}
              />
              {tenders.data?.items.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell className="font-medium">{tender.title}</TableCell>
                  <TableCell>{tTenders(`type.${tender.type}`)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {tender.publisherBusinessId?.slice(0, 8) ??
                      t("tenders.individual")}
                  </TableCell>
                  <TableCell>
                    {[tender.location, tender.countryCode]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {tender.budgetMinMinor === null &&
                    tender.budgetMaxMinor === null
                      ? t("tenders.budgetUnspecified")
                      : `${tender.budgetMinMinor === null ? "" : formatMoney(tender.budgetMinMinor, tender.currency, locale)}${tender.budgetMinMinor !== null && tender.budgetMaxMinor !== null ? " – " : ""}${tender.budgetMaxMinor === null ? "" : formatMoney(tender.budgetMaxMinor, tender.currency, locale)}`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(tender.submissionDeadline, false, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tTenders.has(`status.${tender.status}`)
                        ? tTenders(`status.${tender.status}`)
                        : tender.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={tenders.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

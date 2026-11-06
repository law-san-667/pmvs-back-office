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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { intlLocale } from "@/i18n/config";
import { formatDate } from "@/lib/seller-dashboard-utils";
import type {
  ClassifiedContactStatus,
  ClassifiedType,
} from "@/server/trpc/_procedures/classifieds";
import { trpc } from "@/server/trpc/client";
import { StarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const PAGE_SIZE = 20;
type StatusFilter = "ALL" | ClassifiedContactStatus;
type TypeFilter = "ALL" | ClassifiedType;
const STATUS_TABS: StatusFilter[] = [
  "ALL",
  "OPEN",
  "IN_DISCUSSION",
  "CONCLUDED",
  "NO_FOLLOW_UP",
];

const STATUS_CLASSES: Record<ClassifiedContactStatus, string> = {
  OPEN: "border-sky-200 bg-sky-50 text-sky-700",
  IN_DISCUSSION: "border-amber-200 bg-amber-50 text-amber-700",
  CONCLUDED: "border-green-200 bg-green-50 text-green-700",
  NO_FOLLOW_UP: "border-slate-200 bg-slate-50 text-slate-600",
};

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | undefined;
  hint?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <p className="text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardHeader>
    </Card>
  );
}

/** One side's rating of the other, with its comment as a tooltip. */
function Rating({
  label,
  rating,
  comment,
}: {
  label: string;
  rating: number | null;
  comment: string | null;
}) {
  return (
    <p
      className="flex items-center gap-1 text-xs whitespace-nowrap"
      title={comment ?? undefined}
    >
      <span className="text-muted-foreground">{label}</span>
      {rating === null ? (
        "—"
      ) : (
        <>
          <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{rating}/5</span>
        </>
      )}
    </p>
  );
}

/** Follow-up of the « mises en relation » born from the classifieds. */
export default function AdminClassifiedContactsPage() {
  const t = useTranslations("adminClassifieds");
  const locale = useLocale();
  const number = (value: number, digits = 0) =>
    value.toLocaleString(intlLocale(locale), {
      maximumFractionDigits: digits,
    });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const stats = trpc.classifieds.contactStats.useQuery();
  const contacts = trpc.classifieds.adminContacts.useQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    type: typeFilter === "ALL" ? undefined : typeFilter,
  });
  const s = stats.data;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("contacts.title")}
        description={t("contacts.description")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label={t("contacts.tiles.total")}
          value={s && number(s.total)}
          hint={
            s &&
            t("contacts.tiles.totalHint", {
              offers: s.byType.OFFER,
              demands: s.byType.DEMAND,
            })
          }
        />
        <Tile
          label={t("contacts.tiles.concluded")}
          value={s && number(s.byStatus.CONCLUDED)}
          hint={
            s &&
            (s.conclusionRate === null
              ? t("contacts.tiles.noRate")
              : t("contacts.tiles.rate", {
                  rate: number(s.conclusionRate, 1),
                }))
          }
        />
        <Tile
          label={t("contacts.tiles.rating")}
          value={
            s &&
            (s.averageRating === null
              ? "—"
              : t("contacts.ratingValue", {
                  rating: number(s.averageRating, 1),
                }))
          }
          hint={
            s && t("contacts.tiles.ratingsCount", { count: s.ratingsCount })
          }
        />
        <Tile
          label={t("contacts.tiles.pairs")}
          value={s && number(s.pairs)}
          hint={t("contacts.tiles.pairsHint")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("withCount", {
              label: t(`contacts.status.${statusFilter}`),
              count: contacts.data?.total ?? 0,
            })}
          </CardTitle>
          <CardAction>
            <select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as TypeFilter);
                setPage(1);
              }}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              aria-label={t("filterType")}
            >
              <option value="ALL">{t("type.ALL")}</option>
              <option value="OFFER">{t("type.OFFER")}</option>
              <option value="DEMAND">{t("type.DEMAND")}</option>
            </select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab}
                size="sm"
                variant={statusFilter === tab ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
              >
                {t(`contacts.status.${tab}`)}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("contacts.columns.classified")}</TableHead>
                <TableHead>{t("contacts.columns.type")}</TableHead>
                <TableHead>{t("contacts.columns.publisher")}</TableHead>
                <TableHead>{t("contacts.columns.responder")}</TableHead>
                <TableHead>{t("contacts.columns.status")}</TableHead>
                <TableHead>{t("contacts.columns.ratings")}</TableHead>
                <TableHead>{t("contacts.columns.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={contacts.isLoading}
                error={contacts.error?.message}
                isEmpty={!contacts.data?.items.length}
                loadingLabel={t("contacts.loading")}
                emptyLabel={t("contacts.empty")}
              />
              {contacts.data?.items.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <p
                      className="max-w-64 truncate font-medium"
                      title={contact.classified.title}
                    >
                      <bdi>{contact.classified.title}</bdi>
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`type.${contact.classified.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-40 truncate">
                      <bdi>{contact.publisherName ?? "—"}</bdi>
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-40 truncate">
                      <bdi>{contact.responderName ?? "—"}</bdi>
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASSES[contact.status]}
                    >
                      {t(`contacts.status.${contact.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Rating
                      label={t("contacts.ratingByPublisher")}
                      rating={contact.publisherRating}
                      comment={contact.publisherComment}
                    />
                    <Rating
                      label={t("contacts.ratingByResponder")}
                      rating={contact.responderRating}
                      comment={contact.responderComment}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <p>{formatDate(contact.createdAt, false, locale)}</p>
                    {contact.updatedAt !== contact.createdAt && (
                      <p className="text-muted-foreground text-xs">
                        {t("updated", {
                          date: formatDate(contact.updatedAt, false, locale),
                        })}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={contacts.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

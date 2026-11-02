"use client";

import { ResultTable } from "@/components/reports/report-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { intlLocale } from "@/i18n/config";
import {
  isEmailStatus,
  REPORT_FORMATS,
  type ReportArchive,
  type ReportSubscription,
} from "@/lib/reports";
import { trpc } from "@/server/trpc/client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/** "12 mars 2026" or "1 mars 2026 au 31 mars 2026", in the page's language. */
function usePeriodFormat() {
  const t = useTranslations("reports.automatic");
  const locale = useLocale();
  const formatDate = (day: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeZone: "UTC" }).format(
      new Date(`${day}T00:00:00Z`),
    );
  return (archive: Pick<ReportArchive, "periodFrom" | "periodTo">) =>
    archive.periodFrom === archive.periodTo
      ? formatDate(archive.periodFrom)
      : t("period", { from: formatDate(archive.periodFrom), to: formatDate(archive.periodTo) });
}

function SubscriptionRow({
  businessId,
  subscription,
}: {
  businessId?: string;
  subscription: ReportSubscription;
}) {
  const t = useTranslations("reports");
  const utils = trpc.useUtils();
  const [emails, setEmails] = useState(subscription.emails.join(", "));
  const update = trpc.reports.updateSubscription.useMutation({
    onSuccess: async (saved) => {
      setEmails(saved.emails.join(", "));
      await utils.reports.subscriptions.invalidate({ businessId });
      toast.success(t("automatic.saved"));
    },
    onError: (error) => toast.error(error.message),
  });
  const parsed = emails.split(/[,;\s]+/).filter(Boolean);
  const label = t(`frequency.${subscription.frequency}`);
  const changed = parsed.join() !== subscription.emails.join();

  return (
    <div className="grid gap-3 border-b py-4 last:border-b-0 md:grid-cols-[1fr_2fr]">
      <Label className="items-start font-normal">
        <Checkbox
          checked={subscription.isActive}
          disabled={update.isPending}
          onCheckedChange={(checked) =>
            update.mutate({
              businessId,
              frequency: subscription.frequency,
              isActive: Boolean(checked),
              emails: subscription.emails,
            })
          }
        />
        <span>
          <span className="block font-medium">{label}</span>
          <span className="text-muted-foreground block text-xs">
            {t(`frequencyHint.${subscription.frequency}`)}
          </span>
        </span>
      </Label>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate({
            businessId,
            frequency: subscription.frequency,
            isActive: subscription.isActive,
            emails: parsed,
          });
        }}
      >
        <Input
          aria-label={t(`automatic.recipientsLabel.${subscription.frequency}`)}
          placeholder={t("automatic.recipientsPlaceholder")}
          value={emails}
          onChange={(event) => setEmails(event.target.value)}
          className="min-w-52 flex-1"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!changed || update.isPending}>
          {t("automatic.save")}
        </Button>
      </form>
    </div>
  );
}

function ArchiveDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations("reports.automatic");
  const formatPeriod = usePeriodFormat();
  const archive = trpc.reports.archive.useQuery({ id });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{archive.data?.title ?? t("report")}</DialogTitle>
        </DialogHeader>
        {archive.error && <p className="text-destructive text-sm">{archive.error.message}</p>}
        {archive.data && (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">{formatPeriod(archive.data)}</p>
            <ResultTable report={archive.data.result} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** What is sent automatically, to whom, and what was sent. */
export function AutomaticReports({ businessId }: { businessId?: string }) {
  const t = useTranslations("reports");
  const formatPeriod = usePeriodFormat();
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<string | null>(null);
  const subscriptions = trpc.reports.subscriptions.useQuery({ businessId });
  const archives = trpc.reports.archives.useQuery(
    { businessId, page, limit: 20 },
    { placeholderData: (previous) => previous },
  );
  const totalPages = archives.data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("automatic.emailTitle")}</CardTitle>
          <CardDescription>
            {businessId ? t("automatic.emailShop") : t("automatic.emailPlatform")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.error && <p className="text-destructive text-sm">{subscriptions.error.message}</p>}
          {subscriptions.data?.map((subscription) => (
            <SubscriptionRow
              key={`${subscription.frequency}-${subscription.emails.join()}`}
              businessId={businessId}
              subscription={subscription}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("automatic.archivesTitle")}</CardTitle>
          <CardDescription>{t("automatic.archivesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {archives.error && <p className="text-destructive text-sm">{archives.error.message}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("automatic.columns.period")}</TableHead>
                <TableHead>{t("automatic.columns.type")}</TableHead>
                <TableHead>{t("automatic.columns.sending")}</TableHead>
                <TableHead className="text-end">{t("automatic.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archives.data?.items.map((archive) => (
                <TableRow key={archive.id}>
                  <TableCell className="font-medium whitespace-nowrap">{formatPeriod(archive)}</TableCell>
                  <TableCell>{t(`frequency.${archive.frequency}`)}</TableCell>
                  <TableCell>
                    <Badge variant={archive.emailStatus === "SENT" ? "secondary" : "destructive"}>
                      {isEmailStatus(archive.emailStatus)
                        ? t(`emailStatus.${archive.emailStatus}`)
                        : archive.emailStatus}
                    </Badge>
                    {archive.recipientsCount > 0 && (
                      <span className="text-muted-foreground ms-2 text-xs">
                        {t("automatic.recipients", { count: archive.recipientsCount })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-end whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setOpened(archive.id)}>
                      {t("automatic.view")}
                    </Button>
                    {REPORT_FORMATS.map((format) => (
                      <Button
                        key={format.value}
                        size="sm"
                        variant="ghost"
                        nativeButton={false}
                        render={<a href={`/api/report-archive/${archive.id}?format=${format.value}`} />}
                      >
                        {format.label}
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
              {archives.data && !archives.data.items.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    {t("automatic.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t("automatic.previous")}
              </Button>
              <span className="text-muted-foreground text-sm">
                {page} / {totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                {t("automatic.next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {opened && <ArchiveDialog id={opened} onClose={() => setOpened(null)} />}
    </div>
  );
}

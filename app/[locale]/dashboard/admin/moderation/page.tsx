"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { intlLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const REPORT_REASONS = [
  "FRAUD",
  "PROHIBITED_PRODUCT",
  "COUNTERFEIT",
  "OFFENSIVE",
  "SPAM",
  "WRONG_INFORMATION",
  "OTHER",
] as const;
const isKnownReason = (
  reason: string,
): reason is (typeof REPORT_REASONS)[number] =>
  (REPORT_REASONS as readonly string[]).includes(reason);

/** Reports from users and reviews to moderate. */
export default function ModerationPage() {
  const t = useTranslations("adminCommerce");
  const locale = useLocale();
  const reasonLabel = (reason: string) =>
    isKnownReason(reason) ? t(`moderation.reason.${reason}`) : reason;
  const utils = trpc.useUtils();
  const [reportStatus, setReportStatus] = useState<
    "PENDING" | "RESOLVED" | "DISMISSED"
  >("PENDING");
  const [reviewStatus, setReviewStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED"
  >("PENDING");
  const reports = trpc.moderation.reports.useQuery({ status: reportStatus });
  const reviews = trpc.moderation.reviews.useQuery({ status: reviewStatus });
  const setting = trpc.moderation.reviewSetting.useQuery();
  const handle = trpc.moderation.handleReport.useMutation();
  const moderate = trpc.moderation.moderateReview.useMutation();
  const saveSetting = trpc.moderation.setReviewSetting.useMutation();

  const run = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      toast.success(done);
      await utils.moderation.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.failed"));
    }
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-sm",
      active && "bg-primary text-primary-foreground",
    );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("moderation.title")}
        description={t("moderation.description")}
      />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">
            {t("moderation.tabs.reports")}
          </TabsTrigger>
          <TabsTrigger value="reviews">
            {t("moderation.tabs.reviews")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(["PENDING", "RESOLVED", "DISMISSED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={chip(reportStatus === s)}
                onClick={() => setReportStatus(s)}
              >
                {t(`moderation.reportStatus.${s}`)}
              </button>
            ))}
          </div>
          {!reports.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {reports.isLoading
                ? t("common.loading")
                : t("moderation.noReports")}
            </p>
          )}
          {reports.data?.items.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col gap-3 pt-6 text-sm md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t(`moderation.targetType.${report.type}`)}</Badge>
                    <span className="font-semibold">
                      {reasonLabel(report.reason)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(report.createdAt).toLocaleDateString(
                        intlLocale(locale),
                      )}
                    </span>
                  </div>
                  <p className="mt-1">
                    {report.target?.label ?? t("moderation.deletedContent")}
                  </p>
                  {report.description && (
                    <p className="text-muted-foreground mt-1">
                      {t("moderation.quote", { text: report.description })}
                    </p>
                  )}
                  {report.resolutionNote && (
                    <p className="text-muted-foreground mt-1">
                      {t("moderation.decision", {
                        note: report.resolutionNote,
                      })}
                    </p>
                  )}
                </div>
                {report.status === "PENDING" && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={handle.isPending}
                      onClick={() =>
                        void run(
                          () =>
                            handle.mutateAsync({
                              id: report.id,
                              status: "DISMISSED",
                              hideTarget: false,
                              note: null,
                            }),
                          t("moderation.dismissed"),
                        )
                      }
                    >
                      {t("moderation.dismiss")}
                    </Button>
                    <Button
                      size="sm"
                      disabled={handle.isPending}
                      onClick={() => {
                        const note = window.prompt(
                          t("moderation.reasonPrompt"),
                          isKnownReason(report.reason)
                            ? t(`moderation.reason.${report.reason}`)
                            : "",
                        );
                        if (note === null) return;
                        void run(
                          () =>
                            handle.mutateAsync({
                              id: report.id,
                              status: "RESOLVED",
                              hideTarget: true,
                              note: note.trim() || null,
                            }),
                          t("moderation.removed"),
                        );
                      }}
                    >
                      {t(`moderation.hide.${report.type}`)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reviews" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("moderation.reviewPublishing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm">
              {(["post", "pre"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="review-mode"
                    checked={setting.data?.mode === mode}
                    disabled={saveSetting.isPending}
                    onChange={() =>
                      void run(
                        () => saveSetting.mutateAsync({ mode }),
                        t("moderation.settingSaved"),
                      )
                    }
                  />
                  {t(`moderation.mode.${mode}`)}
                </label>
              ))}
            </CardContent>
          </Card>
          <div className="flex gap-2">
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={chip(reviewStatus === s)}
                onClick={() => setReviewStatus(s)}
              >
                {t(`moderation.reviewStatus.${s}`)}
              </button>
            ))}
          </div>
          {!reviews.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {reviews.isLoading
                ? t("common.loading")
                : t("moderation.noReviews")}
            </p>
          )}
          {reviews.data?.items.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex flex-col gap-3 pt-6 text-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)} {review.title}
                  </p>
                  {review.comment && <p className="mt-1">{review.comment}</p>}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {review.reviewer
                      ? `${review.reviewer.firstName} ${review.reviewer.lastName} · `
                      : ""}
                    {new Date(review.createdAt).toLocaleDateString(
                      intlLocale(locale),
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {review.moderationStatus !== "APPROVED" && (
                    <Button
                      size="sm"
                      disabled={moderate.isPending}
                      onClick={() =>
                        void run(
                          () =>
                            moderate.mutateAsync({
                              id: review.id,
                              status: "APPROVED",
                              reason: null,
                            }),
                          t("moderation.published"),
                        )
                      }
                    >
                      {t("moderation.publish")}
                    </Button>
                  )}
                  {review.moderationStatus !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={moderate.isPending}
                      onClick={() => {
                        const reason = window.prompt(
                          t("moderation.reasonPrompt"),
                          "",
                        );
                        if (reason === null) return;
                        void run(
                          () =>
                            moderate.mutateAsync({
                              id: review.id,
                              status: "REJECTED",
                              reason: reason.trim() || null,
                            }),
                          t("moderation.hidden"),
                        );
                      }}
                    >
                      {t("moderation.hideReview")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

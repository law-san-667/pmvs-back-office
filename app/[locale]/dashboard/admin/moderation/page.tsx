"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import type { ContentReport } from "@/server/trpc/_procedures/moderation";
import { useState } from "react";
import { toast } from "sonner";

const TYPE_LABELS: Record<ContentReport["type"], string> = {
  LISTING: "Annonce",
  REVIEW: "Avis",
  BUSINESS: "Boutique",
  USER: "Utilisateur",
};
const HIDE_LABELS: Record<ContentReport["type"], string> = {
  LISTING: "Retirer l’annonce",
  REVIEW: "Masquer l’avis",
  BUSINESS: "Suspendre la boutique",
  USER: "Suspendre le compte",
};
const REASON_LABELS: Record<string, string> = {
  FRAUD: "Fraude",
  PROHIBITED_PRODUCT: "Produit interdit",
  COUNTERFEIT: "Contrefaçon",
  OFFENSIVE: "Contenu offensant",
  SPAM: "Spam",
  WRONG_INFORMATION: "Informations fausses",
  OTHER: "Autre",
};

/** Reports from users and reviews to moderate. */
export default function ModerationPage() {
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
      toast.error(error instanceof Error ? error.message : "Échec.");
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
        title="Modération"
        description="Signalements des utilisateurs et avis clients. Chaque décision est enregistrée."
      />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Signalements</TabsTrigger>
          <TabsTrigger value="reviews">Avis</TabsTrigger>
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
                {
                  {
                    PENDING: "À traiter",
                    RESOLVED: "Traités",
                    DISMISSED: "Rejetés",
                  }[s]
                }
              </button>
            ))}
          </div>
          {!reports.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {reports.isLoading ? "Chargement…" : "Aucun signalement."}
            </p>
          )}
          {reports.data?.items.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col gap-3 pt-6 text-sm md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{TYPE_LABELS[report.type]}</Badge>
                    <span className="font-semibold">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="mt-1">
                    {report.target?.label ?? "Contenu supprimé"}
                  </p>
                  {report.description && (
                    <p className="text-muted-foreground mt-1">
                      « {report.description} »
                    </p>
                  )}
                  {report.resolutionNote && (
                    <p className="text-muted-foreground mt-1">
                      Décision : {report.resolutionNote}
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
                          "Signalement rejeté.",
                        )
                      }
                    >
                      Rien à signaler
                    </Button>
                    <Button
                      size="sm"
                      disabled={handle.isPending}
                      onClick={() => {
                        const note = window.prompt(
                          "Motif (communiqué à l’auteur) :",
                          REASON_LABELS[report.reason] ?? "",
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
                          "Contenu retiré.",
                        );
                      }}
                    >
                      {HIDE_LABELS[report.type]}
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
              <CardTitle className="text-base">Publication des avis</CardTitle>
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
                        "Réglage enregistré.",
                      )
                    }
                  />
                  {mode === "post"
                    ? "Publiés tout de suite (retirés sur signalement)"
                    : "Publiés après validation d’un modérateur"}
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
                {
                  {
                    PENDING: "En attente",
                    APPROVED: "Publiés",
                    REJECTED: "Masqués",
                  }[s]
                }
              </button>
            ))}
          </div>
          {!reviews.data?.items.length && (
            <p className="text-muted-foreground text-sm">
              {reviews.isLoading ? "Chargement…" : "Aucun avis."}
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
                    {new Date(review.createdAt).toLocaleDateString("fr-FR")}
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
                          "Avis publié.",
                        )
                      }
                    >
                      Publier
                    </Button>
                  )}
                  {review.moderationStatus !== "REJECTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={moderate.isPending}
                      onClick={() => {
                        const reason = window.prompt(
                          "Motif (communiqué à l’auteur) :",
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
                          "Avis masqué.",
                        );
                      }}
                    >
                      Masquer
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

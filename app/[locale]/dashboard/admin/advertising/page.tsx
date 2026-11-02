"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdFormDialog,
  type AdFormValues,
} from "@/components/advertising/ad-form-dialog";
import { AdStatsDialog } from "@/components/advertising/ad-stats-dialog";
import { AdsTable } from "@/components/advertising/ads-table";
import { PLACEMENT_LABELS } from "@/components/advertising/ad-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { AdPlacement, Advertisement } from "@/lib/advertising";
import { AD_PLACEMENTS } from "@/lib/advertising";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";
type OwnerFilter = "platform" | "business" | "ALL";
const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

/**
 * Every ad: the platform's own ads and banners, and the shops' ads to review
 * (awaiting review first).
 */
export default function AdminAdvertisingPage() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [owner, setOwner] = useState<OwnerFilter>("ALL");
  const [placement, setPlacement] = useState<AdPlacement | "ALL">("ALL");
  const ads = trpc.advertising.adminList.useQuery({
    page,
    limit: 20,
    status: status === "ALL" ? undefined : status,
    owner: owner === "ALL" ? undefined : owner,
    placement: placement === "ALL" ? undefined : placement,
  });
  const pending = trpc.advertising.adminList.useQuery({
    page: 1,
    limit: 1,
    status: "PENDING",
  });
  const create = trpc.advertising.createPlatform.useMutation();
  const update = trpc.advertising.update.useMutation();
  const remove = trpc.advertising.delete.useMutation();
  const review = trpc.advertising.review.useMutation();
  const [editing, setEditing] = useState<Advertisement | "new" | null>(null);
  const [statsOf, setStatsOf] = useState<Advertisement | null>(null);
  const [rejecting, setRejecting] = useState<Advertisement | null>(null);
  const [reason, setReason] = useState("");
  const refresh = () => utils.advertising.adminList.invalidate();

  const act = async (run: () => Promise<unknown>, done: string) => {
    try {
      await run();
      toast.success(done);
      await refresh();
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action impossible.",
      );
      return false;
    }
  };

  const save = async (values: AdFormValues) => {
    const ok = await act(
      () =>
        editing && editing !== "new"
          ? update.mutateAsync({ id: editing.id, ...values })
          : create.mutateAsync(values),
      editing && editing !== "new"
        ? "Publicité mise à jour."
        : "Publicité publiée.",
    );
    if (ok) setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">Publicités et bannières</h1>
        <p className="text-muted-foreground text-sm">
          Les bannières de l&apos;accueil et les publicités de la plateforme, et
          les demandes des fournisseurs à valider
          {pending.data?.total ? ` (${pending.data.total} en attente)` : ""}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Publicités ({ads.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={selectClass}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">À valider</option>
                <option value="APPROVED">Validées</option>
                <option value="REJECTED">Refusées</option>
              </select>
              <select
                className={selectClass}
                value={owner}
                onChange={(event) => {
                  setOwner(event.target.value as OwnerFilter);
                  setPage(1);
                }}
              >
                <option value="ALL">Tous les annonceurs</option>
                <option value="platform">Diarama</option>
                <option value="business">Fournisseurs</option>
              </select>
              <select
                className={selectClass}
                value={placement}
                onChange={(event) => {
                  setPlacement(event.target.value as AdPlacement | "ALL");
                  setPage(1);
                }}
              >
                <option value="ALL">Tous les emplacements</option>
                {AD_PLACEMENTS.map((value) => (
                  <option key={value} value={value}>
                    {PLACEMENT_LABELS[value]}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => setEditing("new")}>
                Nouvelle publicité
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <AdsTable
            ads={ads.data?.items}
            isLoading={ads.isLoading}
            error={ads.error?.message}
            showOwner
            actions={(ad) => [
              ad.status !== "APPROVED" && {
                label: "Valider",
                primary: true,
                disabled: review.isPending,
                onClick: () =>
                  void act(
                    () => review.mutateAsync({ id: ad.id, status: "APPROVED" }),
                    "Publicité validée.",
                  ),
              },
              ad.status !== "REJECTED" &&
                ad.businessId !== null && {
                  label: "Refuser",
                  primary: ad.status === "PENDING",
                  onClick: () => {
                    setReason("");
                    setRejecting(ad);
                  },
                },
              { label: "Statistiques", onClick: () => setStatsOf(ad) },
              { label: "Modifier", onClick: () => setEditing(ad) },
              ad.status === "APPROVED" && {
                label: ad.isActive ? "Suspendre" : "Réactiver",
                disabled: update.isPending,
                onClick: () =>
                  void act(
                    () =>
                      update.mutateAsync({ id: ad.id, isActive: !ad.isActive }),
                    ad.isActive
                      ? "Publicité suspendue."
                      : "Publicité réactivée.",
                  ),
              },
              {
                label: "Supprimer",
                destructive: true,
                disabled: remove.isPending,
                onClick: () => {
                  if (window.confirm(`Supprimer « ${ad.title} » ?`)) {
                    void act(
                      () => remove.mutateAsync({ id: ad.id }),
                      "Publicité supprimée.",
                    );
                  }
                },
              },
            ]}
          />
          <AdminPagination
            page={page}
            totalPages={ads.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
      <AdFormDialog
        open={editing !== null}
        ad={editing === "new" ? null : editing}
        platform
        saving={create.isPending || update.isPending}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
      <AdStatsDialog ad={statsOf} onClose={() => setStatsOf(null)} />
      <AlertDialog
        open={rejecting !== null}
        onOpenChange={(isOpen) => !isOpen && setRejecting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser « {rejecting?.title} »</AlertDialogTitle>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            maxLength={500}
            placeholder="Motif communiqué au fournisseur"
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={!reason.trim() || review.isPending}
              onClick={async (event) => {
                event.preventDefault();
                if (!rejecting) return;
                const ok = await act(
                  () =>
                    review.mutateAsync({
                      id: rejecting.id,
                      status: "REJECTED",
                      reason: reason.trim(),
                    }),
                  "Publicité refusée, le fournisseur est prévenu.",
                );
                if (ok) setRejecting(null);
              }}
            >
              Refuser
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

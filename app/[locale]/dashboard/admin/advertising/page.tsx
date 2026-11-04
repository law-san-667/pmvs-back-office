"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdFormDialog,
  type AdFormValues,
} from "@/components/advertising/ad-form-dialog";
import { AdStatsDialog } from "@/components/advertising/ad-stats-dialog";
import { AdsTable } from "@/components/advertising/ads-table";
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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("adminCommerce");
  const tAds = useTranslations("ads");
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
        error instanceof Error ? error.message : tAds("errors.actionFailed"),
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
        ? tAds("toast.updated")
        : t("advertising.published"),
    );
    if (ok) setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("advertising.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {pending.data?.total
            ? t("advertising.descriptionPending", {
                count: pending.data.total,
              })
            : t("advertising.description")}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("advertising.cardTitle", { count: ads.data?.total ?? 0 })}
          </CardTitle>
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
                <option value="ALL">{t("advertising.status.ALL")}</option>
                <option value="PENDING">
                  {t("advertising.status.PENDING")}
                </option>
                <option value="APPROVED">
                  {t("advertising.status.APPROVED")}
                </option>
                <option value="REJECTED">
                  {t("advertising.status.REJECTED")}
                </option>
              </select>
              <select
                className={selectClass}
                value={owner}
                onChange={(event) => {
                  setOwner(event.target.value as OwnerFilter);
                  setPage(1);
                }}
              >
                <option value="ALL">{t("advertising.owner.ALL")}</option>
                <option value="platform">Diarama</option>
                <option value="business">
                  {t("advertising.owner.business")}
                </option>
              </select>
              <select
                className={selectClass}
                value={placement}
                onChange={(event) => {
                  setPlacement(event.target.value as AdPlacement | "ALL");
                  setPage(1);
                }}
              >
                <option value="ALL">{t("advertising.allPlacements")}</option>
                {AD_PLACEMENTS.map((value) => (
                  <option key={value} value={value}>
                    {tAds(`placement.${value}`)}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => setEditing("new")}>
                {t("advertising.new")}
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
                label: t("common.approve"),
                primary: true,
                disabled: review.isPending,
                onClick: () =>
                  void act(
                    () => review.mutateAsync({ id: ad.id, status: "APPROVED" }),
                    t("advertising.approved"),
                  ),
              },
              ad.status !== "REJECTED" &&
                ad.businessId !== null && {
                  label: t("common.reject"),
                  primary: ad.status === "PENDING",
                  onClick: () => {
                    setReason("");
                    setRejecting(ad);
                  },
                },
              { label: tAds("actions.stats"), onClick: () => setStatsOf(ad) },
              { label: tAds("actions.edit"), onClick: () => setEditing(ad) },
              ad.status === "APPROVED" && {
                label: ad.isActive
                  ? tAds("actions.pause")
                  : tAds("actions.resume"),
                disabled: update.isPending,
                onClick: () =>
                  void act(
                    () =>
                      update.mutateAsync({ id: ad.id, isActive: !ad.isActive }),
                    ad.isActive
                      ? tAds("toast.paused")
                      : tAds("toast.resumed"),
                  ),
              },
              {
                label: tAds("actions.delete"),
                destructive: true,
                disabled: remove.isPending,
                onClick: () => {
                  if (window.confirm(tAds("confirmDelete", { title: ad.title }))) {
                    void act(
                      () => remove.mutateAsync({ id: ad.id }),
                      tAds("toast.deleted"),
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
            <AlertDialogTitle>
              {t("advertising.rejectTitle", { title: rejecting?.title ?? "" })}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            maxLength={500}
            placeholder={t("advertising.reasonPlaceholder")}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
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
                  t("advertising.rejected"),
                );
                if (ok) setRejecting(null);
              }}
            >
              {t("common.reject")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

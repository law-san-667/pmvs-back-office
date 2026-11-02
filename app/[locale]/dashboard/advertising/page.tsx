"use client";

import {
  AdFormDialog,
  type AdFormValues,
} from "@/components/advertising/ad-form-dialog";
import { AdStatsDialog } from "@/components/advertising/ad-stats-dialog";
import { AdsTable } from "@/components/advertising/ads-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBusiness } from "@/contexts/business-context";
import type { Advertisement } from "@/lib/advertising";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/** The shop's ads: request one, follow its review and its results. */
export default function AdvertisingPage() {
  const t = useTranslations("ads");
  const { businessId } = useBusiness();
  const utils = trpc.useUtils();
  const ads = trpc.advertising.business.useQuery(
    { businessId: businessId ?? "" },
    { enabled: Boolean(businessId) },
  );
  const submit = trpc.advertising.submit.useMutation();
  const update = trpc.advertising.update.useMutation();
  const remove = trpc.advertising.delete.useMutation();
  const [editing, setEditing] = useState<Advertisement | "new" | null>(null);
  const [statsOf, setStatsOf] = useState<Advertisement | null>(null);
  const refresh = () => utils.advertising.business.invalidate();

  const save = async (values: AdFormValues) => {
    if (!businessId) return;
    try {
      if (editing && editing !== "new") {
        await update.mutateAsync({ id: editing.id, ...values });
        toast.success(t("toast.updated"));
      } else {
        await submit.mutateAsync({ businessId, ...values });
        toast.success(t("toast.submitted"));
      }
      setEditing(null);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.saveFailed"),
      );
    }
  };

  const act = async (run: () => Promise<unknown>, done: string) => {
    try {
      await run();
      toast.success(done);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.actionFailed"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("mine", { count: ads.data?.length ?? 0 })}</CardTitle>
          <CardAction>
            <Button size="sm" onClick={() => setEditing("new")}>
              {t("request")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <AdsTable
            ads={ads.data}
            isLoading={ads.isLoading}
            error={ads.error?.message}
            actions={(ad) => [
              { label: t("actions.stats"), onClick: () => setStatsOf(ad) },
              { label: t("actions.edit"), onClick: () => setEditing(ad) },
              ad.status === "APPROVED" &&
                ad.state !== "ENDED" && {
                  label: ad.isActive ? t("actions.pause") : t("actions.resume"),
                  disabled: update.isPending,
                  onClick: () =>
                    void act(
                      () =>
                        update.mutateAsync({
                          id: ad.id,
                          isActive: !ad.isActive,
                        }),
                      ad.isActive ? t("toast.paused") : t("toast.resumed"),
                    ),
                },
              {
                label: t("actions.delete"),
                destructive: true,
                disabled: remove.isPending,
                onClick: () => {
                  if (window.confirm(t("confirmDelete", { title: ad.title }))) {
                    void act(
                      () => remove.mutateAsync({ id: ad.id }),
                      t("toast.deleted"),
                    );
                  }
                },
              },
            ]}
          />
        </CardContent>
      </Card>
      <AdFormDialog
        open={editing !== null}
        ad={editing === "new" ? null : editing}
        saving={submit.isPending || update.isPending}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
      <AdStatsDialog ad={statsOf} onClose={() => setStatsOf(null)} />
    </div>
  );
}

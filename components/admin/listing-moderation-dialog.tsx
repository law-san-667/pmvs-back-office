"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminListing } from "@/lib/admin-types";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

/** Reasons offered as one-click shortcuts when refusing a listing. */
const REJECTION_PRESETS = [
  "photos",
  "description",
  "prohibited",
  "price",
  "category",
] as const;

export function ListingModerationDialog({
  listing,
  decision,
  onClose,
  onModerated,
}: {
  listing: AdminListing;
  decision: "APPROVED" | "REJECTED";
  onClose: () => void;
  onModerated: () => Promise<void>;
}) {
  const t = useTranslations("adminCommerce");
  const [reason, setReason] = useState(listing.moderationReason ?? "");
  const moderate = trpc.admin.moderateListing.useMutation();
  const isRejection = decision === "REJECTED";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await moderate.mutateAsync({
        id: listing.id,
        status: decision,
        reason: isRejection ? reason.trim() : null,
      });
      await onModerated();
      onClose();
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isRejection
                ? t("moderationDialog.rejectTitle")
                : t("moderationDialog.approveTitle")}
            </DialogTitle>
            <DialogDescription>
              {isRejection
                ? t("moderationDialog.rejectDescription", {
                    title: listing.title,
                  })
                : t("moderationDialog.approveDescription", {
                    title: listing.title,
                  })}
            </DialogDescription>
          </DialogHeader>

          {isRejection && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="moderation-reason">
                {t("moderationDialog.reason")}
              </Label>
              <div className="flex flex-wrap gap-2">
                {REJECTION_PRESETS.map((preset) => {
                  const text = t(`moderationDialog.presets.${preset}`);
                  return (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReason(text)}
                    >
                      {text}
                    </Button>
                  );
                })}
              </div>
              <Textarea
                id="moderation-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                required
                placeholder={t("moderationDialog.reasonPlaceholder")}
              />
            </div>
          )}

          {moderate.error && (
            <p className="text-destructive text-sm">{moderate.error.message}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={moderate.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant={isRejection ? "destructive" : "default"}
              disabled={
                moderate.isPending || (isRejection && !reason.trim().length)
              }
            >
              {moderate.isPending
                ? t("moderationDialog.sending")
                : isRejection
                  ? t("common.reject")
                  : t("common.approve")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

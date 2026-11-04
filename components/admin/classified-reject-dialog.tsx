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
import type { Classified } from "@/server/trpc/_procedures/classifieds";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

/** Reasons offered as one-click shortcuts when refusing a classified. */
const REJECTION_PRESETS = [
  "description",
  "prohibited",
  "contact",
  "category",
  "duplicate",
] as const;

export function ClassifiedRejectDialog({
  classified,
  isPending,
  onClose,
  onConfirm,
}: {
  classified: Classified;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const t = useTranslations("adminClassifieds");
  const [reason, setReason] = useState(classified.moderationReason ?? "");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim()) onConfirm(reason.trim());
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("rejectDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("rejectDialog.description", { title: classified.title })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="classified-reason">
              {t("rejectDialog.reason")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {REJECTION_PRESETS.map((preset) => {
                const text = t(`rejectDialog.presets.${preset}`);
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
              id="classified-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={1000}
              required
              placeholder={t("rejectDialog.placeholder")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !reason.trim()}
            >
              {isPending ? t("sending") : t("reject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { useState, type FormEvent } from "react";

/** Reasons offered as one-click shortcuts when refusing a listing. */
const REJECTION_PRESETS = [
  "Photos de mauvaise qualité ou non conformes",
  "Description insuffisante ou trompeuse",
  "Produit interdit à la vente sur la plateforme",
  "Prix manifestement erroné",
  "Catégorie inadaptée",
];

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
              {isRejection ? "Refuser l'annonce" : "Valider l'annonce"}
            </DialogTitle>
            <DialogDescription>
              {isRejection
                ? `« ${listing.title} » restera invisible pour les acheteurs. Le vendeur recevra le motif ci-dessous.`
                : `« ${listing.title} » sera immédiatement visible sur la marketplace.`}
            </DialogDescription>
          </DialogHeader>

          {isRejection && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="moderation-reason">Motif du refus</Label>
              <div className="flex flex-wrap gap-2">
                {REJECTION_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReason(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <Textarea
                id="moderation-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                required
                placeholder="Expliquez au vendeur ce qui doit être corrigé."
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
              Annuler
            </Button>
            <Button
              type="submit"
              variant={isRejection ? "destructive" : "default"}
              disabled={
                moderate.isPending || (isRejection && !reason.trim().length)
              }
            >
              {moderate.isPending
                ? "Envoi..."
                : isRejection
                  ? "Refuser"
                  : "Valider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

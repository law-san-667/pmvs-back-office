"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdminBusiness } from "@/lib/admin-types";
import { trpc } from "@/server/trpc/client";

export function BusinessDeleteDialog({
  business,
  onClose,
  onDeleted,
}: {
  business: AdminBusiness;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const remove = trpc.admin.deleteBusiness.useMutation();

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync({ id: business.id });
      await onDeleted();
      onClose();
    } catch {
      // The mutation error is rendered in the confirmation dialog.
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            « {business.name} » sera supprimée définitivement, ainsi que ses
            annonces et données associées. Cette opération est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.error && (
          <p className="text-destructive text-sm">{remove.error.message}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault();
              void confirmDelete();
            }}
          >
            {remove.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

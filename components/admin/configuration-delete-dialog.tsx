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
import { trpc } from "@/server/trpc/client";

export type ConfigurationDeleteTarget =
  | { kind: "category"; id: string; label: string }
  | { kind: "subCategory"; id: string; label: string }
  | { kind: "country"; code: string; label: string }
  | { kind: "city"; slug: string; label: string };

export function ConfigurationDeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: ConfigurationDeleteTarget;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const deleteCategory = trpc.admin.deleteCategory.useMutation();
  const deleteSubCategory = trpc.admin.deleteSubCategory.useMutation();
  const deleteCountry = trpc.admin.deleteCountry.useMutation();
  const deleteCity = trpc.admin.deleteCity.useMutation();
  const mutations = [
    deleteCategory,
    deleteSubCategory,
    deleteCountry,
    deleteCity,
  ];
  const isPending = mutations.some((mutation) => mutation.isPending);
  const error = mutations.find((mutation) => mutation.error)?.error;

  const confirmDelete = async () => {
    try {
      if (target.kind === "category") {
        await deleteCategory.mutateAsync({ id: target.id });
      } else if (target.kind === "subCategory") {
        await deleteSubCategory.mutateAsync({ id: target.id });
      } else if (target.kind === "country") {
        await deleteCountry.mutateAsync({ code: target.code });
      } else {
        await deleteCity.mutateAsync({ slug: target.slug });
      }

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
            « {target.label} » sera supprimé définitivement. Cette opération
            peut échouer si cet élément est encore utilisé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-destructive text-sm">{error.message}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void confirmDelete();
            }}
          >
            {isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

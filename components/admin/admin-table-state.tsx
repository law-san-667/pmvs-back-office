import { Spinner } from "@/components/ui/spinner";
import { TableCell, TableRow } from "@/components/ui/table";
import { InboxIcon } from "lucide-react";

export function AdminTableState({
  colSpan,
  isLoading,
  error,
  isEmpty,
  loadingLabel = "Chargement...",
  emptyLabel = "Aucune donnée disponible.",
}: {
  colSpan: number;
  isLoading: boolean;
  error?: string | null;
  isEmpty: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
}) {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-32 text-center">
          <div className="text-muted-foreground flex items-center justify-center gap-2">
            <Spinner /> {loadingLabel}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (error) {
    return (
      <TableRow>
        <TableCell
          colSpan={colSpan}
          className="text-destructive h-32 text-center"
        >
          {error}
        </TableCell>
      </TableRow>
    );
  }

  if (isEmpty) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-36 text-center">
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <InboxIcon className="size-8" />
            <p>{emptyLabel}</p>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return null;
}

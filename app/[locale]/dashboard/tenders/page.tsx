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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBusiness } from "@/contexts/business-context";
import { Link, useRouter } from "@/i18n/navigation";
import type { Tender, TenderStatus, TenderType } from "@/lib/backend-resource-types";
import { trpc } from "@/server/trpc/client";
import {
  FileSignatureIcon,
  GavelIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<TenderType, string> = {
  SUPPLY: "Fourniture",
  SERVICE: "Service",
  WORKS: "Travaux",
  INTELLECTUAL_SERVICE: "Prestation intellectuelle",
};

const STATUS_LABELS: Record<TenderStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert",
  EVALUATION: "En évaluation",
  AWARDED: "Attribué",
  CLOSED: "Clôturé",
  CANCELLED: "Annulé",
};

const STATUS_CLASSES: Record<TenderStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  OPEN: "bg-green-500/15 text-green-600",
  EVALUATION: "bg-amber-500/15 text-amber-600",
  AWARDED: "bg-blue-500/15 text-blue-600",
  CLOSED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/15 text-destructive",
};

const formatBudget = (tender: Tender) => {
  const { budgetMinMinor, budgetMaxMinor, currency } = tender;
  if (budgetMinMinor == null && budgetMaxMinor == null) return "—";

  const format = (value: number) => {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${value.toLocaleString("fr-FR")} ${currency}`;
    }
  };

  if (budgetMinMinor != null && budgetMaxMinor != null) {
    return `${format(budgetMinMinor)} – ${format(budgetMaxMinor)}`;
  }
  return format((budgetMinMinor ?? budgetMaxMinor) as number);
};

const formatDeadline = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
};

type DeleteTarget = { id: string; title: string };

export default function TendersPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { businessId, isLoading: isBusinessLoading } = useBusiness();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const updateSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const tenderQueryInput = useMemo(
    () => ({
      page: currentPage,
      limit: PAGE_SIZE,
      orderBy: "createdAt" as const,
      order: "desc" as const,
      title: search.trim() || undefined,
      publisherBusinessId: businessId ?? undefined,
    }),
    [businessId, currentPage, search],
  );

  const tenders = trpc.tenders.list.useQuery(tenderQueryInput, {
    enabled: !!businessId,
  });

  const tenderData = tenders.data;
  const tenderItems = tenderData?.items ?? [];
  const totalTenders = tenderData?.total ?? 0;
  const totalPages = Math.max(tenderData?.totalPages ?? 1, 1);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const hasTrailingPages =
    visiblePages.length > 0 &&
    visiblePages[visiblePages.length - 1] < totalPages;

  const deleteTender = trpc.tenders.delete.useMutation();

  const isLoading = isBusinessLoading || (!!businessId && tenders.isLoading);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteTender.mutateAsync({ id: deleteTarget.id });
    setDeleteTarget(null);
    await utils.tenders.list.invalidate();
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Link href="/dashboard/tenders/new">
            <Button
              variant="outline"
              className="h-14 w-full border-dashed text-base"
            >
              <PlusIcon className="size-5" />
              Créer un appel d&apos;offres
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Mes appels d&apos;offres ({totalTenders})</CardTitle>
              <CardAction>
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Recherche..."
                    value={search}
                    onChange={(event) => updateSearch(event.target.value)}
                    className="h-8 w-48 pl-8"
                  />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-normal">
                      Appel d&apos;offres
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Type
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Budget
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Date limite
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Statut
                    </TableHead>
                    <TableHead className="text-muted-foreground font-normal">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                          <Spinner />
                          Chargement des appels d&apos;offres...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : tenders.isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-sm">
                          <GavelIcon className="text-muted-foreground size-8" />
                          <p className="font-medium">
                            Impossible de charger les appels d&apos;offres.
                          </p>
                          <p className="text-muted-foreground">
                            {tenders.error.message}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : tenderItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-sm">
                          <GavelIcon className="text-muted-foreground size-9" />
                          <p className="font-medium">
                            Aucun appel d&apos;offres trouvé.
                          </p>
                          <p className="text-muted-foreground">
                            Créez votre premier appel d&apos;offres pour
                            recevoir des soumissions.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tenderItems.map((tender) => (
                      <TableRow
                        key={tender.id}
                        className="h-20 hover:bg-transparent"
                      >
                        <TableCell className="py-4">
                          <div className="min-w-0">
                            <p className="truncate font-bold">{tender.title}</p>
                            {tender.location && (
                              <p className="text-muted-foreground text-sm">
                                {tender.location}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-sm">
                            {TYPE_LABELS[tender.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatBudget(tender)}
                        </TableCell>
                        <TableCell>
                          {formatDeadline(tender.submissionDeadline)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[tender.status]}`}
                          >
                            {STATUS_LABELS[tender.status]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-foreground"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/tenders/${tender.id}/edit`,
                                      )
                                    }
                                  />
                                }
                              >
                                <PencilIcon className="size-4" />
                                <span className="sr-only">Modifier</span>
                              </TooltipTrigger>
                              <TooltipContent>Modifier</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-foreground hover:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        id: tender.id,
                                        title: tender.title,
                                      })
                                    }
                                  />
                                }
                              >
                                <Trash2Icon className="size-4" />
                                <span className="sr-only">Supprimer</span>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text=""
                      href="#"
                      aria-disabled={currentPage <= 1}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((page) => Math.max(page - 1, 1));
                      }}
                    />
                  </PaginationItem>
                  {visiblePages.map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {hasTrailingPages && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === totalPages}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      text=""
                      href="#"
                      aria-disabled={currentPage >= totalPages}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((page) =>
                          Math.min(page + 1, totalPages),
                        );
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="font-bold">Mes soumissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border/70 flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
              <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
                <FileSignatureIcon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Aucune soumission</p>
                <p className="text-muted-foreground text-sm">
                  Les soumissions que vous déposez sur les appels d&apos;offres
                  apparaîtront ici.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {`Voulez-vous vraiment supprimer « ${deleteTarget?.title} » ? Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTender.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTender.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {deleteTender.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

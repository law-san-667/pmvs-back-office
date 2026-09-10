"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import {
  BUSINESS_STATUS_BADGE_CLASSES,
  BUSINESS_STATUS_LABELS,
} from "@/lib/admin-business-utils";
import type { BusinessStatus } from "@/lib/backend-resource-types";
import { scoreBarClass, scoreClass } from "@/lib/quality-utils";
import { formatDate, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { AlertTriangleIcon, EyeIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 20;
type CertifiedFilter = "ALL" | "CERTIFIED" | "NOT_CERTIFIED";

export default function AdminQualityPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [certified, setCertified] = useState<CertifiedFilter>("ALL");
  const ranking = trpc.admin.qualityRanking.useQuery({
    page,
    limit: PAGE_SIZE,
    order: "desc",
    certified:
      certified === "ALL" ? undefined : certified === "CERTIFIED",
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Qualité des fournisseurs"
        description="Classement des fournisseurs selon les normes de qualité de la plateforme. Ouvrez une entreprise pour voir le détail, l'évaluer et la certifier."
      />

      <Card>
        <CardHeader>
          <CardTitle>Classement ({ranking.data?.total ?? 0})</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <select
                value={certified}
                onChange={(event) => {
                  setCertified(event.target.value as CertifiedFilter);
                  setPage(1);
                }}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                aria-label="Filtrer par certification"
              >
                <option value="ALL">Tous les fournisseurs</option>
                <option value="CERTIFIED">Certifiés</option>
                <option value="NOT_CERTIFIED">Non certifiés</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/admin/configuration")}
              >
                Régler les normes
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Normes</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[1%] text-right">Détail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={7}
                isLoading={ranking.isLoading}
                error={ranking.error?.message}
                isEmpty={!ranking.data?.items.length}
                loadingLabel="Calcul des scores..."
                emptyLabel="Aucun fournisseur à classer."
              />
              {ranking.data?.items.map((row) => (
                <TableRow key={row.businessId}>
                  <TableCell className="font-mono text-xs">{row.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={row.businessImage ?? undefined}
                          alt={row.businessName}
                        />
                        <AvatarFallback>
                          {getInitials(row.businessName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{row.businessName}</p>
                        {row.pendingReports > 0 && (
                          <p className="flex items-center gap-1 text-xs text-amber-700">
                            <AlertTriangleIcon className="size-3" />
                            {row.pendingReports} signalement(s)
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`w-12 font-semibold ${scoreClass(row.score)}`}>
                        {row.score} %
                      </span>
                      <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full ${scoreBarClass(row.score)}`}
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {row.metCount} / {row.judgedCount} évaluables
                    {row.judgedCount < row.totalCount
                      ? ` (${row.totalCount - row.judgedCount} sans données)`
                      : ""}
                  </TableCell>
                  <TableCell>
                    {row.isCertified ? (
                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700"
                      >
                        <ShieldCheckIcon className="size-3" /> Certifié
                        {row.certifiedAt ? ` · ${formatDate(row.certifiedAt)}` : ""}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-slate-600"
                      >
                        Non certifié
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        BUSINESS_STATUS_BADGE_CLASSES[row.businessStatus as BusinessStatus]
                      }
                    >
                      {BUSINESS_STATUS_LABELS[row.businessStatus as BusinessStatus] ??
                        row.businessStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/admin/businesses/${row.businessId}`)
                      }
                    >
                      <EyeIcon /> Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalPages={ranking.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

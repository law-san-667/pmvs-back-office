"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type {
  BusinessQuality,
  QualityCheckKey,
  QualityKpi,
} from "@/lib/admin-types";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
  QUALITY_CHECK_LABELS,
  QUALITY_KPI_LABELS,
  describeKpiDetails,
  formatKpiThreshold,
  formatKpiValue,
  scoreBarClass,
  scoreClass,
} from "@/lib/quality-utils";
import { formatDate } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

const CHECK_KEYS: QualityCheckKey[] = [
  "prohibitedProductsEnforced",
  "admissibleCategoriesDefined",
  "productQualityVerified",
];

function KpiVerdict({ met }: { met: boolean | null }) {
  if (met === null) {
    return (
      <Badge
        variant="outline"
        className="border-slate-200 bg-slate-50 text-slate-600"
      >
        <HelpCircleIcon className="size-3" /> Pas de données
      </Badge>
    );
  }
  return met ? (
    <Badge
      variant="outline"
      className="border-green-200 bg-green-50 text-green-700"
    >
      <CheckCircle2Icon className="size-3" /> Conforme
    </Badge>
  ) : (
    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
      <XCircleIcon className="size-3" /> Non conforme
    </Badge>
  );
}

function KpiRow({ kpi }: { kpi: QualityKpi }) {
  const label = QUALITY_KPI_LABELS[kpi.key];
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{label.title}</p>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            <span className="font-semibold">{formatKpiValue(kpi)}</span>
            <span className="text-muted-foreground">
              {" "}
              · norme {formatKpiThreshold(kpi)}
            </span>
          </span>
          <KpiVerdict met={kpi.met} />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">{label.description}</p>
      <p className="text-muted-foreground text-xs">{describeKpiDetails(kpi)}</p>
    </div>
  );
}

/**
 * The supplier's quality file: measured KPIs against the platform norms, the
 * three checks only an admin can judge, the resulting score, and the
 * certification decision. Lives on the admin business page.
 */
export function BusinessQualityCard({ businessId }: { businessId: string }) {
  const quality = trpc.admin.businessQuality.useQuery({ businessId });

  // The form starts from the saved evaluation; remounting it on every
  // (re)load is simpler than syncing state into it after the fact.
  return quality.data ? (
    <QualityCardContent
      key={`${businessId}:${quality.data.evaluation.evaluatedAt ?? "new"}`}
      businessId={businessId}
      data={quality.data}
    />
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="text-primary size-5" />
          Qualité & certification
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quality.isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner /> Calcul des indicateurs...
          </div>
        )}
        {quality.error && (
          <p className="text-destructive text-sm">{quality.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

function QualityCardContent({
  businessId,
  data,
}: {
  businessId: string;
  data: BusinessQuality;
}) {
  const utils = trpc.useUtils();
  const saveEvaluation = trpc.admin.updateBusinessEvaluation.useMutation();
  const setCertification = trpc.admin.updateBusinessCertification.useMutation();

  const [checks, setChecks] = useState<Record<QualityCheckKey, boolean>>({
    prohibitedProductsEnforced: data.evaluation.prohibitedProductsEnforced,
    admissibleCategoriesDefined: data.evaluation.admissibleCategoriesDefined,
    productQualityVerified: data.evaluation.productQualityVerified,
  });
  const [notes, setNotes] = useState(data.evaluation.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([
      utils.admin.businessQuality.invalidate({ businessId }),
      utils.admin.qualityRanking.invalidate(),
    ]);

  const submitEvaluation = async () => {
    setError(null);
    try {
      await saveEvaluation.mutateAsync({ businessId, ...checks, notes });
      await refresh();
      setSavedAt(new Date().toISOString());
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(
          mutationError,
          "Impossible d'enregistrer l'évaluation.",
        ),
      );
    }
  };

  const toggleCertification = async () => {
    setError(null);
    try {
      await setCertification.mutateAsync({
        businessId,
        isCertified: !data.evaluation.isCertified,
      });
      await refresh();
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(
          mutationError,
          "Impossible de modifier la certification.",
        ),
      );
    }
  };

  const isPending = saveEvaluation.isPending || setCertification.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="text-primary size-5" />
          Qualité & certification
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className={
              data.evaluation.isCertified
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            {data.evaluation.isCertified
              ? "Fournisseur certifié"
              : "Non certifié"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Score */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs">
                Score de conformité · {data.metCount} norme(s) respectée(s) sur{" "}
                {data.judgedCount} évaluable(s) ({data.totalCount} au total)
              </p>
              <p className={`text-3xl font-bold ${scoreClass(data.score)}`}>
                {data.score} %
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              Fenêtre : {data.windowDays} jours
            </p>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${scoreBarClass(data.score)}`}
              style={{ width: `${data.score}%` }}
            />
          </div>
          {data.pendingReports > 0 && (
            <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              <AlertTriangleIcon className="size-4 shrink-0" />
              {data.pendingReports} signalement(s) en attente concernant cette
              entreprise ou ses annonces.
            </p>
          )}
        </div>

        {/* Measured KPIs */}
        <div>
          <p className="mb-1 text-sm font-semibold">Indicateurs mesurés</p>
          {data.kpis.map((kpi) => (
            <KpiRow key={kpi.key} kpi={kpi} />
          ))}
        </div>

        {/* Manual checks */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">Contrôles de l&apos;équipe</p>
          {CHECK_KEYS.map((key) => (
            <label key={key} className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={checks[key]}
                onCheckedChange={(checked) =>
                  setChecks((current) => ({
                    ...current,
                    [key]: checked === true,
                  }))
                }
                disabled={isPending}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium">
                  {QUALITY_CHECK_LABELS[key].title}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {QUALITY_CHECK_LABELS[key].description}
                </span>
              </span>
            </label>
          ))}
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes internes sur l'évaluation (facultatif)"
            rows={3}
            disabled={isPending}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              onClick={() => void submitEvaluation()}
              disabled={isPending}
            >
              {saveEvaluation.isPending
                ? "Enregistrement..."
                : "Enregistrer l'évaluation"}
            </Button>
            {(savedAt || data.evaluation.evaluatedAt) && (
              <span className="text-muted-foreground text-xs">
                Dernière évaluation :{" "}
                {formatDate(savedAt ?? data.evaluation.evaluatedAt!, true)}
              </span>
            )}
          </div>
        </div>

        {/* Certification */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-semibold">Certification</p>
            <p className="text-muted-foreground text-xs">
              {data.evaluation.isCertified && data.evaluation.certifiedAt
                ? `Certifié le ${formatDate(data.evaluation.certifiedAt, true)}.`
                : "Le score guide la décision, il ne la remplace pas."}
            </p>
          </div>
          <Button
            size="sm"
            variant={data.evaluation.isCertified ? "outline" : "default"}
            onClick={() => void toggleCertification()}
            disabled={isPending}
          >
            {data.evaluation.isCertified ? (
              <>
                <ShieldOffIcon /> Retirer la certification
              </>
            ) : (
              <>
                <ShieldCheckIcon /> Certifier ce fournisseur
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

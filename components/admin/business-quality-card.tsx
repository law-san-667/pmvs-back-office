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
import { scoreBarClass, scoreClass } from "@/lib/quality-utils";
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
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const CHECK_KEYS: QualityCheckKey[] = [
  "prohibitedProductsEnforced",
  "admissibleCategoriesDefined",
  "productQualityVerified",
];

type Translate = ReturnType<typeof useTranslations<"adminAccounts">>;

const formatKpiValue = (t: Translate, kpi: QualityKpi) => {
  if (kpi.value === null) return "—";
  if (kpi.unit === "percent")
    return t("qualityCard.units.percent", { value: kpi.value });
  if (kpi.unit === "days") return t("qualityCard.units.days", { value: kpi.value });
  return String(kpi.value);
};

const formatKpiThreshold = (t: Translate, kpi: QualityKpi) => {
  const sign = kpi.direction === "max" ? "≤" : "≥";
  if (kpi.key === "minimumStock") return t("qualityCard.minimumStockThreshold");
  if (kpi.unit === "percent")
    return `${sign} ${t("qualityCard.units.percent", { value: kpi.threshold })}`;
  if (kpi.unit === "days")
    return `${sign} ${t("qualityCard.units.days", { value: kpi.threshold })}`;
  return `${sign} ${kpi.threshold}`;
};

/** Short, human sentence for the figures behind a KPI. */
const describeKpiDetails = (t: Translate, kpi: QualityKpi) => {
  const d = kpi.details;
  switch (kpi.key) {
    case "negativeFeedback":
      return t("qualityCard.details.negativeFeedback", {
        negative: d.negativeReviews ?? 0,
        total: d.reviews ?? 0,
      });
    case "responseRate":
      return t("qualityCard.details.responseRate", {
        answered: d.answered ?? 0,
        total: d.conversations ?? 0,
      });
    case "returnRate":
      return t("qualityCard.details.returnRate", {
        refunded: d.refunded ?? 0,
        delivered: d.delivered ?? 0,
      });
    case "cancellationRate":
      return t("qualityCard.details.cancellationRate", {
        cancelled: d.cancelledBySupplier ?? 0,
        orders: d.ordersReceived ?? 0,
        stockOutRate:
          d.stockOutRate === null || d.stockOutRate === undefined
            ? "—"
            : t("qualityCard.units.percent", { value: d.stockOutRate }),
        listings: d.soldOutListings ?? 0,
      });
    case "shippingDelay":
      return t("qualityCard.details.shippingDelay", {
        onTime: d.onTime ?? 0,
        shipped: d.shippedOrders ?? 0,
        average:
          d.averageHours === null || d.averageHours === undefined
            ? "—"
            : t("qualityCard.units.hours", { value: d.averageHours }),
        maxDays: String(d.maxDays),
      });
    case "minimumStock":
      return t("qualityCard.details.minimumStock", {
        under: d.underMinimum ?? 0,
        minimum: d.minimum ?? 0,
        published: d.publishedProducts ?? 0,
      });
  }
};

function KpiVerdict({ met }: { met: boolean | null }) {
  const t = useTranslations("adminAccounts");
  if (met === null) {
    return (
      <Badge
        variant="outline"
        className="border-slate-200 bg-slate-50 text-slate-600"
      >
        <HelpCircleIcon className="size-3" /> {t("qualityCard.noData")}
      </Badge>
    );
  }
  return met ? (
    <Badge
      variant="outline"
      className="border-green-200 bg-green-50 text-green-700"
    >
      <CheckCircle2Icon className="size-3" /> {t("qualityCard.met")}
    </Badge>
  ) : (
    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
      <XCircleIcon className="size-3" /> {t("qualityCard.notMet")}
    </Badge>
  );
}

function KpiRow({ kpi }: { kpi: QualityKpi }) {
  const t = useTranslations("adminAccounts");
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{t(`qualityCard.kpi.${kpi.key}.title`)}</p>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            <span className="font-semibold">{formatKpiValue(t, kpi)}</span>
            <span className="text-muted-foreground">
              {" "}
              {t("qualityCard.norm", {
                threshold: formatKpiThreshold(t, kpi),
              })}
            </span>
          </span>
          <KpiVerdict met={kpi.met} />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        {t(`qualityCard.kpi.${kpi.key}.description`)}
      </p>
      <p className="text-muted-foreground text-xs">
        {describeKpiDetails(t, kpi)}
      </p>
    </div>
  );
}

/**
 * The supplier's quality file: measured KPIs against the platform norms, the
 * three checks only an admin can judge, the resulting score, and the
 * certification decision. Lives on the admin business page.
 */
export function BusinessQualityCard({ businessId }: { businessId: string }) {
  const t = useTranslations("adminAccounts");
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
          {t("qualityCard.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quality.isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner /> {t("qualityCard.loading")}
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
  const t = useTranslations("adminAccounts");
  const locale = useLocale();
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
          t("qualityCard.saveError"),
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
          t("qualityCard.certificationError"),
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
          {t("qualityCard.title")}
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
              ? t("qualityCard.certified")
              : t("qualityCard.notCertified")}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Score */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-xs">
                {t("qualityCard.score", {
                  met: data.metCount,
                  judged: data.judgedCount,
                  total: data.totalCount,
                })}
              </p>
              <p className={`text-3xl font-bold ${scoreClass(data.score)}`}>
                {data.score} %
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              {t("qualityCard.window", { days: data.windowDays })}
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
              {t("qualityCard.pendingReports", { count: data.pendingReports })}
            </p>
          )}
        </div>

        {/* Measured KPIs */}
        <div>
          <p className="mb-1 text-sm font-semibold">
            {t("qualityCard.measured")}
          </p>
          {data.kpis.map((kpi) => (
            <KpiRow key={kpi.key} kpi={kpi} />
          ))}
        </div>

        {/* Manual checks */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">
            {t("qualityCard.teamChecks")}
          </p>
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
                  {t(`qualityCard.check.${key}.title`)}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {t(`qualityCard.check.${key}.description`)}
                </span>
              </span>
            </label>
          ))}
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("qualityCard.notesPlaceholder")}
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
                ? t("actions.saving")
                : t("qualityCard.saveEvaluation")}
            </Button>
            {(savedAt || data.evaluation.evaluatedAt) && (
              <span className="text-muted-foreground text-xs">
                {t("qualityCard.lastEvaluation", {
                  date: formatDate(
                    savedAt ?? data.evaluation.evaluatedAt!,
                    true,
                    locale,
                  ),
                })}
              </span>
            )}
          </div>
        </div>

        {/* Certification */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-semibold">
              {t("qualityCard.certification")}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.evaluation.isCertified && data.evaluation.certifiedAt
                ? t("qualityCard.certifiedOn", {
                    date: formatDate(data.evaluation.certifiedAt, true, locale),
                  })
                : t("qualityCard.scoreHint")}
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
                <ShieldOffIcon /> {t("qualityCard.revoke")}
              </>
            ) : (
              <>
                <ShieldCheckIcon /> {t("qualityCard.certify")}
              </>
            )}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

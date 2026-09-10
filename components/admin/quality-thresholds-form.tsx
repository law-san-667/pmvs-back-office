"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import { QUALITY_THRESHOLD_FIELDS } from "@/lib/quality-utils";
import { formatDate } from "@/lib/seller-dashboard-utils";
import {
  qualityThresholdsInputSchema,
  type QualityThresholdsInput,
} from "@/lib/validators/quality";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

/**
 * The norms every supplier is measured against. Changing them re-scores
 * everyone on the next computation; certifications already granted stay.
 */
export function QualityThresholdsForm() {
  const utils = trpc.useUtils();
  const thresholds = trpc.admin.qualityThresholds.useQuery();
  const update = trpc.admin.updateQualityThresholds.useMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<QualityThresholdsInput>({
    resolver: zodResolver(qualityThresholdsInputSchema) as Resolver<QualityThresholdsInput>,
    defaultValues: thresholds.data?.thresholds,
  });

  useEffect(() => {
    if (thresholds.data) form.reset(thresholds.data.thresholds);
  }, [thresholds.data, form]);

  const onSubmit = async (values: QualityThresholdsInput) => {
    setMessage(null);
    setError(null);
    try {
      await update.mutateAsync(values);
      await Promise.all([
        utils.admin.qualityThresholds.invalidate(),
        utils.admin.qualityRanking.invalidate(),
        utils.admin.businessQuality.invalidate(),
      ]);
      setMessage("Normes enregistrées. Les scores sont recalculés à la prochaine consultation.");
    } catch (mutationError) {
      setError(getMutationErrorMessage(mutationError, "Impossible d'enregistrer les normes."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normes de qualité des fournisseurs</CardTitle>
        <p className="text-muted-foreground text-sm">
          Seuils appliqués à chaque fournisseur pour calculer son score de
          conformité.
          {thresholds.data?.updatedAt
            ? ` Dernière modification le ${formatDate(thresholds.data.updatedAt, true)}.`
            : " Valeurs par défaut de la plateforme."}
        </p>
      </CardHeader>
      <CardContent>
        {thresholds.isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner /> Chargement...
          </div>
        )}
        {thresholds.error && (
          <p className="text-destructive text-sm">{thresholds.error.message}</p>
        )}
        {thresholds.data && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {QUALITY_THRESHOLD_FIELDS.map((field) => (
                <Controller
                  key={field.key}
                  name={field.key}
                  control={form.control}
                  render={({ field: input, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`threshold-${field.key}`}>
                        {field.label}
                      </FieldLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`threshold-${field.key}`}
                          type="number"
                          inputMode="decimal"
                          step={field.unit === "%" ? "0.1" : "1"}
                          min={0}
                          value={input.value ?? ""}
                          onChange={(event) => input.onChange(event.target.value)}
                          onBlur={input.onBlur}
                          aria-invalid={fieldState.invalid}
                          disabled={update.isPending}
                          className="h-9"
                        />
                        <span className="text-muted-foreground w-12 shrink-0 text-xs">
                          {field.unit}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">{field.hint}</p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Enregistrement..." : "Enregistrer les normes"}
              </Button>
              {message && <span className="text-sm text-green-700">{message}</span>}
              {error && <span className="text-destructive text-sm">{error}</span>}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

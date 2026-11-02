"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CRITERION_LABELS, type VendabilitySettings } from "@/lib/vendability";
import { trpc } from "@/server/trpc/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CRITERIA = Object.keys(CRITERION_LABELS) as (keyof typeof CRITERION_LABELS)[];

function NumberField({
  id,
  label,
  value,
  onChange,
  step,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/** The vendability grid: every weight, target and threshold can be changed. */
export function GridEditor() {
  const utils = trpc.useUtils();
  const settings = trpc.vendability.settings.useQuery();
  const [grid, setGrid] = useState<VendabilitySettings | null>(null);
  useEffect(() => {
    if (settings.data) setGrid(settings.data);
  }, [settings.data]);
  const save = trpc.vendability.updateSettings.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.vendability.settings.invalidate(), utils.vendability.platformTop.invalidate()]);
      toast.success("Grille enregistrée.");
    },
    onError: (error) => toast.error(error.message),
  });

  if (settings.error) return <p className="text-destructive text-sm">{settings.error.message}</p>;
  if (!grid) return <p className="text-muted-foreground text-sm">Chargement...</p>;
  const totalWeight = CRITERIA.reduce((sum, key) => sum + grid.weights[key], 0);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(grid);
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Poids des critères</CardTitle>
          <CardDescription>
            Le score est la moyenne pondérée des critères évaluables. Un critère sans donnée (pas
            d&apos;avis, trop peu de vues) ne pénalise pas le produit. Un poids de 0 retire le critère.
            Ces valeurs sont provisoires en attendant la grille définitive.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CRITERIA.map((key) => (
              <NumberField
                key={key}
                id={`weight-${key}`}
                label={CRITERION_LABELS[key]}
                value={grid.weights[key]}
                onChange={(value) => setGrid({ ...grid, weights: { ...grid.weights, [key]: value } })}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Total des poids : {totalWeight}. Chaque critère compte pour sa part de ce total.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Objectifs et seuils</CardTitle>
          <CardDescription>
            Un produit qui atteint l&apos;objectif obtient 100 points sur le critère.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NumberField id="t-units" label="Unités commandées (objectif)" value={grid.targets.units} onChange={(units) => setGrid({ ...grid, targets: { ...grid.targets, units } })} />
          <NumberField id="t-views" label="Vues (objectif)" value={grid.targets.views} onChange={(views) => setGrid({ ...grid, targets: { ...grid.targets, views } })} />
          <NumberField id="t-conversion" label="Conversion (objectif, %)" step={0.1} value={grid.targets.conversionRate} onChange={(conversionRate) => setGrid({ ...grid, targets: { ...grid.targets, conversionRate } })} />
          <NumberField id="t-cart" label="Ajout au panier (objectif, %)" step={0.1} value={grid.targets.cartRate} onChange={(cartRate) => setGrid({ ...grid, targets: { ...grid.targets, cartRate } })} />
          <NumberField id="s-window" label="Période prise en compte (jours)" value={grid.windowDays} onChange={(windowDays) => setGrid({ ...grid, windowDays })} />
          <NumberField id="s-views" label="Vues minimum pour juger les taux" value={grid.minViews} onChange={(minViews) => setGrid({ ...grid, minViews })} />
          <NumberField id="s-score" label="Score minimum pour être classé" value={grid.minScore} onChange={(minScore) => setGrid({ ...grid, minScore })} />
        </CardContent>
      </Card>
      <div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Enregistrement..." : "Enregistrer la grille"}
        </Button>
      </div>
    </form>
  );
}

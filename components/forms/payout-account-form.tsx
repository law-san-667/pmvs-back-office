"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import { PAYOUT_ACCOUNT_STATUS_LABELS } from "@/lib/payment-utils";
import { trpc } from "@/server/trpc/client";
import { ShieldCheckIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

const NUMBER_PATTERN = /^\+?[0-9]{8,15}$/;

/**
 * Where LawPay sends the supplier's share of each sale. Only the business
 * owner (or a platform admin) can read or change it; the API returns the
 * number masked.
 */
export function PayoutAccountForm({ businessId }: { businessId: string }) {
  const utils = trpc.useUtils();
  const account = trpc.businesses.payoutAccount.useQuery(
    { businessId },
    { retry: false },
  );
  const services = trpc.businesses.payoutServices.useQuery();
  const upsert = trpc.businesses.upsertPayoutAccount.useMutation();
  const updateStatus = trpc.businesses.updatePayoutAccountStatus.useMutation();

  const [service, setService] = useState("");
  const [destinationNumber, setDestinationNumber] = useState("");
  const [numberError, setNumberError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isNotConfigured =
    account.error?.data?.code === "NOT_FOUND" || account.error?.message === "Not found.";
  const isLoading = account.isLoading || services.isLoading;
  const showForm = isEditing || (!account.data && !isLoading);
  const isPending = upsert.isPending || updateStatus.isPending;

  const refresh = () => utils.businesses.payoutAccount.invalidate({ businessId });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNumberError(null);

    if (!NUMBER_PATTERN.test(destinationNumber.trim())) {
      setNumberError("Numéro mobile money invalide (8 à 15 chiffres).");
      return;
    }

    try {
      await upsert.mutateAsync({
        businessId,
        service: service || services.data?.[0] || "",
        destinationNumber: destinationNumber.trim(),
      });
      await refresh();
      setIsEditing(false);
      setDestinationNumber("");
    } catch {
      // Error rendered below.
    }
  };

  const toggleStatus = async () => {
    if (!account.data) return;
    try {
      await updateStatus.mutateAsync({
        businessId,
        status: account.data.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
      });
      await refresh();
    } catch {
      // Error rendered below.
    }
  };

  const mutationError = upsert.error ?? updateStatus.error;
  const accessDenied =
    account.error && !isNotConfigured && account.error.data?.code === "FORBIDDEN";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold">
          <ShieldCheckIcon className="text-primary size-5" />
          Compte de reversement (LawPay)
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Les paiements en ligne de vos clients vous sont reversés directement
          sur ce compte mobile money, déduits des frais et de la commission.
          Sans compte actif, vos produits ne peuvent pas être payés en ligne.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {accessDenied && (
          <p className="text-muted-foreground text-sm">
            Seul le propriétaire de l&apos;entreprise peut gérer le compte de
            reversement.
          </p>
        )}

        {account.data && !isEditing && (
          <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{account.data.service}</p>
                <p className="text-muted-foreground">
                  {account.data.destinationNumber}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  account.data.status === "ACTIVE"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }
              >
                {PAYOUT_ACCOUNT_STATUS_LABELS[account.data.status]}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setService(account.data?.service ?? "");
                  setIsEditing(true);
                }}
              >
                Changer le numéro
              </Button>
              <Button
                type="button"
                variant={account.data.status === "ACTIVE" ? "destructive" : "default"}
                size="sm"
                disabled={isPending}
                onClick={() => void toggleStatus()}
              >
                {account.data.status === "ACTIVE"
                  ? "Suspendre les reversements"
                  : "Réactiver les reversements"}
              </Button>
            </div>
          </div>
        )}

        {showForm && !accessDenied && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="payout-service">Opérateur</FieldLabel>
                <select
                  id="payout-service"
                  value={service || services.data?.[0] || ""}
                  onChange={(event) => setService(event.target.value)}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  disabled={services.isLoading}
                >
                  {(services.data ?? []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field data-invalid={Boolean(numberError)}>
                <FieldLabel htmlFor="payout-number">
                  Numéro mobile money
                </FieldLabel>
                <Input
                  id="payout-number"
                  inputMode="tel"
                  placeholder="77xxxxxxx"
                  value={destinationNumber}
                  onChange={(event) => setDestinationNumber(event.target.value)}
                  aria-invalid={Boolean(numberError)}
                />
                <p className="text-muted-foreground text-xs">
                  Vérifiez bien ce numéro : c&apos;est lui qui recevra votre
                  argent. Chaque changement est journalisé.
                </p>
                {numberError && <FieldError errors={[{ message: numberError }]} />}
              </Field>
            </FieldGroup>

            <div className="flex gap-2">
              {account.data && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={isPending || services.isLoading}>
                {upsert.isPending
                  ? "Enregistrement..."
                  : account.data
                    ? "Mettre à jour"
                    : "Activer les paiements en ligne"}
              </Button>
            </div>
          </form>
        )}

        {mutationError && (
          <p className="text-destructive text-sm">
            {getBackendErrorMessages(
              mutationError,
              "Impossible d'enregistrer le compte de reversement.",
            ).join(" ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

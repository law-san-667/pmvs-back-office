"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import { msg } from "@/lib/validators/messages";
import { trpc } from "@/server/trpc/client";
import { ShieldCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const NUMBER_PATTERN = /^\+?[0-9]{8,15}$/;

/**
 * The Wave number LawPay sends the supplier's share of each sale to. Only the
 * business owner (or a platform admin) can read or change it; the API returns
 * the number masked. Wave is the only operator LawPay pays out to, so there is
 * no service to pick.
 */
export function PayoutAccountForm({
  businessId,
  countryCode,
}: {
  businessId: string;
  countryCode?: string;
}) {
  const t = useTranslations("settings.payout");
  // PayDunya pays several operators (Orange Money, Free Money…): the
  // supplier picks one. LawPay only knows Wave.
  const services = trpc.businesses.payoutServices.useQuery({ country: countryCode });
  const operators = (services.data ?? []).filter((service) => service !== "Wave Senegal");
  const viaPayDunya = operators.length > 0;
  const [service, setService] = useState("");
  const operatorName = (code: string) =>
    t.has(`operators.${code}` as never) ? t(`operators.${code}` as never) : code;
  const k = (key: "title" | "description" | "notConfigured" | "saved" | "number" | "numberHint" | "activate") =>
    viaPayDunya ? (`online.${key}` as const) : key;
  const utils = trpc.useUtils();
  const account = trpc.businesses.payoutAccount.useQuery(
    { businessId },
    { retry: false },
  );
  const upsert = trpc.businesses.upsertPayoutAccount.useMutation();
  const updateStatus = trpc.businesses.updatePayoutAccountStatus.useMutation();

  const [destinationNumber, setDestinationNumber] = useState("");
  const [numberError, setNumberError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isNotConfigured =
    account.error?.data?.code === "NOT_FOUND";
  const isLoading = account.isLoading;
  const showForm = isEditing || (!account.data && !isLoading);
  const isPending = upsert.isPending || updateStatus.isPending;

  const refresh = () => utils.businesses.payoutAccount.invalidate({ businessId });

  /**
   * Not a <form>: this card is rendered inside the business settings form, and
   * a nested form makes one click submit both — the settings PATCH used to run
   * instead of this mutation, so the payout number was silently dropped.
   */
  const submit = async () => {
    setNumberError(null);
    setSuccessMessage(null);

    if (!NUMBER_PATTERN.test(destinationNumber.trim())) {
      setNumberError(msg("settings.errors.waveNumberInvalid"));
      return;
    }

    try {
      await upsert.mutateAsync({
        businessId,
        destinationNumber: destinationNumber.trim(),
        ...(viaPayDunya ? { service: service || operators[0] } : {}),
      });
      await refresh();
      setIsEditing(false);
      setDestinationNumber("");
      setSuccessMessage(t(k("saved")));
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
          {t(k("title"))}
        </CardTitle>
        <p className="text-muted-foreground text-sm">{t(k("description"))}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {accessDenied && (
          <p className="text-muted-foreground text-sm">
            {t("ownerOnly")}
          </p>
        )}

        {account.data && !isEditing && (
          <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{operatorName(account.data.service)}</p>
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
                {t(`status.${account.data.status}`)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {t("changeNumber")}
              </Button>
              <Button
                type="button"
                variant={account.data.status === "ACTIVE" ? "destructive" : "default"}
                size="sm"
                disabled={isPending}
                onClick={() => void toggleStatus()}
              >
                {account.data.status === "ACTIVE"
                  ? t("suspend")
                  : t("reactivate")}
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <p className="text-muted-foreground text-sm">{t("loading")}</p>
        )}

        {!isLoading && !account.data && !accessDenied && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {t(k("notConfigured"))}
          </p>
        )}

        {successMessage && (
          <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </p>
        )}

        {showForm && !accessDenied && (
          <div className="flex flex-col gap-4">
            <FieldGroup>
              {viaPayDunya && (
                <Field>
                  <FieldLabel htmlFor="payout-operator">{t("operator")}</FieldLabel>
                  <select
                    id="payout-operator"
                    value={service || operators[0]}
                    onChange={(event) => setService(event.target.value)}
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    {operators.map((code) => (
                      <option key={code} value={code}>
                        {operatorName(code)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field data-invalid={Boolean(numberError)}>
                <FieldLabel htmlFor="payout-number">{t(k("number"))}</FieldLabel>
                <Input
                  id="payout-number"
                  inputMode="tel"
                  placeholder="77xxxxxxx"
                  value={destinationNumber}
                  onChange={(event) => setDestinationNumber(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter would otherwise submit the surrounding business
                    // settings form instead of saving the payout account.
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    void submit();
                  }}
                  aria-invalid={Boolean(numberError)}
                />
                <p className="text-muted-foreground text-xs">
                  {t(k("numberHint"))}
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
                  {t("cancel")}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={isPending || !destinationNumber.trim()}
              >
                {upsert.isPending
                  ? t("saving")
                  : account.data
                    ? t("update")
                    : t(k("activate"))}
              </Button>
            </div>
          </div>
        )}

        {mutationError && (
          <p className="text-destructive text-sm">
            {getBackendErrorMessages(mutationError, t("saveError")).join(" ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

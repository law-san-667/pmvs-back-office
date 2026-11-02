"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/user-context";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Turns the login code on or off; the password confirms the change. */
export function AccountSecurity({ className }: { className?: string }) {
  const t = useTranslations("auth.security");
  const tErrors = useTranslations("errors");
  const { user } = useUser();
  const utils = trpc.useUtils();
  const [password, setPassword] = useState("");
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const update = trpc.auth.updateMfa.useMutation();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  if (!user) return null;
  const on = enabled ?? user.mfaEnabled ?? false;
  const required = user.mfaRequired ?? false;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      const saved = await update.mutateAsync({ enabled: !on, password });
      setEnabled(saved.mfaEnabled ?? !on);
      setAsking(false);
      setPassword("");
      setMessage(saved.mfaEnabled ? t("enabled") : t("disabled"));
      await utils.auth.me.invalidate();
    } catch (failure) {
      setMessage(failure instanceof Error ? failure.message : tErrors("generic"));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {required
            ? t("required")
            : on
              ? t("enabledDescription")
              : t("disabledDescription")}
        </CardDescription>
      </CardHeader>
      {!required && (
        <CardContent className="flex flex-col gap-3">
          {message && <p role="status" className="text-sm">{message}</p>}
          {asking ? (
            <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
              <div className="flex min-w-52 flex-1 flex-col gap-1.5">
                <Label htmlFor="mfa-password">{t("passwordLabel")}</Label>
                <Input
                  id="mfa-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={!password || update.isPending}>
                {t("confirm")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAsking(false)}>
                {t("cancel")}
              </Button>
            </form>
          ) : (
            <div>
              <Button variant="outline" onClick={() => setAsking(true)}>
                {on ? t("disable") : t("enable")}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

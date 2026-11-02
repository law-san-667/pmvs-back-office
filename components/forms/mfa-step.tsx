"use client";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { LoginChallenge } from "@/lib/backend-utils";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Second step of the login: the code sent to the person's contact. */
export function MfaStep({
  challenge: initial,
  onSignedIn,
  onCancel,
}: {
  challenge: LoginChallenge;
  onSignedIn: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("auth.mfa");
  const tErrors = useTranslations("errors");
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const verify = trpc.auth.verifyLogin.useMutation();
  const resend = trpc.auth.resendLoginCode.useMutation();
  const pending = verify.isPending || resend.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await verify.mutateAsync({ challengeId: challenge.challengeId, code, device: "WEB" });
      onSignedIn();
    } catch (failure) {
      setCode("");
      setError(failure instanceof Error ? failure.message : tErrors("generic"));
    }
  };

  const sendAgain = async () => {
    setError(null);
    setInfo(null);
    try {
      const next = await resend.mutateAsync({ challengeId: challenge.challengeId });
      setChallenge(next);
      setCode("");
      setInfo(t("newCodeSent"));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : tErrors("generic"));
    }
  };

  return (
    <form className="mx-auto flex w-full max-w-md min-w-0 flex-col items-center gap-6" onSubmit={submit}>
      <div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground w-full text-sm wrap-anywhere">
          {t("description", { channel: challenge.channel, destination: challenge.destination })}
        </p>
        {challenge.debugCode && <p className="text-sm">{t("testCode", { code: challenge.debugCode })}</p>}
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {info && <p className="text-sm">{info}</p>}
      <InputOTP
        maxLength={challenge.codeLength}
        value={code}
        onChange={setCode}
        disabled={pending}
        autoFocus
        aria-label={t("codeLabel")}
        autoComplete="one-time-code"
      >
        <InputOTPGroup>
          {Array.from({ length: challenge.codeLength }, (_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <Button type="submit" className="h-12 w-full" disabled={pending || code.length !== challenge.codeLength}>
        {verify.isPending ? t("verifying") : t("submit")}
      </Button>
      <div className="grid w-full grid-cols-2 gap-4">
        <Button type="button" variant="outline" disabled={pending} onClick={() => void sendAgain()}>
          {t("resend")}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          {t("back")}
        </Button>
      </div>
    </form>
  );
}

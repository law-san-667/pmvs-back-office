"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BUYER_APP_URL } from "@/config/spaces";
import { useRouter } from "@/i18n/navigation";
import { clearPendingOtp, type PendingOtp } from "@/lib/pending-otp";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { MailIcon, PhoneIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { MfaStep } from "./mfa-step";
import { PhoneInput } from "../phone-input";
import type { LoginChallenge } from "@/lib/backend-utils";

type AuthMethod = "email" | "phone";

// Le backend répond 403 à un compte non validé, une fois le mot de passe vérifié,
// avec un message dans la langue de la page.
const PENDING_VERIFICATION =
  /pending verification|en attente de validation|awaiting validation|aguardar validação|انتظار التفعيل/i;
const isPendingVerificationError = (error: unknown) =>
  error instanceof TRPCClientError &&
  error.data?.code === "FORBIDDEN" &&
  PENDING_VERIFICATION.test(error.message);

export default function LoginForm({
  onSwitchToRegister,
  onForgotPassword,
  onOtpRequired,
}: {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onOtpRequired: (otp: PendingOtp, message: string) => void;
}) {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");

  const login = trpc.auth.login.useMutation();
  const resendOtp = trpc.auth.resendOtp.useMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as Resolver<LoginInput>,
    defaultValues: { identifier: "", password: "", device: "WEB" },
  });

  const onSubmit = async (data: LoginInput) => {
    setMessage(null);

    try {
      const result = await login.mutateAsync(data);
      if ("mfaRequired" in result) {
        setChallenge(result);
        return;
      }
      clearPendingOtp();
      router.replace("/callback");
      router.refresh();
    } catch (error) {
      if (isPendingVerificationError(error)) {
        await sendVerificationCode(data.identifier);
        return;
      }

      setMessage(error instanceof Error ? error.message : tErrors("generic"));
    }
  };

  const sendVerificationCode = async (identifier: string) => {
    try {
      const result = await resendOtp.mutateAsync({
        identifier,
        purpose: "REGISTER",
        device: "WEB",
      });

      onOtpRequired(
        { identifier, purpose: "REGISTER" },
        result.otp?.debugCode
          ? t("accountNotValidatedTestCode", { code: result.otp.debugCode })
          : t("accountNotValidated"),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : tErrors("generic"));
    }
  };

  const changeAuthMethod = (method: AuthMethod) => {
    if (method === authMethod) return;

    setAuthMethod(method);
    setMessage(null);
    form.resetField("identifier", { defaultValue: "" });
    form.clearErrors("identifier");
  };

  if (challenge) {
    return (
      <MfaStep
        challenge={challenge}
        onSignedIn={() => {
          clearPendingOtp();
          router.replace("/callback");
          router.refresh();
        }}
        onCancel={() => setChallenge(null)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8">
      {message && (
        <div className="rounded-2xl border border-[#dce7f3] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-slate-700">
          {message}
        </div>
      )}

      <div className="w-full max-w-md">
        <form
          className={cn("flex flex-col gap-6")}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground text-sm text-balance">
                {t("intro")}
              </p>
            </div>
            <div
              className="bg-muted grid grid-cols-2 rounded-lg p-1"
              role="group"
              aria-label={t("method")}
            >
              <Button
                type="button"
                variant={authMethod === "phone" ? "outline" : "ghost"}
                className={cn(
                  "h-10 shadow-none",
                  authMethod === "phone" && "bg-background",
                )}
                aria-pressed={authMethod === "phone"}
                disabled={login.isPending}
                onClick={() => changeAuthMethod("phone")}
              >
                <PhoneIcon className="size-4" />
                {t("whatsappPhone")}
              </Button>
              <Button
                type="button"
                variant={authMethod === "email" ? "outline" : "ghost"}
                className={cn(
                  "h-10 shadow-none",
                  authMethod === "email" && "bg-background",
                )}
                aria-pressed={authMethod === "email"}
                disabled={login.isPending}
                onClick={() => changeAuthMethod("email")}
              >
                <MailIcon className="size-4" />
                {t("email")}
              </Button>
            </div>
            <Controller
              name="identifier"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    {authMethod === "phone" ? t("whatsappPhone") : t("email")}
                  </FieldLabel>
                  {authMethod === "phone" ? (
                    <PhoneInput
                      key="phone"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      defaultCountry="SN"
                      autoComplete="tel"
                      disabled={login.isPending}
                    />
                  ) : (
                    <Input
                      {...field}
                      key="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t("emailPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      disabled={login.isPending}
                      className="h-12"
                    />
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t("password")}</FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                    disabled={login.isPending}
                    className="h-12"
                  />
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="ms-auto cursor-pointer text-sm underline-offset-4 hover:underline"
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <Button
                type="submit"
                size="lg"
                className="h-12"
                disabled={login.isPending || resendOtp.isPending}
              >
                {login.isPending || resendOtp.isPending
                  ? t("submitting")
                  : t("submit")}
              </Button>
            </Field>
            <Field>
              <FieldDescription className="text-center">
                {t.rich("noAccount", {
                  register: (chunks) => (
                    <button
                      type="button"
                      onClick={onSwitchToRegister}
                      className="text-primary cursor-pointer font-semibold hover:underline"
                    >
                      {chunks}
                    </button>
                  ),
                })}
              </FieldDescription>
            </Field>
            <div className="bg-muted/40 text-muted-foreground space-y-2 rounded-lg border px-4 py-3 text-xs">
              <p>
                {t.rich("warning", {
                  b: (chunks) => (
                    <span className="text-destructive font-semibold">
                      {chunks}
                    </span>
                  ),
                })}
              </p>
              <p>
                {t.rich("termsNotice", {
                  terms: (chunks) => (
                    <a
                      href={`${BUYER_APP_URL}/${locale}/cgu`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

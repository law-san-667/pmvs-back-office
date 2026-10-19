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
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { PhoneInput } from "../phone-input";

type AuthMethod = "email" | "phone";

// Le backend répond 403 à un compte non validé, une fois le mot de passe vérifié.
const isPendingVerificationError = (error: unknown) =>
  error instanceof TRPCClientError &&
  error.data?.code === "FORBIDDEN" &&
  /pending verification/i.test(error.message);

export default function LoginForm({
  onSwitchToRegister,
  onForgotPassword,
  onOtpRequired,
}: {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onOtpRequired: (otp: PendingOtp, message: string) => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
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
      await login.mutateAsync(data);
      clearPendingOtp();
      router.replace("/callback");
      router.refresh();
    } catch (error) {
      if (isPendingVerificationError(error)) {
        await sendVerificationCode(data.identifier);
        return;
      }

      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
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
          ? `Votre compte n'est pas encore validé. Code de test: ${result.otp.debugCode}`
          : "Votre compte n'est pas encore validé. Un nouveau code vous a été envoyé.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    }
  };

  const changeAuthMethod = (method: AuthMethod) => {
    if (method === authMethod) return;

    setAuthMethod(method);
    setMessage(null);
    form.resetField("identifier", { defaultValue: "" });
    form.clearErrors("identifier");
  };

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
              <h1 className="text-2xl font-bold">Content de vous revoir !</h1>
              <p className="text-muted-foreground text-sm text-balance">
                Entrez votre numéro de téléphone WhatsApp ou votre adresse
                électronique pour vous connecter à votre compte.
              </p>
            </div>
            <div
              className="bg-muted grid grid-cols-2 rounded-lg p-1"
              role="group"
              aria-label="Méthode de connexion"
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
                Téléphone WhatsApp
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
                Adresse électronique
              </Button>
            </div>
            <Controller
              name="identifier"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    {authMethod === "phone"
                      ? "Téléphone WhatsApp"
                      : "Adresse électronique"}
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
                      placeholder="nom@exemple.com"
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
                  <FieldLabel>Mot de passe</FieldLabel>
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
                      className="ml-auto cursor-pointer text-sm underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
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
                  ? "Connexion..."
                  : "Se connecter"}
              </Button>
            </Field>
            <Field>
              <FieldDescription className="text-center">
                Vous n&apos;avez pas de compte ?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-primary cursor-pointer font-semibold hover:underline"
                >
                  Inscrivez-vous
                </button>
              </FieldDescription>
            </Field>
            <div className="bg-muted/40 text-muted-foreground space-y-2 rounded-lg border px-4 py-3 text-xs">
              <p>
                <span className="text-destructive font-semibold">
                  Attention :
                </span>{" "}
                vos identifiants correspondent à ceux que vous avez utilisés
                pour vous inscrire.
              </p>
              <p>
                En cliquant sur « Se connecter », vous déclarez avoir lu et
                accepté les{" "}
                <a
                  href={`${BUYER_APP_URL}/fr/cgu`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  conditions générales d&apos;utilisation
                </a>{" "}
                sur Diarama et le règlement concernant la confidentialité.
              </p>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}

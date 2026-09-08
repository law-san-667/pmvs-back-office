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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  forgotPasswordSchema,
  validateOtpSchema,
  type ForgotPasswordInput,
  type ValidateOtpInput,
} from "@/lib/validators/auth";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon, PhoneIcon, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { cn } from "@/lib/utils";
import { PhoneInput } from "../phone-input";

type AuthMethod = "email" | "phone";

export default function ForgotPasswordForm({
  onBackToLogin,
}: {
  onBackToLogin: () => void;
}) {
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("phone");
  const [isDone, setIsDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const forgotPassword = trpc.auth.forgotPassword.useMutation();
  const resendOtp = trpc.auth.resendOtp.useMutation();
  const validateOtp = trpc.auth.validateOtp.useMutation();

  const requestForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema) as Resolver<ForgotPasswordInput>,
    defaultValues: { identifier: "", device: "WEB" },
  });

  const resetForm = useForm<ValidateOtpInput>({
    resolver: zodResolver(validateOtpSchema) as Resolver<ValidateOtpInput>,
    defaultValues: {
      identifier: "",
      purpose: "PASSWORD_RESET",
      code: "",
      newPassword: "",
      confirmPassword: "",
      device: "WEB",
    },
  });

  const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Une erreur est survenue.";

  const onRequest = async (data: ForgotPasswordInput) => {
    setMessage(null);

    try {
      const result = await forgotPassword.mutateAsync(data);

      setIdentifier(data.identifier);
      resetForm.setValue("identifier", data.identifier);
      setMessage(
        result.otp?.debugCode
          ? `Code de test: ${result.otp.debugCode}`
          : result.message,
      );
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const onReset = async (data: ValidateOtpInput) => {
    setMessage(null);

    try {
      await validateOtp.mutateAsync(data);

      setIsDone(true);
      setMessage(
        "Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.",
      );
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const handleResend = async () => {
    if (!identifier) return;

    setMessage(null);

    try {
      const result = await resendOtp.mutateAsync({
        identifier,
        purpose: "PASSWORD_RESET",
        device: "WEB",
      });

      setMessage(
        result.otp?.debugCode
          ? `Code de test: ${result.otp.debugCode}`
          : result.message,
      );
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const changeAuthMethod = (method: AuthMethod) => {
    if (method === authMethod) return;

    setAuthMethod(method);
    setMessage(null);
    requestForm.resetField("identifier", { defaultValue: "" });
    requestForm.clearErrors("identifier");
  };

  const isResetPending = validateOtp.isPending || resendOtp.isPending;

  return (
    <div className="flex flex-col items-center space-y-8">
      {message && (
        <div className="rounded-2xl border border-[#dce7f3] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-slate-700">
          {message}
        </div>
      )}

      <div className="w-full max-w-md">
        {isDone ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="text-2xl font-bold">Mot de passe réinitialisé</h1>
            <Button
              type="button"
              size="lg"
              className="h-12 w-full"
              onClick={onBackToLogin}
            >
              Se connecter
            </Button>
          </div>
        ) : identifier === null ? (
          <form
            className="flex flex-col gap-6"
            onSubmit={requestForm.handleSubmit(onRequest)}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Mot de passe oublié ?</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Entrez vos identifiants, nous vous enverrons un code de
                  vérification.
                </p>
              </div>

              <div
                className="bg-muted grid grid-cols-2 rounded-lg p-1"
                role="group"
                aria-label="Méthode de récupération"
              >
                <Button
                  type="button"
                  variant={authMethod === "phone" ? "outline" : "ghost"}
                  className={cn(
                    "h-10 shadow-none",
                    authMethod === "phone" && "bg-background",
                  )}
                  aria-pressed={authMethod === "phone"}
                  disabled={forgotPassword.isPending}
                  onClick={() => changeAuthMethod("phone")}
                >
                  <PhoneIcon className="size-4" />
                  Téléphone
                </Button>
                <Button
                  type="button"
                  variant={authMethod === "email" ? "outline" : "ghost"}
                  className={cn(
                    "h-10 shadow-none",
                    authMethod === "email" && "bg-background",
                  )}
                  aria-pressed={authMethod === "email"}
                  disabled={forgotPassword.isPending}
                  onClick={() => changeAuthMethod("email")}
                >
                  <MailIcon className="size-4" />
                  Email
                </Button>
              </div>

              <Controller
                name="identifier"
                control={requestForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      {authMethod === "phone"
                        ? "Numéro de téléphone"
                        : "Adresse email"}
                    </FieldLabel>
                    {authMethod === "phone" ? (
                      <PhoneInput
                        key="phone"
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        defaultCountry="SN"
                        autoComplete="tel"
                        disabled={forgotPassword.isPending}
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
                        disabled={forgotPassword.isPending}
                        className="h-12"
                      />
                    )}
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
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? "Envoi..." : "Envoyer le code"}
                </Button>
              </Field>

              <Field>
                <FieldDescription className="text-center">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-primary cursor-pointer font-semibold hover:underline"
                  >
                    Retour à la connexion
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        ) : (
          <form
            className="flex flex-col gap-6"
            onSubmit={resetForm.handleSubmit(onReset)}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Entrez le code envoyé à {identifier} et choisissez un nouveau
                  mot de passe.
                </p>
              </div>

              <Controller
                name="code"
                control={resetForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Code de validation</FieldLabel>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isResetPending}
                      aria-invalid={fieldState.invalid}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="newPassword"
                control={resetForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Nouveau mot de passe</FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      disabled={isResetPending}
                      className="h-12"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={resetForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Confirmation</FieldLabel>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      disabled={isResetPending}
                      className="h-12"
                    />
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
                  disabled={isResetPending}
                >
                  {validateOtp.isPending
                    ? "Réinitialisation..."
                    : "Réinitialiser le mot de passe"}
                </Button>
              </Field>

              <Field className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIdentifier(null)}
                  className="h-12"
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleResend}
                  disabled={isResetPending}
                  className="h-12"
                >
                  <RotateCcw className="size-4" />
                  Renvoyer le code
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}
      </div>
    </div>
  );
}

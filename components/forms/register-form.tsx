"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { isAuthSuccessData, type ValidateOtpData } from "@/lib/backend-utils";
import {
  registerFormSchema,
  type RegisterFormInput,
} from "@/lib/validators/auth";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, User } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { PhoneInput } from "../phone-input";
import OtpStep, { type OtpContext } from "./otp-step";

export default function RegisterForm({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();
  const [otpContext, setOtpContext] = useState<OtpContext | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const register = trpc.auth.register.useMutation();

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema) as Resolver<RegisterFormInput>,
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      role: "SELLER",
      device: "WEB",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setMessage(null);

    try {
      const result = await register.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role,
        device: data.device,
      });

      const identifier = data.phoneNumber || "";

      setOtpContext({ identifier, purpose: "REGISTER" });
      setMessage(
        result.otp.debugCode
          ? `Code de test: ${result.otp.debugCode}`
          : "Un code de validation vous a été envoyé.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    }
  };

  const handleOtpValidated = (result: ValidateOtpData) => {
    if (isAuthSuccessData(result)) {
      router.replace("/callback");
      router.refresh();
    }
  };

  if (otpContext) {
    return (
      <OtpStep
        context={otpContext}
        initialMessage={message}
        onBack={() => setOtpContext(null)}
        onValidated={handleOtpValidated}
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
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Inscrivez-vous
              </h1>
              <p className="max-w-md text-lg leading-8 text-slate-500">
                Entrez vos identifiants pour vous créer un compte.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Prénom</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <User className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="Jean"
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pr-4 text-base shadow-none ring-0 focus-visible:ring-0"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Nom</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <User className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="Dupont"
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pr-4 text-base shadow-none ring-0 focus-visible:ring-0"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="phoneNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Numéro de téléphone</FieldLabel>
                  <PhoneInput
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    defaultCountry="SN"
                    disabled={register.isPending}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Mot de passe</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <LockKeyhole className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        type="password"
                        aria-invalid={fieldState.invalid}
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pr-4 text-base shadow-none ring-0 focus-visible:ring-0"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Confirmation</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <LockKeyhole className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        type="password"
                        aria-invalid={fieldState.invalid}
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pr-4 text-base shadow-none ring-0 focus-visible:ring-0"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="acceptTerms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-600">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                      onBlur={field.onBlur}
                      disabled={register.isPending}
                      aria-invalid={fieldState.invalid}
                      className="mt-0.5"
                    />
                    <span>
                      J&apos;accepte les Conditions Générales d&apos;Utilisation
                      (CGU).
                    </span>
                  </label>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Field>
            <Button
              type="submit"
              disabled={register.isPending}
              className="flex h-12 w-full items-center justify-center rounded-[18px] bg-[#4390cf] text-lg font-medium text-white shadow-[0_24px_40px_-24px_rgba(67,144,207,0.95)] transition-colors hover:bg-[#317dbb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {register.isPending ? "Inscription..." : "S'inscrire"}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary cursor-pointer font-semibold hover:underline"
              >
                Connectez-vous
              </button>
            </FieldDescription>
          </Field>
        </form>
      </div>
    </div>
  );
}

"use client";

import CaptchaField from "@/components/captcha-field";
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
import type { PendingOtp } from "@/lib/pending-otp";
import {
  registerFormSchema,
  type RegisterFormInput,
} from "@/lib/validators/auth";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { PhoneInput } from "../phone-input";

export default function RegisterForm({
  onSwitchToLogin,
  onOtpRequired,
}: {
  onSwitchToLogin: () => void;
  onOtpRequired: (otp: PendingOtp, message: string) => void;
}) {
  const t = useTranslations("auth.register");
  const tOtp = useTranslations("auth.otp");
  const tErrors = useTranslations("errors");
  const [message, setMessage] = useState<string | null>(null);

  const register = trpc.auth.register.useMutation();
  // Undefined until the visitor solves the captcha, and again when it expires.
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema) as Resolver<RegisterFormInput>,
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
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
        captchaToken,
      });

      onOtpRequired(
        { identifier: data.phoneNumber || data.email || "", purpose: "REGISTER" },
        result.otp.debugCode
          ? tOtp("testCode", { code: result.otp.debugCode })
          : t("codeSent"),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : tErrors("generic"));
    }
  };

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
                {t("title")}
              </h1>
              <p className="max-w-md text-lg leading-8 text-slate-500">
                {t("intro")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("firstName")}</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <User className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder={t("firstNamePlaceholder")}
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pe-4 text-base shadow-none ring-0 focus-visible:ring-0"
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
                    <FieldLabel>{t("lastName")}</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <User className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder={t("lastNamePlaceholder")}
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pe-4 text-base shadow-none ring-0 focus-visible:ring-0"
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
                  <FieldLabel>{t("phone")}</FieldLabel>
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

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t("emailOptional")}</FieldLabel>
                  <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                    <div className="inline-flex items-center px-4">
                      <Mail className="size-4 text-slate-300" />
                    </div>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t("emailPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      disabled={register.isPending}
                      className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pe-4 text-base shadow-none ring-0 focus-visible:ring-0"
                    />
                  </div>
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
                    <FieldLabel>{t("password")}</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <LockKeyhole className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        type="password"
                        aria-invalid={fieldState.invalid}
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pe-4 text-base shadow-none ring-0 focus-visible:ring-0"
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
                    <FieldLabel>{t("confirmPassword")}</FieldLabel>
                    <div className="flex items-center overflow-hidden rounded-[18px] border border-[#dce7f3] bg-white shadow-[0_12px_30px_-24px_rgba(38,88,132,0.7)]">
                      <div className="inline-flex items-center px-4">
                        <LockKeyhole className="size-4 text-slate-300" />
                      </div>
                      <Input
                        {...field}
                        type="password"
                        aria-invalid={fieldState.invalid}
                        disabled={register.isPending}
                        className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 pe-4 text-base shadow-none ring-0 focus-visible:ring-0"
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
                    <span>{t("acceptTerms")}</span>
                  </label>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <CaptchaField onToken={setCaptchaToken} />

          <Field>
            <Button
              type="submit"
              disabled={register.isPending}
              className="flex h-12 w-full items-center justify-center rounded-[18px] bg-[#4390cf] text-lg font-medium text-white shadow-[0_24px_40px_-24px_rgba(67,144,207,0.95)] transition-colors hover:bg-[#317dbb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {register.isPending ? t("submitting") : t("submit")}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center">
              {t.rich("haveAccount", {
                login: (chunks) => (
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-primary cursor-pointer font-semibold hover:underline"
                  >
                    {chunks}
                  </button>
                ),
              })}
            </FieldDescription>
          </Field>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useUser } from "@/contexts/user-context";
import {
  isAuthSuccessData,
  type OtpPurpose,
  type ValidateOtpData,
} from "@/lib/backend-utils";
import {
  validateOtpSchema,
  type ValidateOtpInput,
} from "@/lib/validators/auth";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";

export type OtpContext = {
  identifier: string;
  purpose: OtpPurpose;
};

export default function OtpStep({
  context,
  initialMessage,
  onBack,
  onValidated,
}: {
  context: OtpContext;
  initialMessage: string | null;
  onBack: () => void;
  onValidated: (result: ValidateOtpData) => void;
}) {
  const t = useTranslations("auth.otp");
  const tErrors = useTranslations("errors");
  const [message, setMessage] = useState(initialMessage);
  const { setUser } = useUser();

  const validateOtp = trpc.auth.validateOtp.useMutation({
    onSuccess: async (result) => {
      if (isAuthSuccessData(result)) {
        const cookieOptions = {
          path: "/",
          sameSite: "Lax",
          secure: true,
        } as const;

        Cookies.set("access_token", result.accessToken, {
          ...cookieOptions,
          expires: result.expiresIn / 86400,
        });
        Cookies.set("refresh_token", result.refreshToken, {
          ...cookieOptions,
          expires: result.refreshExpiresIn / 86400,
        });

        if (result.user) {
          setUser(result.user);
        }
      }

      onValidated(result);
    },
    onError: (error) => {
      setMessage(error.message || tErrors("generic"));
    },
  });
  const resendOtp = trpc.auth.resendOtp.useMutation();

  const isPending = validateOtp.isPending || resendOtp.isPending;

  const form = useForm<ValidateOtpInput>({
    resolver: zodResolver(validateOtpSchema) as Resolver<ValidateOtpInput>,
    defaultValues: {
      identifier: context.identifier,
      purpose: context.purpose,
      code: "",
      device: "WEB",
    },
  });

  const onSubmit = (data: ValidateOtpInput) => {
    setMessage(null);
    validateOtp.mutate(data);
  };

  const handleResend = async () => {
    setMessage(null);

    try {
      const result = await resendOtp.mutateAsync({
        identifier: context.identifier,
        purpose: context.purpose,
        device: "WEB",
      });

      setMessage(
        result.otp?.debugCode
          ? t("testCode", { code: result.otp.debugCode })
          : t("newCodeSent"),
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
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground text-sm text-balance">
                {t("description", { identifier: context.identifier })}
              </p>
            </div>

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{t("codeLabel")}</FieldLabel>
                  <InputOTP
                    maxLength={4}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Field>
            <Button type="submit" disabled={isPending} className="h-12">
              {validateOtp.isPending ? t("submitting") : t("submit")}
            </Button>
          </Field>

          <Field className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-12"
            >
              {t("back")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleResend}
              disabled={isPending}
              className="h-12"
            >
              <RotateCcw className="size-4" />
              {t("resend")}
            </Button>
          </Field>
        </form>
      </div>
    </div>
  );
}

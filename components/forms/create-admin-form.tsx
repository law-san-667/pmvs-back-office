"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
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
import { Link } from "@/i18n/navigation";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
  createAdminFormSchema,
  type CreateAdminFormInput,
} from "@/lib/validators/admins";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { PhoneInput } from "../phone-input";

const ROLE_OPTIONS: Array<CreateAdminFormInput["role"]> = [
  "ADMIN",
  "MODERATOR",
  "OPERATOR",
];

const defaultValues: CreateAdminFormInput = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  role: "ADMIN",
  acceptTerms: false,
};

/** The account waiting for its code, once step 1 succeeded. */
type PendingAdmin = {
  id: string;
  identifier: string;
  displayIdentifier: string;
  channel: "EMAIL" | "PHONE";
  debugCode: string | null;
};

/**
 * Creates a back-office account in two steps, as the client specified:
 * details and password first, then the 4-digit code the new admin receives
 * on the contact given. The account only becomes active once that code is
 * entered here, so a mistyped phone or email never becomes a live admin.
 */
export function CreateAdminDialog({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("adminAccounts.createAdmin");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAdmin | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const createAdmin = trpc.admin.createAdmin.useMutation();
  const verifyAdmin = trpc.admin.verifyAdmin.useMutation();
  const resendOtp = trpc.auth.resendOtp.useMutation();

  const form = useForm<CreateAdminFormInput>({
    resolver: zodResolver(createAdminFormSchema) as Resolver<CreateAdminFormInput>,
    defaultValues,
  });

  const close = () => {
    setIsOpen(false);
    setError(null);
    setNotice(null);
    setPending(null);
    setCode("");
    form.reset(defaultValues);
  };

  const onSubmit = async (values: CreateAdminFormInput) => {
    setError(null);

    try {
      const { acceptTerms: _acceptTerms, ...payload } = values;
      const result = await createAdmin.mutateAsync(payload);
      setPending({
        id: result.admin.id,
        identifier: values.phoneNumber || values.email || "",
        displayIdentifier: result.otp.identifier,
        channel: result.otp.channel,
        debugCode: result.otp.debugCode,
      });
      setNotice(
        result.otp.debugCode
          ? t("testCode", { code: result.otp.debugCode })
          : t("codeSent", { identifier: result.otp.identifier }),
      );
      // The account exists (pending): the list can show it already.
      onCreated();
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(
          mutationError,
          t("createError"),
        ),
      );
    }
  };

  const onVerify = async () => {
    if (!pending) return;
    setError(null);

    if (code.length !== 4) {
      setError(t("enterCode"));
      return;
    }

    try {
      await verifyAdmin.mutateAsync({ id: pending.id, code });
      onCreated();
      close();
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(mutationError, t("invalidCode")),
      );
    }
  };

  const onResend = async () => {
    if (!pending) return;
    setError(null);

    try {
      const result = await resendOtp.mutateAsync({
        identifier: pending.identifier,
        purpose: "REGISTER",
        device: "WEB",
      });
      setNotice(
        result.otp?.debugCode
          ? t("testCode", { code: result.otp.debugCode })
          : t("newCodeSent", { identifier: pending.displayIdentifier }),
      );
    } catch (mutationError) {
      setError(getMutationErrorMessage(mutationError, t("resendError")));
    }
  };

  const isPending =
    createAdmin.isPending || verifyAdmin.isPending || resendOtp.isPending;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? setIsOpen(true) : close())}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon /> {t("title")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {pending ? t("verifyTitle") : t("title")}
          </DialogTitle>
          <DialogDescription>
            {pending
              ? t("verifyDescription", {
                  channel: pending.channel,
                  identifier: pending.displayIdentifier,
                })
              : t("description")}
          </DialogDescription>
        </DialogHeader>

        {notice && (
          <p className="rounded-md border border-[#dce7f3] bg-[#f8fbff] px-3 py-2 text-sm">
            {notice}
          </p>
        )}

        {pending ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <InputOTP
              maxLength={4}
              value={code}
              onChange={setCode}
              disabled={isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void onResend()}
              disabled={isPending}
            >
              <RotateCcw /> {t("resend")}
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        ) : (
          <form
            id="create-admin-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{t("firstName")}</FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
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
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("email")}</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t("emailPlaceholder")}
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phoneNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("phone")}</FieldLabel>
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value ?? "")}
                      onBlur={field.onBlur}
                      defaultCountry="SN"
                      autoComplete="tel"
                      disabled={isPending}
                    />
                    <p className="text-muted-foreground text-xs">
                      {t("phoneHint")}
                    </p>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="admin-role">{t("role")}</FieldLabel>
                    <select
                      id="admin-role"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      disabled={isPending}
                      className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`roleOptions.${option}`)}
                        </option>
                      ))}
                    </select>
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
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder={t("passwordPlaceholder")}
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
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
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
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
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                        disabled={isPending}
                        className="mt-0.5"
                      />
                      <span>
                        {t.rich("acceptTerms", {
                          link: (chunks) => (
                            <Link
                              href="/cgu"
                              className="text-primary font-medium hover:underline"
                              target="_blank"
                            >
                              {chunks}
                            </Link>
                          ),
                        })}
                      </span>
                    </label>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {error && <p className="text-destructive text-sm">{error}</p>}
          </form>
        )}

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={isPending}>
                {pending ? t("validateLater") : t("cancel")}
              </Button>
            }
          />
          {pending ? (
            <Button type="button" onClick={() => void onVerify()} disabled={isPending}>
              {verifyAdmin.isPending ? t("validating") : t("activate")}
            </Button>
          ) : (
            <Button type="submit" form="create-admin-form" disabled={isPending}>
              {createAdmin.isPending ? t("creating") : t("create")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

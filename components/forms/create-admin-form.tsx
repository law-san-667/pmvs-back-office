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
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { PhoneInput } from "../phone-input";

const ROLE_OPTIONS: Array<{ value: CreateAdminFormInput["role"]; label: string }> = [
  { value: "ADMIN", label: "Administrateur — accès complet" },
  { value: "MODERATOR", label: "Modérateur — modération des contenus" },
  { value: "OPERATOR", label: "Opérateur — suivi de l'activité" },
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
          ? `Code de test : ${result.otp.debugCode}`
          : `Un code a été envoyé à ${result.otp.identifier}.`,
      );
      // The account exists (pending): the list can show it already.
      onCreated();
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(
          mutationError,
          "Impossible de créer ce compte administrateur.",
        ),
      );
    }
  };

  const onVerify = async () => {
    if (!pending) return;
    setError(null);

    if (code.length !== 4) {
      setError("Entrez le code à 4 chiffres.");
      return;
    }

    try {
      await verifyAdmin.mutateAsync({ id: pending.id, code });
      onCreated();
      close();
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(mutationError, "Code invalide ou expiré."),
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
          ? `Code de test : ${result.otp.debugCode}`
          : `Un nouveau code a été envoyé à ${pending.displayIdentifier}.`,
      );
    } catch (mutationError) {
      setError(getMutationErrorMessage(mutationError, "Renvoi impossible."));
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
            <PlusIcon /> Nouvel administrateur
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {pending ? "Validation du compte" : "Nouvel administrateur"}
          </DialogTitle>
          <DialogDescription>
            {pending
              ? `Entrez le code à 4 chiffres reçu par ${pending.channel === "EMAIL" ? "email" : "message"} à ${pending.displayIdentifier}. Le compte reste inactif tant qu'il n'est pas validé.`
              : "Le compte sera activé après validation du code envoyé à la personne. Communiquez-lui son mot de passe : aucun email d'invitation n'est envoyé."}
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
              <RotateCcw /> Renvoyer le code
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
                      <FieldLabel>Prénom</FieldLabel>
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
                      <FieldLabel>Nom</FieldLabel>
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
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="nom@exemple.com"
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
                    <FieldLabel>Numéro</FieldLabel>
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value ?? "")}
                      onBlur={field.onBlur}
                      defaultCountry="SN"
                      autoComplete="tel"
                      disabled={isPending}
                    />
                    <p className="text-muted-foreground text-xs">
                      Le code de validation est envoyé au numéro, ou à
                      l&apos;email s&apos;il n&apos;y a pas de numéro.
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
                    <FieldLabel htmlFor="admin-role">Rôle</FieldLabel>
                    <select
                      id="admin-role"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      disabled={isPending}
                      className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                      <FieldLabel>Mot de passe</FieldLabel>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder="6 car. min., majuscule, chiffre"
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
                      <FieldLabel>Confirmation du mot de passe</FieldLabel>
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
                        La personne accepte les{" "}
                        <Link
                          href="/cgu"
                          className="text-primary font-medium hover:underline"
                          target="_blank"
                        >
                          conditions générales d&apos;utilisation
                        </Link>{" "}
                        de Diarama.
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
                {pending ? "Valider plus tard" : "Annuler"}
              </Button>
            }
          />
          {pending ? (
            <Button type="button" onClick={() => void onVerify()} disabled={isPending}>
              {verifyAdmin.isPending ? "Validation..." : "Activer le compte"}
            </Button>
          ) : (
            <Button type="submit" form="create-admin-form" disabled={isPending}>
              {createAdmin.isPending ? "Création..." : "Créer et envoyer le code"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

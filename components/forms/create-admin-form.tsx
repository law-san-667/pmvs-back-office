"use client";

import { Button } from "@/components/ui/button";
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
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
  createAdminInputSchema,
  type CreateAdminInput,
} from "@/lib/validators/admins";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { PhoneInput } from "../phone-input";

const ROLE_OPTIONS: Array<{ value: CreateAdminInput["role"]; label: string }> = [
  { value: "ADMIN", label: "Administrateur — accès complet" },
  { value: "MODERATOR", label: "Modérateur — modération des contenus" },
  { value: "OPERATOR", label: "Opérateur — suivi de l'activité" },
];

const defaultValues: CreateAdminInput = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "ADMIN",
};

/**
 * Creates a back-office account. The person can sign in straight away with
 * the password set here: there is no invitation email yet, so it has to be
 * passed on out of band.
 */
export function CreateAdminDialog({ onCreated }: { onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createAdmin = trpc.admin.createAdmin.useMutation();

  const form = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminInputSchema) as Resolver<CreateAdminInput>,
    defaultValues,
  });

  const close = () => {
    setIsOpen(false);
    setError(null);
    form.reset(defaultValues);
  };

  const onSubmit = async (values: CreateAdminInput) => {
    setError(null);

    try {
      await createAdmin.mutateAsync(values);
      onCreated();
      close();
    } catch (mutationError) {
      setError(
        getMutationErrorMessage(
          mutationError,
          "Impossible de créer ce compte administrateur.",
        ),
      );
    }
  };

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
          <DialogTitle>Nouvel administrateur</DialogTitle>
          <DialogDescription>
            Le compte est actif immédiatement. Communiquez le mot de passe à la
            personne concernée : aucun email d&apos;invitation n&apos;est
            envoyé.
          </DialogDescription>
        </DialogHeader>

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
                      disabled={createAdmin.isPending}
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
                      disabled={createAdmin.isPending}
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
                  <FieldLabel>Adresse email</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="nom@exemple.com"
                    aria-invalid={fieldState.invalid}
                    disabled={createAdmin.isPending}
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
                  <FieldLabel>Numéro de téléphone</FieldLabel>
                  <PhoneInput
                    value={field.value ?? ""}
                    onChange={(value) => field.onChange(value ?? "")}
                    onBlur={field.onBlur}
                    defaultCountry="SN"
                    autoComplete="tel"
                    disabled={createAdmin.isPending}
                  />
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
                    disabled={createAdmin.isPending}
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

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Mot de passe provisoire</FieldLabel>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    aria-invalid={fieldState.invalid}
                    disabled={createAdmin.isPending}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </form>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={createAdmin.isPending}>
                Annuler
              </Button>
            }
          />
          <Button
            type="submit"
            form="create-admin-form"
            disabled={createAdmin.isPending}
          >
            {createAdmin.isPending ? "Création..." : "Créer le compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

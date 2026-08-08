"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  Category,
  City,
  Country,
  SubCategory,
} from "@/lib/backend-resource-types";
import { slugify } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { useState, type FormEvent } from "react";

export type ConfigurationEditorTarget =
  | { kind: "category"; value: Category | null }
  | { kind: "subCategory"; value: SubCategory | null }
  | { kind: "country"; value: Country | null }
  | { kind: "city"; value: City | null };

type SharedProps = {
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function FormError({ message }: { message?: string | null }) {
  return message ? <p className="text-destructive text-sm">{message}</p> : null;
}

function BooleanField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

function CategoryEditor({
  value,
  onClose,
  onSaved,
}: SharedProps & { value: Category | null }) {
  const [name, setName] = useState(value?.name ?? "");
  const slug = slugify(name);
  const [description, setDescription] = useState(value?.description ?? "");
  const [isService, setIsService] = useState(value?.isService ?? false);
  const [isActive, setIsActive] = useState(value?.isActive ?? true);
  const create = trpc.admin.createCategory.useMutation();
  const update = trpc.admin.updateCategory.useMutation();
  const mutation = value ? update : create;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name,
      slug,
      description: description.trim() || null,
      isService,
      isActive,
    };

    try {
      if (value) await update.mutateAsync({ id: value.id, ...payload });
      else await create.mutateAsync(payload);
      await onSaved();
      onClose();
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {value ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
          <DialogDescription>
            Configurez le classement des produits ou services.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Nom</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              value={slug}
              readOnly
              className="bg-muted"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <BooleanField
              id="category-service"
              label="Catégorie de services"
              checked={isService}
              onCheckedChange={setIsService}
            />
            <BooleanField
              id="category-active"
              label="Active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubCategoryEditor({
  value,
  categories,
  onClose,
  onSaved,
}: SharedProps & { value: SubCategory | null; categories: Category[] }) {
  const [categoryId, setCategoryId] = useState(
    value?.categoryId ?? categories[0]?.id ?? "",
  );
  const [name, setName] = useState(value?.name ?? "");
  const slug = slugify(name);
  const [description, setDescription] = useState(value?.description ?? "");
  const [isService, setIsService] = useState(value?.isService ?? false);
  const [isActive, setIsActive] = useState(value?.isActive ?? true);
  const create = trpc.admin.createSubCategory.useMutation();
  const update = trpc.admin.updateSubCategory.useMutation();
  const mutation = value ? update : create;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      categoryId,
      name,
      slug,
      description: description.trim() || null,
      isService,
      isActive,
    };

    try {
      if (value) await update.mutateAsync({ id: value.id, ...payload });
      else await create.mutateAsync(payload);
      await onSaved();
      onClose();
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {value ? "Modifier la sous-catégorie" : "Nouvelle sous-catégorie"}
          </DialogTitle>
          <DialogDescription>
            Associez la sous-catégorie à une catégorie existante.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="subcategory-category">Catégorie</Label>
            <select
              id="subcategory-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              required
            >
              <option value="" disabled>
                Sélectionner une catégorie
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="subcategory-name">Nom</Label>
              <Input
                id="subcategory-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subcategory-slug">Slug</Label>
              <Input
                id="subcategory-slug"
                value={slug}
                readOnly
                className="bg-muted"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subcategory-description">Description</Label>
            <Textarea
              id="subcategory-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <BooleanField
              id="subcategory-service"
              label="Sous-catégorie de services"
              checked={isService}
              onCheckedChange={setIsService}
            />
            <BooleanField
              id="subcategory-active"
              label="Active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending || !categoryId}>
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CountryEditor({
  value,
  onClose,
  onSaved,
}: SharedProps & { value: Country | null }) {
  const [code, setCode] = useState(value?.code ?? "");
  const [name, setName] = useState(value?.name ?? "");
  const [currencyCode, setCurrencyCode] = useState(value?.currencyCode ?? "");
  const [phonePrefix, setPhonePrefix] = useState(value?.phonePrefix ?? "");
  const [isActive, setIsActive] = useState(value?.isActive ?? true);
  const create = trpc.admin.createCountry.useMutation();
  const update = trpc.admin.updateCountry.useMutation();
  const mutation = value ? update : create;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      name,
      currencyCode: currencyCode.toUpperCase(),
      phonePrefix,
      isActive,
    };

    try {
      if (value) await update.mutateAsync({ code: value.code, ...payload });
      else await create.mutateAsync({ code: code.toUpperCase(), ...payload });
      await onSaved();
      onClose();
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {value ? "Modifier le pays" : "Nouveau pays"}
          </DialogTitle>
          <DialogDescription>
            Configurez le code, la devise et l’indicatif du pays.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="country-code">Code pays</Label>
              <Input
                id="country-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                disabled={Boolean(value)}
                minLength={2}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country-currency">Devise</Label>
              <Input
                id="country-currency"
                value={currencyCode}
                onChange={(event) =>
                  setCurrencyCode(event.target.value.toUpperCase())
                }
                minLength={3}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country-name">Nom</Label>
            <Input
              id="country-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country-prefix">Indicatif téléphonique</Label>
            <Input
              id="country-prefix"
              value={phonePrefix}
              onChange={(event) => setPhonePrefix(event.target.value)}
              placeholder="+221"
              required
            />
          </div>
          <BooleanField
            id="country-active"
            label="Pays actif"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CityEditor({
  value,
  countries,
  onClose,
  onSaved,
}: SharedProps & { value: City | null; countries: Country[] }) {
  const [countryCode, setCountryCode] = useState(
    value?.countryCode ?? countries[0]?.code ?? "",
  );
  const [name, setName] = useState(value?.name ?? "");
  const slug = slugify(name);
  const [isActive, setIsActive] = useState(value?.isActive ?? true);
  const create = trpc.admin.createCity.useMutation();
  const update = trpc.admin.updateCity.useMutation();
  const mutation = value ? update : create;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = { countryCode, name, slug, isActive };

    try {
      if (value) {
        await update.mutateAsync({ currentSlug: value.slug, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      await onSaved();
      onClose();
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {value ? "Modifier la ville" : "Nouvelle ville"}
          </DialogTitle>
          <DialogDescription>
            Associez la ville à un pays configuré.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="city-country">Pays</Label>
            <select
              id="city-country"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              required
            >
              <option value="" disabled>
                Sélectionner un pays
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city-name">Nom</Label>
            <Input
              id="city-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city-slug">Slug</Label>
            <Input
              id="city-slug"
              value={slug}
              readOnly
              className="bg-muted"
              required
            />
          </div>
          <BooleanField
            id="city-active"
            label="Ville active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending || !countryCode}>
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfigurationEditor({
  target,
  categories,
  countries,
  onClose,
  onSaved,
}: {
  target: ConfigurationEditorTarget;
  categories: Category[];
  countries: Country[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  if (target.kind === "category") {
    return (
      <CategoryEditor
        value={target.value}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (target.kind === "subCategory") {
    return (
      <SubCategoryEditor
        value={target.value}
        categories={categories}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (target.kind === "country") {
    return (
      <CountryEditor value={target.value} onClose={onClose} onSaved={onSaved} />
    );
  }

  return (
    <CityEditor
      value={target.value}
      countries={countries}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

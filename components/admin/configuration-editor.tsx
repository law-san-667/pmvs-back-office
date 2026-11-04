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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("adminSettings.editor");
  const tc = useTranslations("adminSettings.common");
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
            {value ? t("category.edit") : t("category.new")}
          </DialogTitle>
          <DialogDescription>
            {t("category.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="category-name">{t("name")}</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-slug">{t("slug")}</Label>
            <Input
              id="category-slug"
              value={slug}
              readOnly
              className="bg-muted"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-description">{t("description")}</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <BooleanField
              id="category-service"
              label={t("category.isService")}
              checked={isService}
              onCheckedChange={setIsService}
            />
            <BooleanField
              id="category-active"
              label={tc("activeFeminine")}
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? tc("saving") : tc("save")}
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
  const t = useTranslations("adminSettings.editor");
  const tc = useTranslations("adminSettings.common");
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
            {value ? t("subCategory.edit") : t("subCategory.new")}
          </DialogTitle>
          <DialogDescription>
            {t("subCategory.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="subcategory-category">
              {t("subCategory.category")}
            </Label>
            <select
              id="subcategory-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              required
            >
              <option value="" disabled>
                {t("subCategory.selectCategory")}
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
              <Label htmlFor="subcategory-name">{t("name")}</Label>
              <Input
                id="subcategory-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subcategory-slug">{t("slug")}</Label>
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
            <Label htmlFor="subcategory-description">{t("description")}</Label>
            <Textarea
              id="subcategory-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-5">
            <BooleanField
              id="subcategory-service"
              label={t("subCategory.isService")}
              checked={isService}
              onCheckedChange={setIsService}
            />
            <BooleanField
              id="subcategory-active"
              label={tc("activeFeminine")}
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !categoryId}>
              {mutation.isPending ? tc("saving") : tc("save")}
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
  const t = useTranslations("adminSettings.editor");
  const tc = useTranslations("adminSettings.common");
  const [code, setCode] = useState(value?.code ?? "");
  const [name, setName] = useState(value?.name ?? "");
  const [currencyCode, setCurrencyCode] = useState(value?.currencyCode ?? "");
  const [phonePrefix, setPhonePrefix] = useState(value?.phonePrefix ?? "");
  const [isActive, setIsActive] = useState(value?.isActive ?? true);
  const [isOapi, setIsOapi] = useState(value?.isOapi ?? false);
  const [deploymentPhase, setDeploymentPhase] = useState(
    value?.deploymentPhase ? String(value.deploymentPhase) : "",
  );
  const [supplierRegistrationOpen, setSupplierRegistrationOpen] = useState(
    value?.supplierRegistrationOpen ?? false,
  );
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
      isOapi,
      deploymentPhase: deploymentPhase ? Number(deploymentPhase) : null,
      supplierRegistrationOpen,
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
            {value ? t("country.edit") : t("country.new")}
          </DialogTitle>
          <DialogDescription>
            {t("country.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="country-code">{t("country.code")}</Label>
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
              <Label htmlFor="country-currency">
                {t("country.currency")}
              </Label>
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
            <Label htmlFor="country-name">{t("name")}</Label>
            <Input
              id="country-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country-prefix">
              {t("country.phonePrefix")}
            </Label>
            <Input
              id="country-prefix"
              value={phonePrefix}
              onChange={(event) => setPhonePrefix(event.target.value)}
              placeholder="+221"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country-phase">{t("country.phase")}</Label>
            <select
              id="country-phase"
              value={deploymentPhase}
              onChange={(event) => setDeploymentPhase(event.target.value)}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              <option value="">{t("country.phaseNone")}</option>
              <option value="1">{t("country.phase1")}</option>
              <option value="2">{t("country.phase2")}</option>
              <option value="3">{t("country.phase3")}</option>
            </select>
          </div>
          <BooleanField
            id="country-active"
            label={t("country.isActive")}
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <BooleanField
            id="country-oapi"
            label={t("country.isOapi")}
            checked={isOapi}
            onCheckedChange={setIsOapi}
          />
          <BooleanField
            id="country-supplier-open"
            label={t("country.supplierRegistrationOpen")}
            checked={supplierRegistrationOpen}
            onCheckedChange={setSupplierRegistrationOpen}
          />
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? tc("saving") : tc("save")}
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
  const t = useTranslations("adminSettings.editor");
  const tc = useTranslations("adminSettings.common");
  const [countryCode, setCountryCode] = useState(
    value?.countryCode ?? countries[0]?.code ?? "",
  );
  const [name, setName] = useState(value?.name ?? "");
  const slug = slugify(name);
  const [isActive, setIsActive] = useState(value?.isActive ?? true);
  const [latitude, setLatitude] = useState(
    value?.latitude != null ? String(value.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    value?.longitude != null ? String(value.longitude) : "",
  );
  const create = trpc.admin.createCity.useMutation();
  const update = trpc.admin.updateCity.useMutation();
  const mutation = value ? update : create;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toCoordinate = (text: string) => {
      const number = Number.parseFloat(text.replace(",", "."));
      return Number.isFinite(number) ? number : null;
    };
    const payload = {
      countryCode,
      name,
      slug,
      isActive,
      latitude: toCoordinate(latitude),
      longitude: toCoordinate(longitude),
    };

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
            {value ? t("city.edit") : t("city.new")}
          </DialogTitle>
          <DialogDescription>
            {t("city.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="city-country">{t("city.country")}</Label>
            <select
              id="city-country"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              required
            >
              <option value="" disabled>
                {t("city.selectCountry")}
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city-name">{t("name")}</Label>
            <Input
              id="city-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city-slug">{t("slug")}</Label>
            <Input
              id="city-slug"
              value={slug}
              readOnly
              className="bg-muted"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="city-latitude">{t("city.latitude")}</Label>
              <Input
                id="city-latitude"
                inputMode="decimal"
                placeholder="14.6928"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city-longitude">
                {t("city.longitude")}
              </Label>
              <Input
                id="city-longitude"
                inputMode="decimal"
                placeholder="-17.4467"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
            </div>
            <p className="text-muted-foreground col-span-2 text-xs">
              {t("city.coordinatesHint")}
            </p>
          </div>
          <BooleanField
            id="city-active"
            label={t("city.isActive")}
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <FormError message={mutation.error?.message} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !countryCode}>
              {mutation.isPending ? tc("saving") : tc("save")}
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

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/contexts/business-context";
import { getBackendErrorMessages } from "@/lib/backend-utils";
import { getCroppedImg, type CroppedArea } from "@/lib/crop-image";
import { getMutationErrorMessage } from "@/lib/mutation-error";
import {
  uploadFileToR2FromBrowser,
  type CreateR2Upload,
} from "@/lib/upload-to-r2";
import type { UpdateBusinessInput } from "@/lib/validators/business";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Camera, CheckCircle2, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { PhoneInput } from "../phone-input";

const settingsFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom du business est requis."),
  description: z.string(),
  countryCode: z.string().trim().min(2, "Le pays est requis."),
  citySlug: z.string().trim().min(1, "La ville est requise."),
  address: z.string(),
  deliveryZones: z.array(z.string()),
  whatsappPhone: z.string(),
  contactEmail: z
    .email("L'email professionnel est invalide.")
    .or(z.literal("")),
  facebookLink: z.url("Le lien Facebook est invalide.").or(z.literal("")),
  instagramLink: z.url("Le lien Instagram est invalide.").or(z.literal("")),
  orangeMoneyNumber: z.string(),
  waveNumber: z.string(),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

const emptyValues: SettingsFormData = {
  name: "",
  description: "",
  countryCode: "SN",
  citySlug: "",
  address: "",
  deliveryZones: [],
  whatsappPhone: "",
  contactEmail: "",
  facebookLink: "",
  instagramLink: "",
  orangeMoneyNumber: "",
  waveNumber: "",
};

const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export default function BusinessSettingsForm() {
  const utils = trpc.useUtils();
  const { setBusiness } = useBusiness();

  const myBusiness = trpc.businesses.myBusiness.useQuery();
  const business = myBusiness.data;

  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedArea | null>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: emptyValues,
  });
  const countryCode = useWatch({ control: form.control, name: "countryCode" });

  // Prefill the form once the business is loaded.
  useEffect(() => {
    if (!business) return;

    form.reset({
      name: business.name,
      description: business.description ?? "",
      countryCode: business.countryCode,
      citySlug: business.citySlug,
      address: business.address ?? "",
      deliveryZones: business.deliveryZones ?? [],
      whatsappPhone: business.whatsappPhone ?? "",
      contactEmail: business.contactEmail ?? "",
      facebookLink: business.facebookLink ?? "",
      instagramLink: business.instagramLink ?? "",
      orangeMoneyNumber: business.orangeMoneyNumber ?? "",
      waveNumber: business.waveNumber ?? "",
    });
  }, [business, form]);

  const countries = trpc.geography.countries.useQuery({
    isActive: true,
    limit: 100,
    order: "asc",
    orderBy: "name",
  });
  const cities = trpc.geography.countryCities.useQuery(
    {
      code: countryCode,
      isActive: true,
      limit: 100,
      order: "asc",
      orderBy: "name",
    },
    {
      enabled: Boolean(countryCode),
    },
  );

  const createUploadMutation = trpc.media.createUpload.useMutation();
  const createUpload: CreateR2Upload = (input) =>
    createUploadMutation.mutateAsync(input);

  const updateBusiness = trpc.businesses.update.useMutation({
    onSuccess: async (updated) => {
      setSubmissionErrors([]);
      setSuccessMessage("Les informations du business ont été mises à jour.");
      setBusiness(updated);
      setLogoFile(null);
      await utils.businesses.myBusiness.invalidate();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(
          error,
          "Erreur lors de la mise à jour du business.",
        ),
      );
    },
  });

  const onLogoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCropImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const logoDropzone = useDropzone({
    onDrop: onLogoDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  const onCropComplete = useCallback(
    (_: CroppedArea, croppedPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const blob = await getCroppedImg(cropImage, croppedAreaPixels);
    const file = new File([blob], "business-logo.png", {
      type: blob.type || "image/png",
    });
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(blob));
    setCropImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const isMutating = updateBusiness.isPending || isUploading;

  const onSubmit = async (data: SettingsFormData) => {
    if (isMutating || !business) return;

    setSubmissionErrors([]);
    setSuccessMessage(null);

    try {
      let imageUrl: string | undefined;
      if (logoFile) {
        setIsUploading(true);
        setUploadProgress(0);
        imageUrl = await uploadFileToR2FromBrowser(
          logoFile,
          "images",
          createUpload,
          setUploadProgress,
        );
        setIsUploading(false);
      }

      const payload: UpdateBusinessInput = {
        id: business.id,
        name: data.name.trim(),
        description: optional(data.description),
        countryCode: data.countryCode,
        citySlug: data.citySlug,
        address: optional(data.address),
        deliveryZones: data.deliveryZones,
        whatsappPhone: optional(data.whatsappPhone),
        contactEmail: optional(data.contactEmail),
        facebookLink: optional(data.facebookLink),
        instagramLink: optional(data.instagramLink),
        orangeMoneyNumber: optional(data.orangeMoneyNumber),
        waveNumber: optional(data.waveNumber),
      };
      if (imageUrl) payload.image = imageUrl;

      updateBusiness.mutate(payload);
    } catch (error) {
      setIsUploading(false);
      setSubmissionErrors([
        getMutationErrorMessage(error, "Erreur lors de l'envoi du logo."),
      ]);
    }
  };

  const deliveryZoneAnchorRef = useComboboxAnchor();
  const countryItems = countries.data?.items ?? [];
  const countryNameByCode = Object.fromEntries(
    countryItems.map((country) => [country.code, country.name]),
  );
  const cityItems = cities.data?.items ?? [];
  const cityNameBySlug = new Map(
    cityItems.map((city) => [city.slug, city.name]),
  );
  const cityNameItems = Object.fromEntries(
    cityItems.map((city) => [city.slug, city.name]),
  );
  const citySlugs = cityItems.map((city) => city.slug);

  if (myBusiness.isLoading) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center gap-2 text-sm">
        <Spinner />
        Chargement des informations du business...
      </div>
    );
  }

  if (myBusiness.isError || !business) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 p-4 text-center text-sm">
        <AlertCircle className="text-muted-foreground size-8" />
        <p className="font-medium">
          Impossible de charger les informations du business.
        </p>
        {myBusiness.error && (
          <p className="text-muted-foreground">{myBusiness.error.message}</p>
        )}
      </div>
    );
  }

  const currentLogo = logoPreview ?? business.image;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">
          Mettez à jour les informations de votre business
        </p>
      </div>

      {submissionErrors.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 flex flex-wrap gap-2 rounded-md border p-3">
          {submissionErrors.map((error, index) => (
            <Badge
              key={`${error}-${index}`}
              variant="destructive"
              className="max-w-full text-left whitespace-normal"
            >
              <AlertCircle className="size-3" />
              {error}
            </Badge>
          ))}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm font-medium text-green-600">
          <CheckCircle2 className="size-4" />
          {successMessage}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Profil du business</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Photo de profile/Logo</FieldLabel>
                    <div
                      {...logoDropzone.getRootProps()}
                      className="border-primary/30 bg-primary/5 relative flex size-24! cursor-pointer items-center justify-center rounded-full border-2 border-dashed"
                    >
                      <input {...logoDropzone.getInputProps()} />
                      {currentLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentLogo}
                          alt="Logo"
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        <Camera className="text-primary/50 size-8" />
                      )}
                      <span className="bg-primary/10 text-primary absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-white">
                        <Pencil className="size-3" />
                      </span>
                    </div>
                  </Field>

                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Nom du Business</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className="h-12"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Description</FieldLabel>
                        <Textarea {...field} aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="countryCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Pays</FieldLabel>
                        <Select
                          items={countryNameByCode}
                          value={field.value}
                          onValueChange={(val) => {
                            if (!val) return;
                            field.onChange(val);
                            form.setValue("citySlug", "", {
                              shouldValidate: true,
                            });
                            form.setValue("deliveryZones", []);
                          }}
                          disabled={countries.isLoading}
                        >
                          <SelectTrigger
                            aria-invalid={fieldState.invalid}
                            className="h-12! w-full"
                          >
                            <SelectValue
                              placeholder={
                                countries.isLoading ? "Chargement..." : "Pays"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {countryItems.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.code}
                              >
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="citySlug"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Ville</FieldLabel>
                        <Select
                          items={cityNameItems}
                          value={field.value}
                          onValueChange={(val) => val && field.onChange(val)}
                          disabled={cities.isLoading || cityItems.length === 0}
                        >
                          <SelectTrigger
                            aria-invalid={fieldState.invalid}
                            className="h-12! w-full"
                          >
                            <SelectValue
                              placeholder={
                                cities.isLoading ? "Chargement..." : "Ville"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {cityItems.map((city) => (
                              <SelectItem key={city.slug} value={city.slug}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="address"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Adresse</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className="h-12"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="deliveryZones"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Zone de livraison</FieldLabel>
                        <Combobox
                          multiple
                          items={citySlugs}
                          itemToStringLabel={(slug) =>
                            cityNameBySlug.get(slug) ?? slug
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={cities.isLoading || cityItems.length === 0}
                        >
                          <ComboboxChips
                            ref={deliveryZoneAnchorRef}
                            className="min-h-12"
                          >
                            {field.value.map((zone) => (
                              <ComboboxChip key={zone}>
                                {cityNameBySlug.get(zone) ?? zone}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              placeholder={
                                cities.isLoading ? "Chargement..." : "Villes"
                              }
                              disabled={
                                cities.isLoading || cityItems.length === 0
                              }
                            />
                          </ComboboxChips>
                          <ComboboxContent anchor={deliveryZoneAnchorRef}>
                            <ComboboxEmpty>
                              Aucune ville trouvée.
                            </ComboboxEmpty>
                            <ComboboxList>
                              {cityItems.map((city) => (
                                <ComboboxItem
                                  key={city.slug}
                                  value={city.slug}
                                >
                                  {city.name}
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">
                  Contact et réseaux sociaux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="whatsappPhone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Numéro Whatsapp (optionnel)</FieldLabel>
                        <PhoneInput
                          value={field.value}
                          onChange={(value) => field.onChange(value || "")}
                          defaultCountry="SN"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="contactEmail"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Email professionel (optionnel)</FieldLabel>
                        <Input
                          {...field}
                          type="email"
                          aria-invalid={fieldState.invalid}
                          className="h-12"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="facebookLink"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Lien Facebook (optionnel)</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className="h-12"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="instagramLink"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Lien Instagram (optionnel)</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className="h-12"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Moyens de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="orangeMoneyNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Numéro Orange Money (optionnel)
                        </FieldLabel>
                        <PhoneInput
                          value={field.value}
                          onChange={(value) => field.onChange(value || "")}
                          defaultCountry="SN"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="waveNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Numéro Wave (optionnel)</FieldLabel>
                        <PhoneInput
                          value={field.value}
                          onChange={(value) => field.onChange(value || "")}
                          defaultCountry="SN"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-6 h-14 w-full text-base"
          disabled={isMutating}
        >
          {isUploading
            ? `Envoi du logo… ${uploadProgress}%`
            : updateBusiness.isPending
              ? "Mise à jour en cours..."
              : "Enregistrer les modifications"}
        </Button>
      </form>

      {/* Crop dialog */}
      <Dialog
        open={!!cropImage}
        onOpenChange={(open) => !open && setCropImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recadrer la photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full">
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropImage(null)}>
              Annuler
            </Button>
            <Button onClick={handleCropSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { PayoutAccountForm } from "@/components/forms/payout-account-form";

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
import { msg } from "@/lib/validators/messages";
import { trpc } from "@/server/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Camera, CheckCircle2, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { PhoneInput } from "../phone-input";

const settingsFormSchema = z.object({
  name: z.string().trim().min(1, msg("settings.errors.nameRequired")),
  description: z.string(),
  countryCode: z.string().trim().min(2, msg("settings.errors.countryRequired")),
  citySlug: z.string().trim().min(1, msg("settings.errors.cityRequired")),
  address: z.string(),
  deliveryZones: z.array(z.string()),
  whatsappPhone: z.string(),
  contactEmail: z
    .email(msg("settings.errors.emailInvalid"))
    .or(z.literal("")),
  facebookLink: z.url(msg("settings.errors.facebookInvalid")).or(z.literal("")),
  instagramLink: z.url(msg("settings.errors.instagramInvalid")).or(z.literal("")),
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
  const t = useTranslations("settings.business");
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
      // Older records may list a city twice.
      deliveryZones: [...new Set(business.deliveryZones ?? [])],
      whatsappPhone: business.whatsappPhone ?? "",
      contactEmail: business.contactEmail ?? "",
      facebookLink: business.facebookLink ?? "",
      instagramLink: business.instagramLink ?? "",
      orangeMoneyNumber: business.orangeMoneyNumber ?? "",
      waveNumber: business.waveNumber ?? "",
    });
  }, [business, form]);

  const countries = trpc.geography.countries.useQuery({
    limit: 100,
    order: "asc",
    orderBy: "name",
  });
  const cities = trpc.geography.countryCities.useQuery(
    {
      code: countryCode,
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
      setSuccessMessage(t("updated"));
      setBusiness(updated);
      setLogoFile(null);
      await utils.businesses.myBusiness.invalidate();
    },
    onError: (error) => {
      setSubmissionErrors(
        getBackendErrorMessages(error, t("updateError")),
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
        deliveryZones: [...new Set(data.deliveryZones)],
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
        getMutationErrorMessage(error, t("logoUploadError")),
      ]);
    }
  };

  const deliveryZoneAnchorRef = useComboboxAnchor();
  // Only the countries open to suppliers, plus the business's own country so
  // the current value still shows if that country was closed since.
  const countryItems = (countries.data?.items ?? []).filter(
    (country) =>
      country.supplierRegistrationOpen !== false ||
      country.code === business?.countryCode,
  );
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
        {t("loading")}
      </div>
    );
  }

  if (myBusiness.isError || !business) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 p-4 text-center text-sm">
        <AlertCircle className="text-muted-foreground size-8" />
        <p className="font-medium">
          {t("loadError")}
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
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {submissionErrors.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 flex flex-wrap gap-2 rounded-md border p-3">
          {submissionErrors.map((error, index) => (
            <Badge
              key={`${error}-${index}`}
              variant="destructive"
              className="max-w-full text-start whitespace-normal"
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
                <CardTitle className="font-bold">{t("profile")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t("logo")}</FieldLabel>
                    <div
                      {...logoDropzone.getRootProps()}
                      className="border-primary/30 bg-primary/5 relative flex size-24! cursor-pointer items-center justify-center rounded-full border-2 border-dashed"
                    >
                      <input {...logoDropzone.getInputProps()} />
                      {currentLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentLogo}
                          alt={t("logoAlt")}
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        <Camera className="text-primary/50 size-8" />
                      )}
                      <span className="bg-primary/10 text-primary absolute -end-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-white">
                        <Pencil className="size-3" />
                      </span>
                    </div>
                  </Field>

                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("name")}</FieldLabel>
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
                        <FieldLabel>{t("description")}</FieldLabel>
                        <Textarea
                          {...field}
                          aria-invalid={fieldState.invalid}
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
                <CardTitle className="font-bold">{t("location")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="countryCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("country")}</FieldLabel>
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
                                countries.isLoading ? t("loadingShort") : t("country")
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
                        <FieldLabel>{t("city")}</FieldLabel>
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
                                cities.isLoading ? t("loadingShort") : t("city")
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
                        <FieldLabel>{t("address")}</FieldLabel>
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
                        <FieldLabel>{t("deliveryZones")}</FieldLabel>
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
                                cities.isLoading ? t("loadingShort") : t("cities")
                              }
                              disabled={
                                cities.isLoading || cityItems.length === 0
                              }
                            />
                          </ComboboxChips>
                          <ComboboxContent anchor={deliveryZoneAnchorRef}>
                            <ComboboxEmpty>{t("noCity")}</ComboboxEmpty>
                            <ComboboxList>
                              {cityItems.map((city) => (
                                <ComboboxItem key={city.slug} value={city.slug}>
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
                <CardTitle className="font-bold">{t("contact")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="whatsappPhone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("whatsapp")}</FieldLabel>
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
                        <FieldLabel>{t("email")}</FieldLabel>
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
                        <FieldLabel>{t("facebook")}</FieldLabel>
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
                        <FieldLabel>{t("instagram")}</FieldLabel>
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

            {business && (
              <PayoutAccountForm businessId={business.id} countryCode={countryCode} />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">{t("paymentMethods")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Controller
                    name="orangeMoneyNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{t("orangeMoney")}</FieldLabel>
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
                        <FieldLabel>{t("wave")}</FieldLabel>
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
            ? t("uploadingLogo", { progress: uploadProgress })
            : updateBusiness.isPending
              ? t("updating")
              : t("submit")}
        </Button>
      </form>

      {/* Crop dialog */}
      <Dialog
        open={!!cropImage}
        onOpenChange={(open) => !open && setCropImage(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cropTitle")}</DialogTitle>
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
              {t("cancel")}
            </Button>
            <Button onClick={handleCropSave}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

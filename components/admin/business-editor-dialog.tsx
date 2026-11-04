"use client";

import { Button } from "@/components/ui/button";
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
import { BUSINESS_STATUS_LABELS } from "@/lib/admin-business-utils";
import type { AdminBusiness } from "@/lib/admin-types";
import type {
  BusinessCategory,
  BusinessStatus,
} from "@/lib/backend-resource-types";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/business-categories";
import { useTranslations } from "next-intl";
import { trpc } from "@/server/trpc/client";
import { useState, type FormEvent } from "react";

export function BusinessEditorDialog({
  business,
  onClose,
  onSaved,
}: {
  business: AdminBusiness;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("adminAccounts");
  const tCategory = useTranslations("onboarding.category.options");
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [whatsappPhone, setWhatsappPhone] = useState(
    business.whatsappPhone ?? "",
  );
  const [address, setAddress] = useState(business.address ?? "");
  const [status, setStatus] = useState<BusinessStatus>(business.status);
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>(
    business.businessCategory,
  );
  const [commissionRate, setCommissionRate] = useState(
    business.commissionRatePercent ?? "",
  );
  const update = trpc.admin.updateBusiness.useMutation();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await update.mutateAsync({
        id: business.id,
        name: name.trim(),
        description: description.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        whatsappPhone: whatsappPhone.trim() || undefined,
        address: address.trim() || undefined,
        businessCategory,
        status,
        commissionRatePercent: commissionRate.trim()
          ? Number(commissionRate)
          : null,
      });
      await onSaved();
      onClose();
    } catch {
      // The mutation error is rendered in the dialog.
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("editor.title")}</DialogTitle>
            <DialogDescription>
              {t("editor.description", { name: business.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-name">{t("editor.name")}</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-description">
              {t("editor.descriptionLabel")}
            </Label>
            <Textarea
              id="business-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="business-email">
                {t("editor.contactEmail")}
              </Label>
              <Input
                id="business-email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="business-whatsapp">WhatsApp</Label>
              <Input
                id="business-whatsapp"
                value={whatsappPhone}
                onChange={(event) => setWhatsappPhone(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-address">{t("editor.address")}</Label>
            <Input
              id="business-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-status">{t("editor.status")}</Label>
            <select
              id="business-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BusinessStatus)
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {(Object.keys(BUSINESS_STATUS_LABELS) as BusinessStatus[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {t(`businessStatus.${value}`)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-category">{t("editor.category")}</Label>
            <select
              id="business-category"
              value={businessCategory}
              onChange={(event) =>
                setBusinessCategory(event.target.value as BusinessCategory)
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {(Object.keys(BUSINESS_CATEGORY_LABELS) as BusinessCategory[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {tCategory(`${value}.label`)}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-commission">
              {t("editor.commission")}
            </Label>
            <Input
              id="business-commission"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={commissionRate}
              onChange={(event) => setCommissionRate(event.target.value)}
              placeholder={t("editor.commissionPlaceholder")}
            />
          </div>

          {update.error && (
            <p className="text-destructive text-sm">{update.error.message}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={update.isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

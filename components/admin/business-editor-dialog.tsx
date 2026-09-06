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
import { BUSINESS_STATUS_LABELS } from "@/lib/admin-business-utils";
import type { AdminBusiness } from "@/lib/admin-types";
import type { BusinessStatus } from "@/lib/backend-resource-types";
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
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [whatsappPhone, setWhatsappPhone] = useState(
    business.whatsappPhone ?? "",
  );
  const [address, setAddress] = useState(business.address ?? "");
  const [status, setStatus] = useState<BusinessStatus>(business.status);
  const [legalBusiness, setLegalBusiness] = useState(business.legalBusiness);
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
        legalBusiness,
        status,
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
            <DialogTitle>Modifier l&apos;entreprise</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations et le statut de « {business.name} ».
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-name">Nom</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-description">Description</Label>
            <Textarea
              id="business-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="business-email">Email de contact</Label>
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
            <Label htmlFor="business-address">Adresse</Label>
            <Input
              id="business-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="business-status">Statut</Label>
            <select
              id="business-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BusinessStatus)
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {Object.entries(BUSINESS_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="business-legal"
              checked={legalBusiness}
              onCheckedChange={(checked) => setLegalBusiness(checked === true)}
            />
            <Label htmlFor="business-legal">Entreprise formelle</Label>
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
              Annuler
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

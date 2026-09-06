"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BUSINESS_STATUS_BADGE_CLASSES,
  BUSINESS_STATUS_LABELS,
} from "@/lib/admin-business-utils";
import type { AdminBusiness } from "@/lib/admin-types";
import { formatDate, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground col-span-1">{label}</span>
      <span className="col-span-2 break-words">{value || "—"}</span>
    </div>
  );
}

export function BusinessDetailsSheet({
  business,
  onClose,
  onEdit,
}: {
  business: AdminBusiness;
  onClose: () => void;
  onEdit: () => void;
}) {
  // The list payload is already complete, but refetch to show the freshest data.
  const details = trpc.admin.business.useQuery(
    { idOrSlug: business.id },
    { initialData: business },
  );
  const value = details.data ?? business;
  const legalInformation = value.legalBusinessInformation;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={value.image ?? undefined} alt={value.name} />
              <AvatarFallback>{getInitials(value.name)}</AvatarFallback>
            </Avatar>
            {value.name}
          </SheetTitle>
          <SheetDescription>
            {value.slug ?? value.id}
            <Badge
              variant="outline"
              className={`ml-2 ${BUSINESS_STATUS_BADGE_CLASSES[value.status]}`}
            >
              {BUSINESS_STATUS_LABELS[value.status]}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <section>
            <h3 className="mb-1 text-sm font-medium">Informations générales</h3>
            <Separator />
            <Row label="Description" value={value.description} />
            <Row
              label="Localisation"
              value={`${value.citySlug}, ${value.countryCode}`}
            />
            <Row label="Adresse" value={value.address} />
            <Row
              label="Zones de livraison"
              value={value.deliveryZones?.join(", ")}
            />
            <Row label="Inscription" value={formatDate(value.createdAt, true)} />
            <Row
              label="Dernière mise à jour"
              value={formatDate(value.updatedAt, true)}
            />
          </section>

          <section>
            <h3 className="mb-1 text-sm font-medium">Contact</h3>
            <Separator />
            <Row label="Email" value={value.contactEmail} />
            <Row label="WhatsApp" value={value.whatsappPhone} />
            <Row label="Facebook" value={value.facebookLink} />
            <Row label="Instagram" value={value.instagramLink} />
            <Row label="Orange Money" value={value.orangeMoneyNumber} />
            <Row label="Wave" value={value.waveNumber} />
          </section>

          <section>
            <h3 className="mb-1 text-sm font-medium">Conformité</h3>
            <Separator />
            <Row
              label="Type"
              value={value.legalBusiness ? "Formelle" : "Informelle"}
            />
            <Row
              label="Documents"
              value={
                value.legalDocuments?.length ? (
                  <ul className="flex flex-col gap-1">
                    {value.legalDocuments.map((document) => (
                      <li key={document}>
                        <a
                          href={document}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          {document.split("/").pop()}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null
              }
            />
            {legalInformation && (
              <>
                <Row label="Statut juridique" value={legalInformation.legalStatus} />
                <Row
                  label="Registre de commerce"
                  value={legalInformation.commercialRegisterNumber}
                />
                <Row
                  label="Année de création"
                  value={legalInformation.creationYear}
                />
                <Row
                  label="Représentant légal"
                  value={`${legalInformation.legalRepresentative.name} — ${legalInformation.legalRepresentative.mobilePhone}`}
                />
                <Row label="Site web" value={legalInformation.website} />
              </>
            )}
            {value.legalBusinessQuestions?.map((question) => (
              <Row
                key={question.questionTitle}
                label={question.questionTitle}
                value={question.answer}
              />
            ))}
          </section>
        </div>

        <SheetFooter>
          <Button onClick={onEdit}>Modifier</Button>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

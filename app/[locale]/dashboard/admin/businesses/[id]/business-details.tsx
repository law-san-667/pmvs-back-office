"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { BusinessDeleteDialog } from "@/components/admin/business-delete-dialog";
import { BusinessEditorDialog } from "@/components/admin/business-editor-dialog";
import IsLoadingScreen from "@/components/is-loading-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import {
  BUSINESS_MEMBER_ROLE_LABELS,
  BUSINESS_MEMBER_STATUS_LABELS,
  BUSINESS_STATUS_BADGE_CLASSES,
  BUSINESS_STATUS_LABELS,
} from "@/lib/admin-business-utils";
import type { BusinessStatus } from "@/lib/backend-resource-types";
import { formatDate, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircle2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground col-span-1">{label}</span>
      <span className="col-span-2 break-words">{value || "—"}</span>
    </div>
  );
}

export function BusinessDetails({ id }: { id: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const business = trpc.admin.business.useQuery({ idOrSlug: id });
  const members = trpc.admin.members.useQuery(
    { page: 1, limit: 50, orderBy: "role", order: "asc", businessId: id },
    { enabled: Boolean(business.data) },
  );
  const listings = trpc.admin.listings.useQuery(
    {
      page: 1,
      limit: 10,
      orderBy: "createdAt",
      order: "desc",
      businessSlug: business.data?.slug ?? undefined,
    },
    { enabled: Boolean(business.data?.slug) },
  );
  const updateStatus = trpc.admin.updateBusiness.useMutation();

  const refresh = async () => {
    await Promise.all([
      utils.admin.business.invalidate(),
      utils.admin.businesses.invalidate(),
      utils.admin.stats.invalidate(),
    ]);
  };

  const changeStatus = async (status: BusinessStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      await refresh();
    } catch {
      // The mutation error is rendered under the header.
    }
  };

  if (business.isLoading) {
    return <IsLoadingScreen text="Chargement de l'entreprise..." />;
  }

  if (business.error || !business.data) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/admin/businesses")}
        >
          <ArrowLeftIcon /> Retour
        </Button>
        <p className="text-destructive text-sm">
          {business.error?.message ?? "Entreprise introuvable."}
        </p>
      </div>
    );
  }

  const value = business.data;
  const legalInformation = value.legalBusinessInformation;
  const owner = members.data?.items.find((member) => member.role === "OWNER");

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <Button
        variant="ghost"
        className="w-fit"
        onClick={() => router.push("/dashboard/admin/businesses")}
      >
        <ArrowLeftIcon /> Retour aux entreprises
      </Button>

      <AdminPageHeader
        title={value.name}
        description={`${value.slug ?? value.id} — inscrite le ${formatDate(value.createdAt)}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Avatar>
          <AvatarImage src={value.image ?? undefined} alt={value.name} />
          <AvatarFallback>{getInitials(value.name)}</AvatarFallback>
        </Avatar>
        <Badge
          variant="outline"
          className={BUSINESS_STATUS_BADGE_CLASSES[value.status]}
        >
          {BUSINESS_STATUS_LABELS[value.status]}
        </Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          {value.status !== "ACTIVE" && (
            <Button
              disabled={updateStatus.isPending}
              onClick={() => void changeStatus("ACTIVE")}
            >
              <CheckCircle2Icon />
              {value.status === "PENDING_VERIFICATION"
                ? "Valider"
                : "Réactiver"}
            </Button>
          )}
          {value.status !== "SUSPENDED" && (
            <Button
              variant="outline"
              disabled={updateStatus.isPending}
              onClick={() => void changeStatus("SUSPENDED")}
            >
              <BanIcon /> Suspendre
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <PencilIcon /> Modifier
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleting(true)}>
            <Trash2Icon /> Supprimer
          </Button>
        </div>
      </div>
      {updateStatus.error && (
        <p className="text-destructive text-sm">{updateStatus.error.message}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent>
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
            <Row
              label="Type"
              value={value.legalBusiness ? "Formelle" : "Informelle"}
            />
            <Row label="Inscription" value={formatDate(value.createdAt, true)} />
            <Row
              label="Mise à jour"
              value={formatDate(value.updatedAt, true)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Email" value={value.contactEmail} />
            <Row label="WhatsApp" value={value.whatsappPhone} />
            <Row label="Facebook" value={value.facebookLink} />
            <Row label="Instagram" value={value.instagramLink} />
            <Row label="Orange Money" value={value.orangeMoneyNumber} />
            <Row label="Wave" value={value.waveNumber} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Propriétaire</CardTitle>
          </CardHeader>
          <CardContent>
            {members.isLoading && (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            )}
            {!members.isLoading && !owner?.user && (
              <p className="text-muted-foreground text-sm">
                Aucun propriétaire associé à cette entreprise.
              </p>
            )}
            {owner?.user && (
              <>
                <div className="mb-2 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={owner.user.profileImage ?? undefined}
                      alt={owner.user.firstName}
                    />
                    <AvatarFallback>
                      {getInitials(
                        `${owner.user.firstName} ${owner.user.lastName}`,
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {owner.user.firstName} {owner.user.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {owner.user.id}
                    </p>
                  </div>
                </div>
                <Separator />
                <Row label="Email" value={owner.user.email} />
                <Row label="Téléphone" value={owner.user.phoneNumber} />
                <Row label="Rôle plateforme" value={owner.user.role} />
                <Row label="Statut compte" value={owner.user.status} />
                <Row
                  label="Dernière connexion"
                  value={
                    owner.user.lastLoginAt
                      ? formatDate(owner.user.lastLoginAt, true)
                      : null
                  }
                />
                <Row
                  label="Compte créé le"
                  value={formatDate(owner.user.createdAt)}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conformité</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Row
                  label="Statut juridique"
                  value={legalInformation.legalStatus}
                />
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Équipe ({members.data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Ajouté le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={5}
                isLoading={members.isLoading}
                error={members.error?.message}
                isEmpty={!members.data?.items.length}
                loadingLabel="Chargement de l'équipe..."
                emptyLabel="Aucun membre pour cette entreprise."
              />
              {members.data?.items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.user
                      ? `${member.user.firstName} ${member.user.lastName}`
                      : member.userId}
                  </TableCell>
                  <TableCell>
                    {member.user?.email ?? member.user?.phoneNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    {BUSINESS_MEMBER_ROLE_LABELS[member.role]}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {BUSINESS_MEMBER_STATUS_LABELS[member.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Annonces récentes ({listings.data?.total ?? 0})</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/admin/listings")}
            >
              Voir toutes les annonces
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={3}
                isLoading={listings.isLoading}
                error={listings.error?.message}
                isEmpty={!listings.data?.items.length}
                loadingLabel="Chargement des annonces..."
                emptyLabel="Aucune annonce pour cette entreprise."
              />
              {listings.data?.items.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>{listing.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{listing.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(listing.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isEditing && (
        <BusinessEditorDialog
          business={value}
          onClose={() => setIsEditing(false)}
          onSaved={refresh}
        />
      )}
      {isDeleting && (
        <BusinessDeleteDialog
          business={value}
          onClose={() => setIsDeleting(false)}
          onDeleted={async () => {
            await refresh();
            router.push("/dashboard/admin/businesses");
          }}
        />
      )}
    </div>
  );
}

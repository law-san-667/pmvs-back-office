"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { BusinessDeleteDialog } from "@/components/admin/business-delete-dialog";
import { BusinessEditorDialog } from "@/components/admin/business-editor-dialog";
import { BusinessQualityCard } from "@/components/admin/business-quality-card";
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
import { BUSINESS_STATUS_BADGE_CLASSES } from "@/lib/admin-business-utils";
import type { BusinessStatus } from "@/lib/backend-resource-types";
import { isLegalBusinessCategory } from "@/lib/business-categories";
import { getBusinessSizeClass } from "@/lib/validators/business";
import { formatDate, getInitials } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckCircle2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("adminAccounts");
  const tOnboarding = useTranslations("onboarding");
  const locale = useLocale();
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
  const payoutAccount = trpc.admin.businessPayoutAccount.useQuery(
    { businessId: id },
    { enabled: Boolean(business.data), retry: false },
  );
  const updatePayoutStatus =
    trpc.admin.updateBusinessPayoutAccountStatus.useMutation();

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
    return <IsLoadingScreen text={t("details.loading")} />;
  }

  if (business.error || !business.data) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/dashboard/admin/businesses")}
        >
          <ArrowLeftIcon /> {t("actions.back")}
        </Button>
        <p className="text-destructive text-sm">
          {business.error?.message ?? t("details.notFound")}
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
        <ArrowLeftIcon /> {t("details.backToList")}
      </Button>

      <AdminPageHeader
        title={value.name}
        description={t("details.subtitle", {
          id: value.slug ?? value.id,
          date: formatDate(value.createdAt, false, locale),
        })}
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
          {t(`businessStatus.${value.status}`)}
        </Badge>
        <div className="ms-auto flex flex-wrap gap-2">
          {value.status !== "ACTIVE" && (
            <Button
              disabled={updateStatus.isPending}
              onClick={() => void changeStatus("ACTIVE")}
            >
              <CheckCircle2Icon />
              {value.status === "PENDING_VERIFICATION"
                ? t("actions.validate")
                : t("actions.reactivate")}
            </Button>
          )}
          {value.status !== "SUSPENDED" && (
            <Button
              variant="outline"
              disabled={updateStatus.isPending}
              onClick={() => void changeStatus("SUSPENDED")}
            >
              <BanIcon /> {t("actions.suspend")}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <PencilIcon /> {t("actions.edit")}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleting(true)}>
            <Trash2Icon /> {t("actions.delete")}
          </Button>
        </div>
      </div>
      {updateStatus.error && (
        <p className="text-destructive text-sm">{updateStatus.error.message}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("details.general.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              label={t("details.general.description")}
              value={value.description}
            />
            <Row
              label={t("details.general.location")}
              value={`${value.citySlug}, ${value.countryCode}`}
            />
            <Row label={t("details.general.address")} value={value.address} />
            <Row
              label={t("details.general.deliveryZones")}
              value={value.deliveryZones?.join(", ")}
            />
            <Row
              label={t("details.general.category")}
              value={tOnboarding(
                `category.options.${value.businessCategory}.label`,
              )}
            />
            <Row
              label={t("details.general.registeredAt")}
              value={formatDate(value.createdAt, true, locale)}
            />
            <Row
              label={t("details.general.updatedAt")}
              value={formatDate(value.updatedAt, true, locale)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("details.contact.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label={t("details.contact.email")} value={value.contactEmail} />
            <Row label="WhatsApp" value={value.whatsappPhone} />
            <Row label="Facebook" value={value.facebookLink} />
            <Row label="Instagram" value={value.instagramLink} />
            <Row label="Orange Money" value={value.orangeMoneyNumber} />
            <Row label="Wave" value={value.waveNumber} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("details.owner.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.isLoading && (
              <p className="text-muted-foreground text-sm">
                {t("details.loadingShort")}
              </p>
            )}
            {!members.isLoading && !owner?.user && (
              <p className="text-muted-foreground text-sm">
                {t("details.owner.none")}
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
                <Row label={t("details.owner.email")} value={owner.user.email} />
                <Row
                  label={t("details.owner.phone")}
                  value={owner.user.phoneNumber}
                />
                <Row
                  label={t("details.owner.platformRole")}
                  value={owner.user.role}
                />
                <Row
                  label={t("details.owner.accountStatus")}
                  value={owner.user.status}
                />
                <Row
                  label={t("details.owner.lastLogin")}
                  value={
                    owner.user.lastLoginAt
                      ? formatDate(owner.user.lastLoginAt, true, locale)
                      : null
                  }
                />
                <Row
                  label={t("details.owner.createdAt")}
                  value={formatDate(owner.user.createdAt, false, locale)}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("details.payout.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {payoutAccount.isLoading && (
              <p className="text-muted-foreground text-sm">
                {t("details.loadingShort")}
              </p>
            )}
            {!payoutAccount.isLoading && !payoutAccount.data && (
              <p className="text-muted-foreground text-sm">
                {t("details.payout.none")}
              </p>
            )}
            {payoutAccount.data && (
              <>
                <Row
                  label={t("details.payout.operator")}
                  value={payoutAccount.data.service}
                />
                <Row
                  label={t("details.payout.number")}
                  value={payoutAccount.data.destinationNumber}
                />
                <Row
                  label={t("details.payout.status")}
                  value={t(`payoutStatus.${payoutAccount.data.status}`)}
                />
                <Row
                  label={t("details.payout.recipientId")}
                  value={payoutAccount.data.recipientId}
                />
                <Row
                  label={t("details.payout.lastEvent")}
                  value={
                    payoutAccount.data.lastProviderEventAt
                      ? formatDate(
                          payoutAccount.data.lastProviderEventAt,
                          true,
                          locale,
                        )
                      : null
                  }
                />
                <Row
                  label={t("details.payout.commission")}
                  value={
                    value.commissionRatePercent != null
                      ? `${value.commissionRatePercent} %`
                      : t("details.payout.defaultRate")
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={
                      payoutAccount.data.status === "ACTIVE"
                        ? "destructive"
                        : "default"
                    }
                    disabled={updatePayoutStatus.isPending}
                    onClick={() =>
                      void updatePayoutStatus
                        .mutateAsync({
                          businessId: id,
                          status:
                            payoutAccount.data?.status === "ACTIVE"
                              ? "SUSPENDED"
                              : "ACTIVE",
                        })
                        .then(() => payoutAccount.refetch())
                        .catch(() => undefined)
                    }
                  >
                    {payoutAccount.data.status === "ACTIVE"
                      ? t("details.payout.suspend")
                      : t("details.payout.reactivate")}
                  </Button>
                </div>
                {updatePayoutStatus.error && (
                  <p className="text-destructive mt-2 text-sm">
                    {updatePayoutStatus.error.message}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("details.compliance.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Row
              label={t("details.compliance.documents")}
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
            {!isLegalBusinessCategory(value.businessCategory) && (
              <p className="text-muted-foreground text-sm">
                {t("details.compliance.physicalPersonNote")}
              </p>
            )}
            {legalInformation && (
              <>
                <Row
                  label={t("details.compliance.legalStatus")}
                  value={legalInformation.legalStatus}
                />
                <Row
                  label={t("details.compliance.commercialRegister")}
                  value={legalInformation.commercialRegisterNumber}
                />
                <Row
                  label={t("details.compliance.creationYear")}
                  value={legalInformation.creationYear}
                />
                <Row
                  label={t("details.compliance.taxId")}
                  value={legalInformation.taxIdentificationNumber}
                />
                <Row
                  label={t("details.compliance.permanentStaff")}
                  value={
                    legalInformation.permanentStaffCount !== undefined
                      ? `${legalInformation.permanentStaffCount}${
                          getBusinessSizeClass(legalInformation.permanentStaffCount)
                            ? ` — ${tOnboarding(`legal.sizeClasses.${getBusinessSizeClass(legalInformation.permanentStaffCount)!}`)}`
                            : ""
                        }`
                      : null
                  }
                />
                <Row
                  label={t("details.compliance.businessTypes")}
                  value={legalInformation.businessTypes
                    ?.map((type) =>
                      type === "OTHER" && legalInformation.otherBusinessType
                        ? legalInformation.otherBusinessType
                        : tOnboarding(`activities.types.${type}`),
                    )
                    .join(", ")}
                />
                <Row
                  label={t("details.compliance.postalCode")}
                  value={legalInformation.postalCode}
                />
                <Row
                  label={t("details.compliance.legalRepresentative")}
                  value={
                    // Shops created before this field existed have no legal representative.
                    legalInformation.legalRepresentative &&
                    [legalInformation.legalRepresentative.name, legalInformation.legalRepresentative.mobilePhone]
                      .filter(Boolean)
                      .join(" — ")
                  }
                />
                <Row
                  label={t("details.compliance.website")}
                  value={legalInformation.website}
                />
                <Row
                  label={t("details.compliance.headquarters")}
                  value={
                    legalInformation.headquartersGeolocation ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${legalInformation.headquartersGeolocation.latitude}&mlon=${legalInformation.headquartersGeolocation.longitude}#map=17/${legalInformation.headquartersGeolocation.latitude}/${legalInformation.headquartersGeolocation.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {legalInformation.headquartersGeolocation.latitude},{" "}
                        {legalInformation.headquartersGeolocation.longitude}
                      </a>
                    ) : null
                  }
                />
              </>
            )}
            {legalInformation &&
              (legalInformation.productionResources?.machineCount !== undefined ||
                legalInformation.productionResources?.machinesDescription ||
                legalInformation.producedProducts ||
                legalInformation.purchasedProducts) && (
                <>
                  <div className="border-t pt-2 text-sm font-medium">
                    {t("details.compliance.technicalTitle")}
                  </div>
                  <Row
                    label={t("details.compliance.machineCount")}
                    value={legalInformation.productionResources?.machineCount}
                  />
                  <Row
                    label={t("details.compliance.machinesDescription")}
                    value={
                      legalInformation.productionResources?.machinesDescription && (
                        <span className="whitespace-pre-line">
                          {legalInformation.productionResources?.machinesDescription}
                        </span>
                      )
                    }
                  />
                  <Row
                    label={t("details.compliance.producedProducts")}
                    value={
                      legalInformation.producedProducts && (
                        <span className="whitespace-pre-line">
                          {legalInformation.producedProducts}
                        </span>
                      )
                    }
                  />
                  <Row
                    label={t("details.compliance.purchasedProducts")}
                    value={
                      legalInformation.purchasedProducts && (
                        <span className="whitespace-pre-line">
                          {legalInformation.purchasedProducts}
                        </span>
                      )
                    }
                  />
                </>
              )}
            {legalInformation?.tradeProducts?.length ? (
              <>
                <div className="border-t pt-2 text-sm font-medium">
                  {t("details.compliance.tradeProducts")}
                </div>
                {legalInformation.tradeProducts.map((product, index) => (
                  <Row
                    key={index}
                    label={product.commercialName}
                    value={[
                      product.industrialName,
                      product.hsCode
                        ? t("details.compliance.hsCode", { code: product.hsCode })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
              </>
            ) : null}
            {legalInformation?.bankDetails && (
              <>
                <div className="border-t pt-2 text-sm font-medium">
                  {t("details.compliance.bank")}
                </div>
                <Row
                  label={t("details.compliance.bank")}
                  value={legalInformation.bankDetails.bankName}
                />
                <Row
                  label={t("details.compliance.bankAddress")}
                  value={legalInformation.bankDetails.bankAddress}
                />
                <Row
                  label={t("details.compliance.paymentAccount")}
                  value={legalInformation.bankDetails.paymentAccount}
                />
              </>
            )}
            {legalInformation?.keyPersons?.length ? (
              <>
                <div className="border-t pt-2 text-sm font-medium">
                  {t("details.compliance.keyPersons")}
                </div>
                {legalInformation.keyPersons.map((person, index) => (
                  <Row
                    key={index}
                    label={
                      person.position ??
                      t("details.compliance.personFallback", {
                        index: index + 1,
                      })
                    }
                    value={[
                      `${person.title ?? ""} ${person.firstName} ${person.lastName}`.trim(),
                      person.mobilePhone,
                      person.email,
                      person.idNumber
                        ? t("details.compliance.idNumber", {
                            number: person.idNumber,
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
              </>
            ) : null}
            {legalInformation?.contacts?.length ? (
              <>
                <div className="border-t pt-2 text-sm font-medium">
                  {t("details.compliance.contacts")}
                </div>
                {legalInformation.contacts.map((contact, index) => (
                  <Row
                    key={index}
                    label={`${contact.title ?? ""} ${contact.fullName}`.trim()}
                    value={[contact.email, contact.mobilePhone, contact.landlinePhone]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
              </>
            ) : null}
            {legalInformation?.complianceDocuments && (
              <>
                <div className="border-t pt-2 text-sm font-medium">
                  {t("details.compliance.complianceDocuments")}
                </div>
                <Row
                  label={t("details.compliance.incorporationDeed")}
                  value={
                    legalInformation.complianceDocuments.incorporationDeedUrl ? (
                      <a
                        href={legalInformation.complianceDocuments.incorporationDeedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {t("details.compliance.viewDocument")}
                      </a>
                    ) : null
                  }
                />
                <Row
                  label={t("details.compliance.passportScan")}
                  value={
                    legalInformation.complianceDocuments.passportScanUrl ? (
                      <a
                        href={legalInformation.complianceDocuments.passportScanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {t("details.compliance.viewDocument")}
                      </a>
                    ) : null
                  }
                />
                <Row
                  label={t("details.compliance.photos")}
                  value={
                    legalInformation.complianceDocuments.photoUrls?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {legalInformation.complianceDocuments.photoUrls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt=""
                              className="size-16 rounded-md object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null
                  }
                />
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

      <BusinessQualityCard businessId={value.id} />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("details.team.title", { count: members.data?.total ?? 0 })}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("details.team.user")}</TableHead>
                <TableHead>{t("details.team.contact")}</TableHead>
                <TableHead>{t("details.team.role")}</TableHead>
                <TableHead>{t("details.team.status")}</TableHead>
                <TableHead>{t("details.team.addedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={5}
                isLoading={members.isLoading}
                error={members.error?.message}
                isEmpty={!members.data?.items.length}
                loadingLabel={t("details.team.loading")}
                emptyLabel={t("details.team.empty")}
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
                    {t(`memberRole.${member.role}`)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`memberStatus.${member.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.createdAt, false, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("details.listings.title", { count: listings.data?.total ?? 0 })}
          </CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/admin/listings")}
            >
              {t("details.listings.viewAll")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("details.listings.titleColumn")}</TableHead>
                <TableHead>{t("details.listings.status")}</TableHead>
                <TableHead>{t("details.listings.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={3}
                isLoading={listings.isLoading}
                error={listings.error?.message}
                isEmpty={!listings.data?.items.length}
                loadingLabel={t("details.listings.loading")}
                emptyLabel={t("details.listings.empty")}
              />
              {listings.data?.items.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>{listing.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{listing.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(listing.createdAt, false, locale)}
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

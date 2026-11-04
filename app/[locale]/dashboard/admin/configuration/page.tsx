"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import {
  ConfigurationDeleteDialog,
  type ConfigurationDeleteTarget,
} from "@/components/admin/configuration-delete-dialog";
import {
  ConfigurationEditor,
  type ConfigurationEditorTarget,
} from "@/components/admin/configuration-editor";
import { QualityThresholdsForm } from "@/components/admin/quality-thresholds-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

function ActiveBadge({ active }: { active: boolean }) {
  const t = useTranslations("adminSettings.common");
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      {active ? t("active") : t("inactive")}
    </Badge>
  );
}

export default function AdminConfigurationPage() {
  const t = useTranslations("adminSettings.configuration");
  const tc = useTranslations("adminSettings.common");
  const locale = useLocale();
  const utils = trpc.useUtils();
  const [editorTarget, setEditorTarget] =
    useState<ConfigurationEditorTarget | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ConfigurationDeleteTarget | null>(null);
  // This screen activates and deactivates these rows, so it asks for all of
  // them; everywhere else the API returns the active ones only.
  const categories = trpc.catalog.categories.useQuery({
    orderBy: "sortOrder",
    order: "asc",
    isActive: "all",
  });
  const subCategories = trpc.catalog.subCategories.useQuery({
    orderBy: "sortOrder",
    order: "asc",
    isActive: "all",
  });
  const countries = trpc.geography.countries.useQuery({
    page: 1,
    limit: 100,
    orderBy: "name",
    order: "asc",
    isActive: "all",
  });
  const cities = trpc.geography.cities.useQuery({
    page: 1,
    limit: 100,
    orderBy: "name",
    order: "asc",
    isActive: "all",
  });

  const refreshConfiguration = async () => {
    await Promise.all([
      utils.catalog.categories.invalidate(),
      utils.catalog.subCategories.invalidate(),
      utils.geography.countries.invalidate(),
      utils.geography.cities.invalidate(),
    ]);
  };

  const categoryNames = new Map(
    categories.data?.map((category) => [category.id, category.name]) ?? [],
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />

      <Tabs defaultValue="categories">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="categories">{t("tabs.categories")}</TabsTrigger>
          <TabsTrigger value="sub-categories">
            {t("tabs.subCategories")}
          </TabsTrigger>
          <TabsTrigger value="countries">{t("tabs.countries")}</TabsTrigger>
          <TabsTrigger value="cities">{t("tabs.cities")}</TabsTrigger>
          <TabsTrigger value="quality">{t("tabs.quality")}</TabsTrigger>
        </TabsList>

        <TabsContent value="quality">
          <QualityThresholdsForm />
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabs.categories")}</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditorTarget({ kind: "category", value: null })
                  }
                >
                  <PlusIcon className="size-4" /> {tc("add")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.code")}</TableHead>
                    <TableHead>{t("columns.name")}</TableHead>
                    <TableHead>{t("columns.slug")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={6}
                    isLoading={categories.isLoading}
                    error={categories.error?.message}
                    isEmpty={!categories.data?.length}
                    loadingLabel={t("loadingCategories")}
                    emptyLabel={t("emptyCategories")}
                  />
                  {categories.data?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {category.code ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell>
                        {category.isService ? t("service") : t("product")}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={category.isActive} />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setEditorTarget({
                                kind: "category",
                                value: category,
                              })
                            }
                          >
                            <PencilIcon className="size-4" />
                            <span className="sr-only">{tc("edit")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "category",
                                id: category.id,
                                label: category.name,
                              })
                            }
                          >
                            <Trash2Icon className="size-4" />
                            <span className="sr-only">{tc("delete")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sub-categories">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabs.subCategories")}</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditorTarget({ kind: "subCategory", value: null })
                  }
                  disabled={!categories.data?.length}
                >
                  <PlusIcon className="size-4" /> {tc("add")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.code")}</TableHead>
                    <TableHead>{t("columns.name")}</TableHead>
                    <TableHead>{t("columns.category")}</TableHead>
                    <TableHead>{t("columns.slug")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={7}
                    isLoading={subCategories.isLoading}
                    error={subCategories.error?.message}
                    isEmpty={!subCategories.data?.length}
                    loadingLabel={t("loadingSubCategories")}
                    emptyLabel={t("emptySubCategories")}
                  />
                  {subCategories.data?.map((subCategory) => (
                    <TableRow key={subCategory.id}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {subCategory.code ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {subCategory.name}
                      </TableCell>
                      <TableCell>
                        {categoryNames.get(subCategory.categoryId) ??
                          subCategory.categoryId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subCategory.slug}
                      </TableCell>
                      <TableCell>
                        {subCategory.isService ? t("service") : t("product")}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={subCategory.isActive} />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setEditorTarget({
                                kind: "subCategory",
                                value: subCategory,
                              })
                            }
                          >
                            <PencilIcon className="size-4" />
                            <span className="sr-only">{tc("edit")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "subCategory",
                                id: subCategory.id,
                                label: subCategory.name,
                              })
                            }
                          >
                            <Trash2Icon className="size-4" />
                            <span className="sr-only">{tc("delete")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabs.countries")}</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditorTarget({ kind: "country", value: null })
                  }
                >
                  <PlusIcon className="size-4" /> {tc("add")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.country")}</TableHead>
                    <TableHead>{t("columns.code")}</TableHead>
                    <TableHead>{t("columns.currency")}</TableHead>
                    <TableHead>{t("columns.phonePrefix")}</TableHead>
                    <TableHead>{t("columns.oapi")}</TableHead>
                    <TableHead>{t("columns.phase")}</TableHead>
                    <TableHead>{t("columns.suppliers")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={9}
                    isLoading={countries.isLoading}
                    error={countries.error?.message}
                    isEmpty={!countries.data?.items.length}
                    loadingLabel={t("loadingCountries")}
                    emptyLabel={t("emptyCountries")}
                  />
                  {countries.data?.items.map((country) => (
                    <TableRow key={country.code}>
                      <TableCell className="font-medium">
                        {country.name}
                      </TableCell>
                      <TableCell>{country.code}</TableCell>
                      <TableCell>{country.currencyCode}</TableCell>
                      <TableCell>{country.phonePrefix}</TableCell>
                      <TableCell>{country.isOapi ? tc("yes") : tc("no")}</TableCell>
                      <TableCell>{country.deploymentPhase ?? "-"}</TableCell>
                      <TableCell>
                        {country.supplierRegistrationOpen
                          ? t("registrationOpen")
                          : t("closed")}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={country.isActive} />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setEditorTarget({
                                kind: "country",
                                value: country,
                              })
                            }
                          >
                            <PencilIcon className="size-4" />
                            <span className="sr-only">{tc("edit")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "country",
                                code: country.code,
                                label: country.name,
                              })
                            }
                          >
                            <Trash2Icon className="size-4" />
                            <span className="sr-only">{tc("delete")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabs.cities")}</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() => setEditorTarget({ kind: "city", value: null })}
                  disabled={!countries.data?.items.length}
                >
                  <PlusIcon className="size-4" /> {tc("add")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.city")}</TableHead>
                    <TableHead>{t("columns.slug")}</TableHead>
                    <TableHead>{t("columns.country")}</TableHead>
                    <TableHead>{t("columns.createdAt")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={6}
                    isLoading={cities.isLoading}
                    error={cities.error?.message}
                    isEmpty={!cities.data?.items.length}
                    loadingLabel={t("loadingCities")}
                    emptyLabel={t("emptyCities")}
                  />
                  {cities.data?.items.map((city) => (
                    <TableRow key={`${city.countryCode}-${city.slug}`}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {city.slug}
                      </TableCell>
                      <TableCell>{city.countryCode}</TableCell>
                      <TableCell>{formatDate(city.createdAt, false, locale)}</TableCell>
                      <TableCell>
                        <ActiveBadge active={city.isActive} />
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setEditorTarget({ kind: "city", value: city })
                            }
                          >
                            <PencilIcon className="size-4" />
                            <span className="sr-only">{tc("edit")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hover:text-destructive"
                            onClick={() =>
                              setDeleteTarget({
                                kind: "city",
                                slug: city.slug,
                                label: city.name,
                              })
                            }
                          >
                            <Trash2Icon className="size-4" />
                            <span className="sr-only">{tc("delete")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editorTarget && (
        <ConfigurationEditor
          target={editorTarget}
          categories={categories.data ?? []}
          countries={countries.data?.items ?? []}
          onClose={() => setEditorTarget(null)}
          onSaved={refreshConfiguration}
        />
      )}
      {deleteTarget && (
        <ConfigurationDeleteDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refreshConfiguration}
        />
      )}
    </div>
  );
}

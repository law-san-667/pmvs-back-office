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
import { useState } from "react";

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }
    >
      {active ? "Actif" : "Inactif"}
    </Badge>
  );
}

export default function AdminConfigurationPage() {
  const utils = trpc.useUtils();
  const [editorTarget, setEditorTarget] =
    useState<ConfigurationEditorTarget | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ConfigurationDeleteTarget | null>(null);
  const categories = trpc.catalog.categories.useQuery({
    orderBy: "sortOrder",
    order: "asc",
  });
  const subCategories = trpc.catalog.subCategories.useQuery({
    orderBy: "sortOrder",
    order: "asc",
  });
  const countries = trpc.geography.countries.useQuery({
    page: 1,
    limit: 100,
    orderBy: "name",
    order: "asc",
  });
  const cities = trpc.geography.cities.useQuery({
    page: 1,
    limit: 100,
    orderBy: "name",
    order: "asc",
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
        title="Configuration"
        description="Créez et gérez les catégories du catalogue ainsi que les zones géographiques."
      />

      <Tabs defaultValue="categories">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="sub-categories">Sous-catégories</TabsTrigger>
          <TabsTrigger value="countries">Pays</TabsTrigger>
          <TabsTrigger value="cities">Villes</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditorTarget({ kind: "category", value: null })
                  }
                >
                  <PlusIcon className="size-4" /> Ajouter
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={5}
                    isLoading={categories.isLoading}
                    error={categories.error?.message}
                    isEmpty={!categories.data?.length}
                    loadingLabel="Chargement des catégories..."
                    emptyLabel="Aucune catégorie configurée."
                  />
                  {categories.data?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell>
                        {category.isService ? "Service" : "Produit"}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={category.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
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
                            <span className="sr-only">Modifier</span>
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
                            <span className="sr-only">Supprimer</span>
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
              <CardTitle>Sous-catégories</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditorTarget({ kind: "subCategory", value: null })
                  }
                  disabled={!categories.data?.length}
                >
                  <PlusIcon className="size-4" /> Ajouter
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={6}
                    isLoading={subCategories.isLoading}
                    error={subCategories.error?.message}
                    isEmpty={!subCategories.data?.length}
                    loadingLabel="Chargement des sous-catégories..."
                    emptyLabel="Aucune sous-catégorie configurée."
                  />
                  {subCategories.data?.map((subCategory) => (
                    <TableRow key={subCategory.id}>
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
                        {subCategory.isService ? "Service" : "Produit"}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge active={subCategory.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
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
                            <span className="sr-only">Modifier</span>
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
                            <span className="sr-only">Supprimer</span>
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
              <CardTitle>Pays</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditorTarget({ kind: "country", value: null })
                  }
                >
                  <PlusIcon className="size-4" /> Ajouter
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Indicatif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={6}
                    isLoading={countries.isLoading}
                    error={countries.error?.message}
                    isEmpty={!countries.data?.items.length}
                    loadingLabel="Chargement des pays..."
                    emptyLabel="Aucun pays configuré."
                  />
                  {countries.data?.items.map((country) => (
                    <TableRow key={country.code}>
                      <TableCell className="font-medium">
                        {country.name}
                      </TableCell>
                      <TableCell>{country.code}</TableCell>
                      <TableCell>{country.currencyCode}</TableCell>
                      <TableCell>{country.phonePrefix}</TableCell>
                      <TableCell>
                        <ActiveBadge active={country.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
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
                            <span className="sr-only">Modifier</span>
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
                            <span className="sr-only">Supprimer</span>
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
              <CardTitle>Villes</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  onClick={() => setEditorTarget({ kind: "city", value: null })}
                  disabled={!countries.data?.items.length}
                >
                  <PlusIcon className="size-4" /> Ajouter
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ville</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={6}
                    isLoading={cities.isLoading}
                    error={cities.error?.message}
                    isEmpty={!cities.data?.items.length}
                    loadingLabel="Chargement des villes..."
                    emptyLabel="Aucune ville configurée."
                  />
                  {cities.data?.items.map((city) => (
                    <TableRow key={`${city.countryCode}-${city.slug}`}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {city.slug}
                      </TableCell>
                      <TableCell>{city.countryCode}</TableCell>
                      <TableCell>{formatDate(city.createdAt)}</TableCell>
                      <TableCell>
                        <ActiveBadge active={city.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setEditorTarget({ kind: "city", value: city })
                            }
                          >
                            <PencilIcon className="size-4" />
                            <span className="sr-only">Modifier</span>
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
                            <span className="sr-only">Supprimer</span>
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

"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Configuration"
        description="Consultez les catégories du catalogue et les zones géographiques disponibles."
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
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Statut</TableHead>
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
                      <TableCell>{category.sortOrder}</TableCell>
                      <TableCell>
                        <ActiveBadge active={category.isActive} />
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
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={5}
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
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {subCategory.categoryId.slice(0, 8)}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries">
          <Card>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Indicatif</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={5}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities">
          <Card>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ville</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AdminTableState
                    colSpan={5}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

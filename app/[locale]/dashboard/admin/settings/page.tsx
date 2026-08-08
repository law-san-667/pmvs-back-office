"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/user-context";
import { getInitials } from "@/lib/seller-dashboard-utils";

export default function AdminSettingsPage() {
  const { user } = useUser();
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Paramètres"
        description="Informations du compte administrateur actuellement connecté."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Compte administrateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-bold">{name}</p>
              <Badge variant="outline">Administrateur</Badge>
            </div>
          </div>
          <Separator />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs">Email</dt>
              <dd className="font-medium">{user?.email ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Téléphone</dt>
              <dd className="font-medium">
                {user?.phoneNumber ?? "Non renseigné"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Statut</dt>
              <dd className="font-medium">{user?.status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Identifiant</dt>
              <dd className="font-mono text-xs">{user?.id ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTableState } from "@/components/admin/admin-table-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/seller-dashboard-utils";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";

/**
 * Operators act for the shops assigned here (catalogue, orders, payouts of
 * those shops only). Every assignment change is kept in the audit log.
 */
export default function AdminOperatorsPage() {
  const utils = trpc.useUtils();
  const [operatorUserId, setOperatorUserId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [notes, setNotes] = useState("");

  const operators = trpc.admin.admins.useQuery({
    page: 1,
    limit: 100,
    role: "OPERATOR",
    status: "ACTIVE",
  });
  const shops = trpc.operators.searchBusinesses.useQuery({
    name: shopSearch.trim() || undefined,
  });
  const assignments = trpc.operators.assignments.useQuery();
  const assign = trpc.operators.assign.useMutation();
  const setActive = trpc.operators.setActive.useMutation();

  const submit = async () => {
    try {
      await assign.mutateAsync({
        operatorUserId,
        businessId,
        notes: notes.trim() || null,
      });
      toast.success("Boutique affectée.");
      setBusinessId("");
      setNotes("");
      await utils.operators.assignments.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "L’affectation a échoué.",
      );
    }
  };

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await setActive.mutateAsync({ id, isActive });
      toast.success(
        isActive ? "Affectation reprise." : "Affectation terminée.",
      );
      await utils.operators.assignments.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "La mise à jour a échoué.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <AdminPageHeader
        title="Opérateurs"
        description="Affectez des boutiques aux opérateurs : ils gèrent le catalogue, les commandes et les versements de ces boutiques uniquement."
      />

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle affectation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="operator">Opérateur</FieldLabel>
            <select
              id="operator"
              value={operatorUserId}
              onChange={(event) => setOperatorUserId(event.target.value)}
              className={selectClass}
            >
              <option value="">
                {operators.data?.items.length
                  ? "Choisir un opérateur"
                  : "Aucun compte opérateur actif"}
              </option>
              {operators.data?.items.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.firstName} {operator.lastName}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="shop-search">Boutique</FieldLabel>
            <Input
              id="shop-search"
              value={shopSearch}
              onChange={(event) => setShopSearch(event.target.value)}
              placeholder="Rechercher par nom…"
            />
            <select
              aria-label="Boutique"
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
              className={selectClass}
            >
              <option value="">Choisir une boutique</option>
              {shops.data?.items.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="notes">Note (facultative)</FieldLabel>
            <Input
              id="notes"
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex. accompagnement à la mise en ligne"
            />
          </Field>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!operatorUserId || !businessId || assign.isPending}
              onClick={() => void submit()}
            >
              {assign.isPending ? "Affectation…" : "Affecter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affectations ({assignments.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opérateur</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Depuis le</TableHead>
                <TableHead>État</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminTableState
                colSpan={6}
                isLoading={assignments.isLoading}
                error={assignments.error?.message}
                isEmpty={!assignments.data?.length}
                loadingLabel="Chargement des affectations..."
                emptyLabel="Aucune boutique n’est encore affectée."
              />
              {assignments.data?.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    {assignment.operator
                      ? `${assignment.operator.firstName} ${assignment.operator.lastName}`
                      : "—"}
                  </TableCell>
                  <TableCell>{assignment.business?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-64 truncate">
                    {assignment.notes ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(assignment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        assignment.isActive
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }
                    >
                      {assignment.isActive ? "Active" : "Terminée"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={setActive.isPending}
                      onClick={() =>
                        void toggle(assignment.id, !assignment.isActive)
                      }
                    >
                      {assignment.isActive ? "Terminer" : "Reprendre"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BannedTerm } from "@/lib/compliance";
import { trpc } from "@/server/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

export function TermsEditor({ canEdit }: { canEdit: boolean }) {
  const utils = trpc.useUtils();
  const terms = trpc.compliance.terms.useQuery();
  const add = trpc.compliance.addTerm.useMutation();
  const update = trpc.compliance.updateTerm.useMutation();
  const remove = trpc.compliance.removeTerm.useMutation();
  const [term, setTerm] = useState("");
  const [action, setAction] = useState<BannedTerm["action"]>("BLOCK");
  const [reason, setReason] = useState("");

  const guarded = async (work: () => Promise<unknown>) => {
    try {
      await work();
      await utils.compliance.terms.invalidate();
      await utils.compliance.overview.invalidate();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
      return false;
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (await guarded(() => add.mutateAsync({ term, action, reason: reason || null }))) {
      setTerm("");
      setReason("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Termes interdits ({terms.data?.length ?? 0})</CardTitle>
        <CardDescription>
          Recherchés en mots entiers dans le titre et la description des annonces,
          sans tenir compte des majuscules ni des accents (« arme » ne touche pas
          « charme »). « Refusé » empêche l&apos;enregistrement ; « À surveiller »
          laisse passer et signale l&apos;annonce à l&apos;équipe. Le contrôle du
          matin vérifie aussi les annonces déjà en ligne.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canEdit && (
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <Input aria-label="Terme" required minLength={2} maxLength={80} placeholder="Terme ou expression" value={term} onChange={(event) => setTerm(event.target.value)} className="w-56" />
            <select aria-label="Action" value={action} onChange={(event) => setAction(event.target.value as BannedTerm["action"])} className="border-input bg-background h-9 rounded-md border px-2 text-sm">
              <option value="BLOCK">Refusé</option>
              <option value="REVIEW">À surveiller</option>
            </select>
            <Input aria-label="Motif" maxLength={200} placeholder="Motif (facultatif)" value={reason} onChange={(event) => setReason(event.target.value)} className="w-64" />
            <Button type="submit" disabled={add.isPending}>Ajouter</Button>
          </form>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Terme</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.data?.map((row) => (
              <TableRow key={row.id} className={row.isActive ? "" : "opacity-50"}>
                <TableCell className="font-medium">{row.term}</TableCell>
                <TableCell>
                  {row.action === "BLOCK" ? <Badge variant="destructive">Refusé</Badge> : <Badge variant="secondary">À surveiller</Badge>}
                </TableCell>
                <TableCell className="whitespace-normal">{row.reason ?? "—"}</TableCell>
                <TableCell className="text-end whitespace-nowrap">
                  {canEdit && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => guarded(() => update.mutateAsync({ id: row.id, isActive: !row.isActive }))}>
                        {row.isActive ? "Suspendre" : "Réactiver"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => guarded(() => remove.mutateAsync({ id: row.id }))}>Supprimer</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {terms.data && !terms.data.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">Aucun terme pour l&apos;instant.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

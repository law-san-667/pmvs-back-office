"use client";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AuditEntry, formatDateTime } from "@/lib/compliance";
import { trpc } from "@/server/trpc/client";
import { DownloadIcon } from "lucide-react";
import { Fragment, useDeferredValue, useState } from "react";

const dayStart = (day: string) => (day ? new Date(`${day}T00:00:00Z`).toISOString() : undefined);
const dayEnd = (day: string) => (day ? new Date(`${day}T23:59:59Z`).toISOString() : undefined);

function Values({ entry }: { entry: AuditEntry }) {
  return (
    <div className="grid gap-2 text-xs md:grid-cols-2">
      <div className="min-w-0">
        <p className="font-medium">Avant</p>
        <pre className="bg-muted overflow-x-auto rounded p-2">{JSON.stringify(entry.oldValues, null, 2) ?? "—"}</pre>
      </div>
      <div className="min-w-0">
        <p className="font-medium">Après</p>
        <pre className="bg-muted overflow-x-auto rounded p-2">{JSON.stringify(entry.newValues, null, 2) ?? "—"}</pre>
      </div>
      <p className="text-muted-foreground break-all md:col-span-2">
        {entry.entityId ?? "—"} · {entry.userAgent ?? "agent inconnu"}
      </p>
    </div>
  );
}

export function AuditJournal() {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search.trim());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const filters = {
    search: deferred || undefined,
    from: dayStart(from),
    to: dayEnd(to),
  };
  const audit = trpc.compliance.audit.useQuery(
    { ...filters, page, limit: 25 },
    { placeholderData: (previous) => previous },
  );
  const exportParams = new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal d&apos;audit ({audit.data?.total ?? 0})</CardTitle>
        <CardDescription>
          Qui a fait quoi, quand et depuis où : actions financières, modération,
          catalogue, réglages. Cliquez sur une ligne pour voir les valeurs avant
          et après. L&apos;export est limité à 10 000 lignes et lui-même journalisé.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Rechercher"
            placeholder="Action, e-mail, boutique, adresse IP…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-72"
          />
          <Input aria-label="Du" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="w-40" />
          <Input aria-label="Au" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="w-40" />
          <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/api/audit-export?${exportParams}`} />}>
            <DownloadIcon />
            Exporter en CSV
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Boutique</TableHead>
              <TableHead>Adresse IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.data?.items.map((entry) => (
              <Fragment key={entry.id}>
                <TableRow className="cursor-pointer" onClick={() => setOpen(open === entry.id ? null : entry.id)}>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="font-medium break-all">{entry.action}</p>
                    <p className="text-muted-foreground text-xs">{entry.entityType}</p>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {entry.userName ?? "Système"}
                    {entry.userEmail && <p className="text-muted-foreground text-xs break-all">{entry.userEmail}</p>}
                  </TableCell>
                  <TableCell>{entry.businessName ?? "—"}</TableCell>
                  <TableCell>{entry.ipAddress ?? "—"}</TableCell>
                </TableRow>
                {open === entry.id && (
                  <TableRow>
                    <TableCell colSpan={5} className="whitespace-normal"><Values entry={entry} /></TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {audit.data && !audit.data.items.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">Aucune entrée.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {(audit.data?.totalPages ?? 0) > 1 && (
          <AdminPagination page={page} totalPages={audit.data?.totalPages ?? 1} onPageChange={setPage} />
        )}
      </CardContent>
    </Card>
  );
}

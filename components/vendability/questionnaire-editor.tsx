"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type Question,
  type QuestionnaireVersion,
  VERSION_STATUS_LABELS,
} from "@/lib/vendability";
import { trpc } from "@/server/trpc/client";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const newId = () => crypto.randomUUID();
const newQuestion = (): Question => ({
  id: newId(),
  label: "",
  type: "CHOICE",
  required: true,
  weight: 1,
  options: [
    { id: newId(), label: "Oui", points: 100 },
    { id: newId(), label: "Non", points: 0 },
  ],
});

function DraftEditor({ draft, onDone }: { draft: QuestionnaireVersion; onDone: () => Promise<unknown> }) {
  const [title, setTitle] = useState(draft.title);
  const [questions, setQuestions] = useState<Question[]>(draft.questions);
  const [confirming, setConfirming] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fail = { onError: (error: { message: string }) => toast.error(error.message) };
  const save = trpc.vendability.updateDraft.useMutation(fail);
  const publish = trpc.vendability.publishDraft.useMutation(fail);
  const remove = trpc.vendability.deleteDraft.useMutation(fail);

  const change = (next: Question[]) => {
    setQuestions(next);
    setDirty(true);
  };
  const patch = (index: number, value: Partial<Question>) =>
    change(questions.map((item, at) => (at === index ? { ...item, ...value } : item)));
  const move = (index: number, by: number) => {
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item!);
    change(next);
  };
  const persist = () => save.mutateAsync({ id: draft.id, title, questions });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version {draft.version} en préparation</CardTitle>
        <CardDescription>
          Invisible des fournisseurs tant qu&apos;elle n&apos;est pas publiée. Une fois publiée, elle ne se
          modifie plus.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q-title">Titre</Label>
          <Input
            id="q-title"
            value={title}
            maxLength={200}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
          />
        </div>
        {questions.map((question, index) => (
          <div key={question.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Question {index + 1}</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" aria-label={`Monter la question ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUpIcon />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label={`Descendre la question ${index + 1}`} disabled={index === questions.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDownIcon />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label={`Retirer la question ${index + 1}`} onClick={() => change(questions.filter((_, at) => at !== index))}>
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <Input
              aria-label={`Intitulé de la question ${index + 1}`}
              placeholder="Intitulé de la question"
              value={question.label}
              maxLength={500}
              onChange={(event) => patch(index, { label: event.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`q-type-${question.id}`}>Type</Label>
                <select
                  id={`q-type-${question.id}`}
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                  value={question.type}
                  onChange={(event) => {
                    const type = event.target.value as Question["type"];
                    patch(index, { type, options: type === "TEXT" ? [] : newQuestion().options });
                  }}
                >
                  <option value="CHOICE">Choix (noté)</option>
                  <option value="TEXT">Texte libre (non noté)</option>
                </select>
              </div>
              {question.type === "CHOICE" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`q-weight-${question.id}`}>Poids dans le résultat</Label>
                  <Input
                    id={`q-weight-${question.id}`}
                    type="number"
                    min={0}
                    max={100}
                    value={question.weight}
                    onChange={(event) => patch(index, { weight: Number(event.target.value) })}
                  />
                </div>
              )}
              <Label className="font-normal sm:self-end sm:pb-2">
                <Checkbox
                  checked={question.required}
                  onCheckedChange={(checked) => patch(index, { required: Boolean(checked) })}
                />
                Obligatoire
              </Label>
            </div>
            {question.type === "CHOICE" && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">Réponses proposées et points (0 à 100)</span>
                {question.options.map((option, optionIndex) => {
                  const setOption = (value: Partial<typeof option>) =>
                    patch(index, {
                      options: question.options.map((item, at) => (at === optionIndex ? { ...item, ...value } : item)),
                    });
                  return (
                    <div key={option.id} className="flex items-center gap-2">
                      <Input
                        aria-label={`Réponse ${optionIndex + 1} de la question ${index + 1}`}
                        value={option.label}
                        maxLength={200}
                        onChange={(event) => setOption({ label: event.target.value })}
                      />
                      <Input
                        aria-label={`Points de la réponse ${optionIndex + 1} de la question ${index + 1}`}
                        type="number"
                        min={0}
                        max={100}
                        className="w-20"
                        value={option.points}
                        onChange={(event) => setOption({ points: Number(event.target.value) })}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Retirer la réponse ${optionIndex + 1} de la question ${index + 1}`}
                        disabled={question.options.length <= 2}
                        onClick={() => patch(index, { options: question.options.filter((_, at) => at !== optionIndex) })}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  );
                })}
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => patch(index, { options: [...question.options, { id: newId(), label: "", points: 0 }] })}
                  >
                    <PlusIcon />
                    Ajouter une réponse
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div>
          <Button type="button" variant="outline" onClick={() => change([...questions, newQuestion()])}>
            <PlusIcon />
            Ajouter une question
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button
            disabled={!dirty || save.isPending}
            onClick={() =>
              void persist()
                .then(() => {
                  setDirty(false);
                  toast.success("Brouillon enregistré.");
                })
                .catch(() => undefined)
            }
          >
            Enregistrer le brouillon
          </Button>
          <Button variant="outline" disabled={!questions.length} onClick={() => setConfirming(true)}>
            Publier
          </Button>
          <Button
            variant="ghost"
            disabled={remove.isPending}
            onClick={() =>
              void remove
                .mutateAsync({ id: draft.id })
                .then(async () => {
                  await onDone();
                  toast.success("Brouillon supprimé.");
                })
                .catch(() => undefined)
            }
          >
            Abandonner ce brouillon
          </Button>
        </div>
      </CardContent>
      {confirming && (
        <AlertDialog open onOpenChange={(open) => !open && setConfirming(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publier la version {draft.version} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Elle remplace la version en vigueur et ne pourra plus être modifiée. Tous les fournisseurs
                actifs seront invités à y répondre.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={publish.isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={publish.isPending}
                onClick={async (event) => {
                  event.preventDefault();
                  try {
                    await persist();
                    await publish.mutateAsync({ id: draft.id });
                    await onDone();
                    toast.success("Version publiée.");
                  } catch {
                    setConfirming(false);
                  }
                }}
              >
                Publier
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

function VersionResponses({ version }: { version: QuestionnaireVersion }) {
  const responses = trpc.vendability.responses.useQuery({ id: version.id, page: 1, limit: 50 });
  const answerText = (question: Question, answer?: string) =>
    (question.type === "TEXT" ? answer : question.options.find((option) => option.id === answer)?.label) ?? "-";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Réponses à la version {version.version}</CardTitle>
        <CardDescription>
          {responses.data ? `${responses.data.total} fournisseur(s) ont répondu.` : "Chargement..."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {responses.error && <p className="text-destructive text-sm">{responses.error.message}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boutique</TableHead>
              <TableHead className="text-end">Résultat</TableHead>
              {version.questions.map((question) => (
                <TableHead key={question.id} className="max-w-48 whitespace-normal">
                  {question.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.data?.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.businessName}</TableCell>
                <TableCell className="text-end tabular-nums">{row.score ?? "-"}</TableCell>
                {version.questions.map((question) => (
                  <TableCell key={question.id} className="max-w-48 whitespace-normal">
                    {answerText(question, row.answers[question.id])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Versions of the questionnaire: prepare, publish, read the answers. */
export function QuestionnaireEditor() {
  const utils = trpc.useUtils();
  const versions = trpc.vendability.versions.useQuery();
  const create = trpc.vendability.createDraft.useMutation({
    onSuccess: () => utils.vendability.versions.invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const [selected, setSelected] = useState<string | null>(null);

  if (versions.error) return <p className="text-destructive text-sm">{versions.error.message}</p>;
  if (!versions.data) return <p className="text-muted-foreground text-sm">Chargement...</p>;
  const draft = versions.data.find((version) => version.status === "DRAFT");
  const shown =
    versions.data.find((version) => version.id === selected && version.status !== "DRAFT") ??
    versions.data.find((version) => version.status === "PUBLISHED");

  return (
    <div className="flex flex-col gap-6">
      {draft ? (
        <DraftEditor
          key={draft.id}
          draft={draft}
          onDone={() => utils.vendability.versions.invalidate()}
        />
      ) : (
        <div>
          <Button disabled={create.isPending} onClick={() => create.mutate()}>
            <PlusIcon />
            Préparer une nouvelle version
          </Button>
        </div>
      )}
      {versions.data.some((version) => version.status !== "DRAFT") && (
        <Card>
          <CardHeader>
            <CardTitle>Versions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {versions.data
              .filter((version) => version.status !== "DRAFT")
              .map((version) => (
                <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-sm">
                    <span className="font-medium">Version {version.version}</span> : {version.title},{" "}
                    {version.questions.length} question(s)
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={version.status === "PUBLISHED" ? "default" : "secondary"}>
                      {VERSION_STATUS_LABELS[version.status]}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(version.id)}>
                      Voir les réponses
                    </Button>
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
      {shown && <VersionResponses key={shown.id} version={shown} />}
    </div>
  );
}

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
} from "@/lib/vendability";
import { trpc } from "@/server/trpc/client";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const newId = () => crypto.randomUUID();
const newQuestion = (yes: string, no: string): Question => ({
  id: newId(),
  label: "",
  type: "CHOICE",
  required: true,
  weight: 1,
  options: [
    { id: newId(), label: yes, points: 100 },
    { id: newId(), label: no, points: 0 },
  ],
});

function DraftEditor({ draft, onDone }: { draft: QuestionnaireVersion; onDone: () => Promise<unknown> }) {
  const t = useTranslations("adminSystem.vendabilityQuestionnaire");
  const defaultQuestion = () => newQuestion(t("yes"), t("no"));
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
        <CardTitle>{t("draftTitle", { version: draft.version })}</CardTitle>
        <CardDescription>
          {t("draftDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="q-title">{t("title")}</Label>
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
              <span className="text-sm font-medium">{t("question", { number: index + 1 })}</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" aria-label={t("moveUp", { number: index + 1 })} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUpIcon />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label={t("moveDown", { number: index + 1 })} disabled={index === questions.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDownIcon />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label={t("removeQuestion", { number: index + 1 })} onClick={() => change(questions.filter((_, at) => at !== index))}>
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <Input
              aria-label={t("questionLabelAria", { number: index + 1 })}
              placeholder={t("questionLabel")}
              value={question.label}
              maxLength={500}
              onChange={(event) => patch(index, { label: event.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`q-type-${question.id}`}>{t("type")}</Label>
                <select
                  id={`q-type-${question.id}`}
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                  value={question.type}
                  onChange={(event) => {
                    const type = event.target.value as Question["type"];
                    patch(index, { type, options: type === "TEXT" ? [] : defaultQuestion().options });
                  }}
                >
                  <option value="CHOICE">{t("typeChoice")}</option>
                  <option value="TEXT">{t("typeText")}</option>
                </select>
              </div>
              {question.type === "CHOICE" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`q-weight-${question.id}`}>{t("weight")}</Label>
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
                {t("required")}
              </Label>
            </div>
            {question.type === "CHOICE" && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">{t("options")}</span>
                {question.options.map((option, optionIndex) => {
                  const setOption = (value: Partial<typeof option>) =>
                    patch(index, {
                      options: question.options.map((item, at) => (at === optionIndex ? { ...item, ...value } : item)),
                    });
                  return (
                    <div key={option.id} className="flex items-center gap-2">
                      <Input
                        aria-label={t("optionAria", { option: optionIndex + 1, number: index + 1 })}
                        value={option.label}
                        maxLength={200}
                        onChange={(event) => setOption({ label: event.target.value })}
                      />
                      <Input
                        aria-label={t("optionPointsAria", { option: optionIndex + 1, number: index + 1 })}
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
                        aria-label={t("removeOptionAria", { option: optionIndex + 1, number: index + 1 })}
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
                    {t("addOption")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div>
          <Button type="button" variant="outline" onClick={() => change([...questions, defaultQuestion()])}>
            <PlusIcon />
            {t("addQuestion")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button
            disabled={!dirty || save.isPending}
            onClick={() =>
              void persist()
                .then(() => {
                  setDirty(false);
                  toast.success(t("draftSaved"));
                })
                .catch(() => undefined)
            }
          >
            {t("saveDraft")}
          </Button>
          <Button variant="outline" disabled={!questions.length} onClick={() => setConfirming(true)}>
            {t("publish")}
          </Button>
          <Button
            variant="ghost"
            disabled={remove.isPending}
            onClick={() =>
              void remove
                .mutateAsync({ id: draft.id })
                .then(async () => {
                  await onDone();
                  toast.success(t("draftDeleted"));
                })
                .catch(() => undefined)
            }
          >
            {t("discardDraft")}
          </Button>
        </div>
      </CardContent>
      {confirming && (
        <AlertDialog open onOpenChange={(open) => !open && setConfirming(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("publishTitle", { version: draft.version })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("publishDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={publish.isPending}>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                disabled={publish.isPending}
                onClick={async (event) => {
                  event.preventDefault();
                  try {
                    await persist();
                    await publish.mutateAsync({ id: draft.id });
                    await onDone();
                    toast.success(t("published"));
                  } catch {
                    setConfirming(false);
                  }
                }}
              >
                {t("publish")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

function VersionResponses({ version }: { version: QuestionnaireVersion }) {
  const t = useTranslations("adminSystem.vendabilityQuestionnaire");
  const responses = trpc.vendability.responses.useQuery({ id: version.id, page: 1, limit: 50 });
  const answerText = (question: Question, answer?: string) =>
    (question.type === "TEXT" ? answer : question.options.find((option) => option.id === answer)?.label) ?? "-";
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("responsesTitle", { version: version.version })}</CardTitle>
        <CardDescription>
          {responses.data ? t("responsesCount", { count: responses.data.total }) : t("loading")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {responses.error && <p className="text-destructive text-sm">{responses.error.message}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("shop")}</TableHead>
              <TableHead className="text-end">{t("score")}</TableHead>
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
  const t = useTranslations("adminSystem.vendabilityQuestionnaire");
  const utils = trpc.useUtils();
  const versions = trpc.vendability.versions.useQuery();
  const create = trpc.vendability.createDraft.useMutation({
    onSuccess: () => utils.vendability.versions.invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const [selected, setSelected] = useState<string | null>(null);

  if (versions.error) return <p className="text-destructive text-sm">{versions.error.message}</p>;
  if (!versions.data) return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
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
            {t("newVersion")}
          </Button>
        </div>
      )}
      {versions.data.some((version) => version.status !== "DRAFT") && (
        <Card>
          <CardHeader>
            <CardTitle>{t("versions")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {versions.data
              .filter((version) => version.status !== "DRAFT")
              .map((version) => (
                <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-sm">
                    {t.rich("versionLine", {
                      version: version.version,
                      title: version.title,
                      count: version.questions.length,
                      b: (chunks) => <span className="font-medium">{chunks}</span>,
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={version.status === "PUBLISHED" ? "default" : "secondary"}>
                      {t(`status.${version.status}`)}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(version.id)}>
                      {t("viewResponses")}
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

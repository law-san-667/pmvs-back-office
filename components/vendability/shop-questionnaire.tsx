"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/** The shop's form: the version in force, prefilled with its latest answers. */
export function ShopQuestionnaireForm({ businessId }: { businessId: string }) {
  const t = useTranslations("vendability.questionnaire");
  const utils = trpc.useUtils();
  const query = trpc.vendability.shopQuestionnaire.useQuery({ businessId });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const submit = trpc.vendability.submitAnswers.useMutation({
    onSuccess: async () => {
      setEdits({});
      await Promise.all([
        utils.vendability.shopQuestionnaire.invalidate({ businessId }),
        utils.vendability.shopTop.invalidate({ businessId }),
      ]);
      toast.success(t("saved"));
    },
    onError: (error) => toast.error(error.message),
  });

  if (query.error) return <p className="text-destructive text-sm">{query.error.message}</p>;
  if (!query.data) return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  const { questionnaire, response, upToDate } = query.data;
  if (!questionnaire) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("none")}
      </p>
    );
  }
  const answers = { ...(response?.answers ?? {}), ...edits };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{questionnaire.title}</CardTitle>
        <CardDescription>
          {t("version", { version: questionnaire.version })}{" "}
          {upToDate
            ? response?.score != null
              ? t("upToDateScore", { score: response.score })
              : t("upToDate")
            : response
              ? t("newVersion", { version: response.version })
              : t("notAnswered")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate({ businessId, answers });
          }}
        >
          {questionnaire.questions.map((question, index) => (
            <fieldset key={question.id} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">
                {index + 1}. {question.label}
                {!question.required && (
                  <span className="text-muted-foreground font-normal"> {t("optional")}</span>
                )}
              </legend>
              {question.help && <p className="text-muted-foreground text-xs">{question.help}</p>}
              {question.type === "TEXT" ? (
                <Textarea
                  aria-label={question.label}
                  value={answers[question.id] ?? ""}
                  maxLength={2000}
                  onChange={(event) => setEdits({ ...edits, [question.id]: event.target.value })}
                />
              ) : (
                question.options.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={question.id}
                      className="accent-primary size-4"
                      checked={answers[question.id] === option.id}
                      onChange={() => setEdits({ ...edits, [question.id]: option.id })}
                    />
                    {option.label}
                  </label>
                ))
              )}
            </fieldset>
          ))}
          <div>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? t("saving") : t("submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

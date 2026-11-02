"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import type { TrainingLevel } from "@/lib/training";
import { trpc } from "@/server/trpc/client";
import { useTranslations } from "next-intl";

const LEVELS: TrainingLevel[] = ["BEGINNER", "ADVANCED"];

export default function TrainingPage() {
  const t = useTranslations("training");
  const courses = trpc.training.courses.useQuery();

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("intro")}</p>
      </div>
      {courses.error && <p className="text-destructive text-sm">{courses.error.message}</p>}
      {courses.data && !courses.data.length && (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
      {LEVELS.map((level) => {
        const items = courses.data?.filter((course) => course.level === level) ?? [];
        if (!items.length) return null;
        return (
          <section key={level} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(`level.${level}`)}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((course) => {
                const done = course.lessonCount && course.completedCount === course.lessonCount;
                return (
                  <Link key={course.id} href={`/dashboard/training/${course.id}`} className="block">
                    <Card className="hover:bg-muted/40 h-full">
                      <CardHeader>
                        <CardTitle>{course.title}</CardTitle>
                        {course.summary && <CardDescription>{course.summary}</CardDescription>}
                      </CardHeader>
                      <CardContent className="mt-auto flex flex-col gap-2">
                        <Progress
                          value={course.lessonCount ? (course.completedCount / course.lessonCount) * 100 : 0}
                          aria-label={t("courseProgress", { title: course.title })}
                        />
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">
                            {t("lessonCount", { done: course.completedCount, total: course.lessonCount })}
                          </span>
                          {done ? <Badge variant="secondary">{t("done")}</Badge> : null}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

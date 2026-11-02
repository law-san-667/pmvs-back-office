"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import type { TrainingLesson } from "@/lib/training";
import { trpc } from "@/server/trpc/client";
import { CheckCircle2Icon, DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function LessonContent({ lesson }: { lesson: TrainingLesson }) {
  const t = useTranslations("training");
  if (lesson.kind === "VIDEO" && lesson.fileUrl) {
    return (
      // The trainer's video has no captions file for now.
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video key={lesson.id} controls preload="metadata" src={lesson.fileUrl} className="w-full rounded-lg bg-black" />
    );
  }
  if (lesson.kind === "PDF" && lesson.fileUrl) {
    return (
      <Button variant="outline" nativeButton={false} className="w-fit" render={<a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" />}>
        <DownloadIcon />
        {t("openPdf")}
      </Button>
    );
  }
  return <p className="text-sm whitespace-pre-wrap">{lesson.body}</p>;
}

export default function TrainingCoursePage() {
  const t = useTranslations("training");
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const course = trpc.training.course.useQuery({ id });
  const [selected, setSelected] = useState<string | null>(null);
  const setProgress = trpc.training.setProgress.useMutation({
    onSuccess: () =>
      Promise.all([utils.training.course.invalidate({ id }), utils.training.courses.invalidate()]),
    onError: (error) => toast.error(error.message),
  });

  if (course.error) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">{course.error.message}</p>
      </div>
    );
  }
  if (!course.data) return <p className="text-muted-foreground p-6 text-sm">{t("loading")}</p>;
  const { lessons } = course.data;
  const lesson =
    lessons.find((item) => item.id === selected) ?? lessons.find((item) => !item.completed) ?? lessons[0];

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <Link href="/dashboard/training" className="text-primary text-sm">
          {t("allCourses")}
        </Link>
        <h1 className="text-2xl font-bold">{course.data.title}</h1>
        {course.data.summary && <p className="text-muted-foreground text-sm">{course.data.summary}</p>}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        {lesson && (
          <Card>
            <CardHeader>
              <CardTitle>{lesson.title}</CardTitle>
              <CardDescription>
                {lesson.durationMinutes
                  ? t("lessonMeta", { kind: t(`kind.${lesson.kind}`), minutes: lesson.durationMinutes })
                  : t(`kind.${lesson.kind}`)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <LessonContent lesson={lesson} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={lesson.completed}
                  disabled={setProgress.isPending}
                  onCheckedChange={(checked) =>
                    setProgress.mutate({ id: lesson.id, completed: Boolean(checked) })
                  }
                />
                {t("markDone")}
              </label>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>{t("lessons")}</CardTitle>
            <CardDescription>
              {t("lessonsDone", { done: course.data.completedCount, total: course.data.lessonCount })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress
              value={course.data.lessonCount ? (course.data.completedCount / course.data.lessonCount) * 100 : 0}
              aria-label={t("courseProgressLabel")}
            />
            <ol className="flex flex-col gap-1">
              {lessons.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={item.id === lesson?.id ? "true" : undefined}
                    className={`hover:bg-muted flex w-full items-start gap-2 rounded-md p-2 text-start text-sm ${item.id === lesson?.id ? "bg-muted font-medium" : ""}`}
                    onClick={() => setSelected(item.id)}
                  >
                    <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
                    <span className="flex-1">{item.title}</span>
                    {item.completed && <CheckCircle2Icon className="size-4 shrink-0" aria-label={t("lessonDone")} />}
                  </button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

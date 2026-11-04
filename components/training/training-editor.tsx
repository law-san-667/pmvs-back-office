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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminTrainingCourse,
  KIND_LABELS,
  type LessonKind,
  type TrainingLevel,
} from "@/lib/training";
import { uploadFileToR2FromBrowser } from "@/lib/upload-to-r2";
import { trpc } from "@/server/trpc/client";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const SELECT_CLASS = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";
const fail = { onError: (error: { message: string }) => toast.error(error.message) };

function NewLesson({ courseId, onAdded }: { courseId: string; onAdded: () => Promise<unknown> }) {
  const t = useTranslations("adminSystem.training");
  const tTraining = useTranslations("training");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<LessonKind>("VIDEO");
  const [body, setBody] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [uploading, setUploading] = useState(false);
  const createUpload = trpc.media.createUpload.useMutation();
  const create = trpc.training.createLesson.useMutation({
    ...fail,
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setFileUrl("");
      setDuration("");
      await onAdded();
      toast.success(t("lessonAdded"));
    },
  });
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFileToR2FromBrowser(file, kind === "VIDEO" ? "videos" : "docs", (input) =>
        createUpload.mutateAsync(input),
      );
      setFileUrl(url ?? "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        create.mutate({
          courseId,
          title,
          kind,
          body: kind === "TEXT" ? body : null,
          fileUrl: kind === "TEXT" ? null : fileUrl || null,
          durationMinutes: duration ? Number(duration) : null,
        });
      }}
    >
      <span className="text-sm font-medium">{t("addLessonTitle")}</span>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`l-title-${courseId}`}>{t("title")}</Label>
          <Input id={`l-title-${courseId}`} value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`l-kind-${courseId}`}>{t("type")}</Label>
          <select
            id={`l-kind-${courseId}`}
            className={SELECT_CLASS}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as LessonKind);
              setFileUrl("");
            }}
          >
            {(Object.keys(KIND_LABELS) as LessonKind[]).map((value) => (
              <option key={value} value={value}>
                {tTraining(`kind.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`l-duration-${courseId}`}>{t("durationMinutes")}</Label>
          <Input id={`l-duration-${courseId}`} type="number" min={1} max={1000} value={duration} onChange={(event) => setDuration(event.target.value)} />
        </div>
      </div>
      {kind === "TEXT" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`l-body-${courseId}`}>{t("text")}</Label>
          <Textarea id={`l-body-${courseId}`} rows={5} value={body} onChange={(event) => setBody(event.target.value)} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`l-file-${courseId}`}>
              {kind === "VIDEO" ? t("uploadVideo") : t("uploadPdf")}
            </Label>
            <Input
              id={`l-file-${courseId}`}
              type="file"
              accept={kind === "VIDEO" ? "video/mp4,video/webm,video/quicktime" : "application/pdf"}
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`l-url-${courseId}`}>{t("orUrl")}</Label>
            <Input id={`l-url-${courseId}`} type="url" placeholder="https://" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} />
          </div>
        </div>
      )}
      <div>
        <Button type="submit" size="sm" disabled={title.trim().length < 3 || uploading || create.isPending}>
          {uploading ? t("uploadingFile") : t("addLesson")}
        </Button>
      </div>
    </form>
  );
}

function CourseCard({ course, onChanged }: { course: AdminTrainingCourse; onChanged: () => Promise<unknown> }) {
  const t = useTranslations("adminSystem.training");
  const tTraining = useTranslations("training");
  const utils = trpc.useUtils();
  const [opened, setOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const detail = trpc.training.adminCourse.useQuery({ id: course.id }, { enabled: opened });
  const refresh = () =>
    Promise.all([utils.training.adminCourse.invalidate({ id: course.id }), onChanged()]);
  const update = trpc.training.updateCourse.useMutation({ ...fail, onSuccess: refresh });
  const remove = trpc.training.deleteCourse.useMutation({ ...fail, onSuccess: onChanged });
  const removeLesson = trpc.training.deleteLesson.useMutation({ ...fail, onSuccess: refresh });
  const order = trpc.training.orderLessons.useMutation({ ...fail, onSuccess: refresh });
  const lessons = detail.data?.lessons ?? [];
  const move = (index: number, by: number) => {
    const ids = lessons.map((lesson) => lesson.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + by, 0, id!);
    order.mutate({ courseId: course.id, lessonIds: ids });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {course.title}
          <Badge variant="outline">{tTraining(`level.${course.level}`)}</Badge>
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? t("published") : t("draft")}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t("courseStats", { lessons: course.lessonCount, learners: course.learners })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpened(!opened)}>
            {opened ? t("close") : t("manageLessons")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={update.isPending}
            onClick={() => update.mutate({ id: course.id, isPublished: !course.isPublished })}
          >
            {course.isPublished ? t("unpublish") : t("publish")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(true)}>
            {t("delete")}
          </Button>
        </div>
        {opened && (
          <div className="flex flex-col gap-3">
            {detail.error && <p className="text-destructive text-sm">{detail.error.message}</p>}
            <ol className="flex flex-col divide-y">
              {lessons.map((lesson, index) => (
                <li key={lesson.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0">
                    {index + 1}. {lesson.title}
                    <span className="text-muted-foreground ms-2 text-xs">{tTraining(`kind.${lesson.kind}`)}</span>
                  </span>
                  <span className="flex shrink-0">
                    <Button size="icon" variant="ghost" aria-label={t("moveUp", { title: lesson.title })} disabled={index === 0 || order.isPending} onClick={() => move(index, -1)}>
                      <ArrowUpIcon />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={t("moveDown", { title: lesson.title })} disabled={index === lessons.length - 1 || order.isPending} onClick={() => move(index, 1)}>
                      <ArrowDownIcon />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={t("removeLesson", { title: lesson.title })} disabled={removeLesson.isPending} onClick={() => removeLesson.mutate({ id: lesson.id })}>
                      <Trash2Icon />
                    </Button>
                  </span>
                </li>
              ))}
            </ol>
            <NewLesson courseId={course.id} onAdded={refresh} />
          </div>
        )}
      </CardContent>
      {deleting && (
        <AlertDialog open onOpenChange={(open) => !open && setDeleting(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteDescription", { title: course.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={remove.isPending}
                onClick={(event) => {
                  event.preventDefault();
                  remove.mutate({ id: course.id });
                }}
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

/** Create courses, add their lessons, publish. */
export function TrainingEditor() {
  const t = useTranslations("adminSystem.training");
  const tTraining = useTranslations("training");
  const utils = trpc.useUtils();
  const courses = trpc.training.adminCourses.useQuery();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [level, setLevel] = useState<TrainingLevel>("BEGINNER");
  const refresh = () => utils.training.adminCourses.invalidate();
  const create = trpc.training.createCourse.useMutation({
    ...fail,
    onSuccess: async () => {
      setTitle("");
      setSummary("");
      await refresh();
      toast.success(t("courseCreated"));
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("newCourse")}</CardTitle>
          <CardDescription>{t("newCourseHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate({ title, summary: summary || null, level });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-title">{t("title")}</Label>
              <Input id="c-title" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-summary">{t("summary")}</Label>
              <Input id="c-summary" value={summary} maxLength={1000} onChange={(event) => setSummary(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-level">{t("level")}</Label>
              <select id="c-level" className={SELECT_CLASS} value={level} onChange={(event) => setLevel(event.target.value as TrainingLevel)}>
                <option value="BEGINNER">{tTraining("level.BEGINNER")}</option>
                <option value="ADVANCED">{tTraining("level.ADVANCED")}</option>
              </select>
            </div>
            <Button type="submit" disabled={title.trim().length < 3 || create.isPending}>
              {t("create")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {courses.error && <p className="text-destructive text-sm">{courses.error.message}</p>}
      {courses.data?.map((course) => (
        <CourseCard key={course.id} course={course} onChanged={refresh} />
      ))}
    </div>
  );
}

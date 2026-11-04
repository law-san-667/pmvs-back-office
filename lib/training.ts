/** Training portal types (client-safe). */

export type TrainingLevel = "BEGINNER" | "ADVANCED";
export type LessonKind = "VIDEO" | "PDF" | "TEXT";

export const KIND_LABELS: Record<LessonKind, string> = {
  VIDEO: "Vidéo",
  PDF: "PDF",
  TEXT: "Texte",
};

export type TrainingCourse = {
  id: string;
  title: string;
  summary: string | null;
  level: TrainingLevel;
  isPublished: boolean;
  position: number;
  lessonCount: number;
  completedCount: number;
};

export type AdminTrainingCourse = TrainingCourse & { learners: number };

export type TrainingLesson = {
  id: string;
  courseId: string;
  title: string;
  kind: LessonKind;
  body: string | null;
  fileUrl: string | null;
  durationMinutes: number | null;
  position: number;
  completed: boolean;
};

export type TrainingCourseDetail = TrainingCourse & { lessons: TrainingLesson[] };

import type {
  AdminTrainingCourse,
  TrainingCourse,
  TrainingCourseDetail,
  TrainingLesson,
} from "@/lib/training";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const id = z.object({ id: z.uuid() });
const level = z.enum(["BEGINNER", "ADVANCED"]);
const lesson = z.object({
  title: z.string(),
  kind: z.enum(["VIDEO", "PDF", "TEXT"]),
  body: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
});

export const trainingRouter = createTRPCRouter({
  courses: privateProcedure.query(({ ctx }) =>
    callBackend<TrainingCourse[]>(ctx.api.get("/training/courses")),
  ),
  course: privateProcedure.input(id).query(({ ctx, input }) =>
    callBackend<TrainingCourseDetail>(ctx.api.get(`/training/courses/${input.id}`)),
  ),
  setProgress: privateProcedure
    .input(id.extend({ completed: z.boolean() }))
    .mutation(({ ctx, input }) =>
      callBackend<{ completed: boolean }>(
        ctx.api.put(`/training/lessons/${input.id}/progress`, { completed: input.completed }),
      ),
    ),
  adminCourses: privateProcedure.query(({ ctx }) =>
    callBackend<AdminTrainingCourse[]>(ctx.api.get("/admin/training/courses")),
  ),
  adminCourse: privateProcedure.input(id).query(({ ctx, input }) =>
    callBackend<TrainingCourseDetail>(ctx.api.get(`/admin/training/courses/${input.id}`)),
  ),
  createCourse: privateProcedure
    .input(z.object({ title: z.string(), summary: z.string().nullable().optional(), level }))
    .mutation(({ ctx, input }) =>
      callBackend<TrainingCourse>(ctx.api.post("/admin/training/courses", input)),
    ),
  updateCourse: privateProcedure
    .input(
      id.extend({
        title: z.string().optional(),
        summary: z.string().nullable().optional(),
        level: level.optional(),
        isPublished: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input: { id: courseId, ...body } }) =>
      callBackend<TrainingCourse>(ctx.api.patch(`/admin/training/courses/${courseId}`, body)),
    ),
  deleteCourse: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<{ id: string }>(ctx.api.delete(`/admin/training/courses/${input.id}`)),
  ),
  createLesson: privateProcedure
    .input(lesson.extend({ courseId: z.uuid() }))
    .mutation(({ ctx, input: { courseId, ...body } }) =>
      callBackend<TrainingLesson>(ctx.api.post(`/admin/training/courses/${courseId}/lessons`, body)),
    ),
  orderLessons: privateProcedure
    .input(z.object({ courseId: z.uuid(), lessonIds: z.array(z.uuid()) }))
    .mutation(({ ctx, input }) =>
      callBackend<{ id: string }>(
        ctx.api.put(`/admin/training/courses/${input.courseId}/order`, { lessonIds: input.lessonIds }),
      ),
    ),
  deleteLesson: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<{ id: string }>(ctx.api.delete(`/admin/training/lessons/${input.id}`)),
  ),
});

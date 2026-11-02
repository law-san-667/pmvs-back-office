import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

export type ContentReport = {
  id: string;
  type: "LISTING" | "USER" | "BUSINESS" | "REVIEW";
  targetId: string;
  reason: string;
  description: string | null;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  resolutionNote: string | null;
  createdAt: string;
  target: { label: string; state: string } | null;
};

export type ModeratedReview = {
  id: string;
  listingId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewer?: { firstName: string; lastName: string };
};

export const moderationRouter = createTRPCRouter({
  reports: privateProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"]),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<ContentReport, "paginated">(
        ctx.api.get("/admin/reports", { params: { ...input, limit: 100 } }),
        { mode: "paginated" },
      ),
    ),
  handleReport: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]),
        hideTarget: z.boolean(),
        note: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<ContentReport>(
        ctx.api.patch(`/admin/reports/${id}`, payload),
      );
    }),
  reviews: privateProcedure
    .input(z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }))
    .query(({ ctx, input }) =>
      callBackend<ModeratedReview, "paginated">(
        ctx.api.get("/admin/reviews", { params: { ...input, limit: 100 } }),
        { mode: "paginated" },
      ),
    ),
  moderateReview: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["APPROVED", "REJECTED"]),
        reason: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<ModeratedReview>(
        ctx.api.patch(`/admin/reviews/${id}/moderation`, payload),
      );
    }),
  reviewSetting: privateProcedure.query(({ ctx }) =>
    callBackend<{ mode: "post" | "pre" }>(
      ctx.api.get("/admin/reviews/settings"),
    ),
  ),
  setReviewSetting: privateProcedure
    .input(z.object({ mode: z.enum(["post", "pre"]) }))
    .mutation(({ ctx, input }) =>
      callBackend<{ mode: "post" | "pre" }>(
        ctx.api.put("/admin/reviews/settings", input),
      ),
    ),
});

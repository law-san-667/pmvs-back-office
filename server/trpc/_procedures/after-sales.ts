import type { AfterSalesCase } from "@/lib/after-sales";
import { idInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const statusSchema = z.enum([
  "OPEN",
  "SUPPLIER_ACCEPTED",
  "ESCALATED",
  "RESOLVED",
  "CANCELLED",
]);

export const afterSalesRouter = createTRPCRouter({
  forOrder: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<AfterSalesCase[]>(
        ctx.api.get(`/orders/${input.id}/after-sales`),
      ),
    ),
  shop: privateProcedure
    .input(z.object({ businessId: z.uuid(), status: statusSchema.optional() }))
    .query(({ ctx, input }) =>
      callBackend<AfterSalesCase, "paginated">(
        ctx.api.get(`/businesses/${input.businessId}/after-sales`, {
          params: { status: input.status, limit: 100 },
        }),
        { mode: "paginated" },
      ),
    ),
  all: privateProcedure
    .input(z.object({ status: statusSchema.optional() }))
    .query(({ ctx, input }) =>
      callBackend<AfterSalesCase, "paginated">(
        ctx.api.get("/admin/after-sales", {
          params: { status: input.status, limit: 100 },
        }),
        { mode: "paginated" },
      ),
    ),
  answer: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        accept: z.boolean(),
        message: z.string().trim(),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<AfterSalesCase>(
        ctx.api.post(`/after-sales/${input.id}/answer`, {
          accept: input.accept,
          message: input.message,
        }),
      ),
    ),
  resolve: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        resolution: z.enum(["REFUND_FULL", "REFUND_PARTIAL", "REPLACEMENT", "NO_REFUND"]),
        note: z.string().trim(),
        refundAmountMinor: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<AfterSalesCase>(
        ctx.api.post(`/admin/after-sales/${input.id}/resolve`, {
          resolution: input.resolution,
          note: input.note,
          refundAmountMinor: input.refundAmountMinor,
        }),
      ),
    ),
});

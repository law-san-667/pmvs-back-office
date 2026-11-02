import type { SupportTicket } from "@/lib/support";
import { idInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const categorySchema = z.enum([
  "ORDER",
  "PAYMENT",
  "ACCOUNT",
  "PRODUCT",
  "TECHNICAL",
  "OTHER",
]);
const statusSchema = z.enum(["OPEN", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"]);

export const supportRouter = createTRPCRouter({
  mine: privateProcedure.query(({ ctx }) =>
    callBackend<SupportTicket, "paginated">(
      ctx.api.get("/support/tickets", { params: { limit: 100 } }),
      { mode: "paginated" },
    ),
  ),
  ticket: privateProcedure
    .input(idInputSchema)
    .query(({ ctx, input }) =>
      callBackend<SupportTicket>(ctx.api.get(`/support/tickets/${input.id}`)),
    ),
  create: privateProcedure
    .input(
      z.object({
        subject: z.string().trim(),
        category: categorySchema,
        body: z.string().trim(),
        businessId: z.uuid().optional(),
        orderId: z.uuid().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<SupportTicket>(ctx.api.post("/support/tickets", input)),
    ),
  reply: privateProcedure
    .input(z.object({ id: z.uuid(), body: z.string().trim() }))
    .mutation(({ ctx, input }) =>
      callBackend<SupportTicket>(
        ctx.api.post(`/support/tickets/${input.id}/messages`, {
          body: input.body,
        }),
      ),
    ),
  close: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<SupportTicket>(
        ctx.api.post(`/support/tickets/${input.id}/close`),
      ),
    ),
  /** Team queue (admins, moderators, operators). */
  queue: privateProcedure
    .input(
      z.object({
        status: statusSchema.optional(),
        assignee: z.enum(["me", "none"]).optional(),
        overdue: z.boolean().optional(),
        page: z.number().int().positive().default(1),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<SupportTicket, "paginated">(
        ctx.api.get("/admin/support/tickets", {
          params: {
            ...input,
            limit: 30,
            overdue: input.overdue ? "true" : undefined,
          },
        }),
        { mode: "paginated" },
      ),
    ),
  update: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: statusSchema.optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
        assignedToUserId: z.uuid().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<SupportTicket>(
        ctx.api.patch(`/admin/support/tickets/${id}`, payload),
      );
    }),
});

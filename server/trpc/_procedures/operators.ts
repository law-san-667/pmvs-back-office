import type { Business } from "@/lib/backend-resource-types";
import type { OperatorAssignment, OperatorBusiness } from "@/lib/operators";
import { uuidSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

export const operatorsRouter = createTRPCRouter({
  /** Shops the signed-in operator acts for. */
  myBusinesses: privateProcedure.query(({ ctx }) =>
    callBackend<OperatorBusiness[]>(ctx.api.get("/operator/businesses")),
  ),
  /** Full record of the shop the operator switches to. */
  business: privateProcedure
    .input(z.object({ id: uuidSchema }))
    .query(({ ctx, input }) =>
      callBackend<Business>(
        ctx.api.get("/businesses/me", {
          headers: { "x-business-id": input.id },
        }),
      ),
    ),
  /** Shop picker of the assignment form: any country, by name. */
  searchBusinesses: privateProcedure
    .input(z.object({ name: z.string().trim().optional() }))
    .query(({ ctx, input }) =>
      callBackend<OperatorBusiness, "paginated">(
        ctx.api.get("/businesses", {
          params: { page: 1, limit: 20, name: input.name || undefined },
        }),
        { mode: "paginated" },
      ),
    ),
  assignments: privateProcedure
    .input(
      z
        .object({
          operatorUserId: uuidSchema.optional(),
          businessId: uuidSchema.optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      callBackend<OperatorAssignment[]>(
        ctx.api.get("/admin/operator-assignments", { params: input }),
      ),
    ),
  assign: privateProcedure
    .input(
      z.object({
        operatorUserId: uuidSchema,
        businessId: uuidSchema,
        notes: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<OperatorAssignment>(
        ctx.api.post("/admin/operator-assignments", input),
      ),
    ),
  setActive: privateProcedure
    .input(z.object({ id: uuidSchema, isActive: z.boolean() }))
    .mutation(({ ctx, input }) =>
      callBackend<OperatorAssignment>(
        ctx.api.patch(`/admin/operator-assignments/${input.id}`, {
          isActive: input.isActive,
        }),
      ),
    ),
});

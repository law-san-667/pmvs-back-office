import { idInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

export type PromotionState = "SCHEDULED" | "RUNNING" | "ENDED" | "PAUSED";

export type Promotion = {
  id: string;
  businessId: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number;
  scope: "LISTING" | "CATEGORY" | "ALL";
  categoryId: string | null;
  listingIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  state: PromotionState;
  createdAt: string;
  updatedAt: string;
};

const promotionInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive(),
  scope: z.enum(["LISTING", "CATEGORY", "ALL"]),
  categoryId: z.uuid().nullable().optional(),
  listingIds: z.array(z.uuid()).optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  isActive: z.boolean().optional(),
});

export const promotionsRouter = createTRPCRouter({
  list: privateProcedure
    .input(z.object({ businessId: z.uuid() }))
    .query(({ ctx, input }) =>
      callBackend<Promotion[]>(
        ctx.api.get(`/businesses/${input.businessId}/promotions`),
      ),
    ),
  create: privateProcedure
    .input(promotionInputSchema.extend({ businessId: z.uuid() }))
    .mutation(({ ctx, input }) => {
      const { businessId, ...body } = input;
      return callBackend<Promotion>(
        ctx.api.post(`/businesses/${businessId}/promotions`, body),
      );
    }),
  update: privateProcedure
    .input(promotionInputSchema.partial().extend({ id: z.uuid() }))
    .mutation(({ ctx, input }) => {
      const { id, ...body } = input;
      return callBackend<Promotion>(ctx.api.patch(`/promotions/${id}`, body));
    }),
  delete: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Promotion>(ctx.api.delete(`/promotions/${input.id}`)),
    ),
});

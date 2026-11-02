import { idInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import {
  AD_PLACEMENTS,
  type Advertisement,
  type AdStats,
} from "@/lib/advertising";
import { createTRPCRouter, privateProcedure } from "../init";

export type { Advertisement, AdPlacement, AdState, AdStats } from "@/lib/advertising";

const adInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(200).nullable().optional(),
  imageUrl: z.string().trim().min(1),
  targetUrl: z.string().trim().nullable().optional(),
  placement: z.enum(AD_PLACEMENTS),
  countryCodes: z.array(z.string()).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

export const advertisingRouter = createTRPCRouter({
  business: privateProcedure
    .input(z.object({ businessId: z.uuid() }))
    .query(({ ctx, input }) =>
      callBackend<Advertisement[]>(
        ctx.api.get(`/businesses/${input.businessId}/ads`),
      ),
    ),
  submit: privateProcedure
    .input(adInputSchema.extend({ businessId: z.uuid() }))
    .mutation(({ ctx, input }) => {
      const { businessId, ...body } = input;
      return callBackend<Advertisement>(
        ctx.api.post(`/businesses/${businessId}/ads`, body),
      );
    }),
  update: privateProcedure
    .input(adInputSchema.partial().extend({ id: z.uuid() }))
    .mutation(({ ctx, input }) => {
      const { id, ...body } = input;
      return callBackend<Advertisement>(ctx.api.patch(`/ads/${id}`, body));
    }),
  delete: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Advertisement>(ctx.api.delete(`/ads/${input.id}`)),
    ),
  stats: privateProcedure
    .input(idInputSchema.extend({ days: z.number().int().min(1).max(365).default(30) }))
    .query(({ ctx, input }) =>
      callBackend<AdStats>(
        ctx.api.get(`/ads/${input.id}/stats`, { params: { days: input.days } }),
      ),
    ),
  adminList: privateProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        placement: z.enum(AD_PLACEMENTS).optional(),
        owner: z.enum(["platform", "business"]).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<Advertisement, "paginated">(
        ctx.api.get("/admin/ads", { params: input }),
        { mode: "paginated" },
      ),
    ),
  createPlatform: privateProcedure
    .input(adInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<Advertisement>(ctx.api.post("/admin/ads", input)),
    ),
  review: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["APPROVED", "REJECTED"]),
        reason: z.string().trim().max(500).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...body } = input;
      return callBackend<Advertisement>(
        ctx.api.patch(`/admin/ads/${id}/review`, body),
      );
    }),
});

import {
  AUDIENCES,
  type Campaign,
  type ConsentEvent,
  LANGUAGES,
  type SubscribersPage,
} from "@/lib/marketing";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const id = z.object({ id: z.uuid() });
const segment = z.object({
  audience: z.enum(AUDIENCES),
  countryCodes: z.array(z.string().length(2)).max(60),
  languages: z.array(z.enum(LANGUAGES)).max(4),
});
const campaign = z.object({
  subject: z.string(),
  preheader: z.string().nullable(),
  body: z.string(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  segment,
});

/** Admin side of the marketing e-mails: campaigns and subscribers. */
export const marketingRouter = createTRPCRouter({
  campaigns: privateProcedure.query(({ ctx }) =>
    callBackend<Campaign[]>(ctx.api.get("/admin/marketing/campaigns")),
  ),
  campaign: privateProcedure.input(id).query(({ ctx, input }) =>
    callBackend<Campaign>(ctx.api.get(`/admin/marketing/campaigns/${input.id}`)),
  ),
  createCampaign: privateProcedure
    .input(campaign)
    .mutation(({ ctx, input }) => callBackend<Campaign>(ctx.api.post("/admin/marketing/campaigns", input))),
  updateCampaign: privateProcedure
    .input(campaign.extend({ id: z.uuid() }))
    .mutation(({ ctx, input: { id, ...input } }) =>
      callBackend<Campaign>(ctx.api.patch(`/admin/marketing/campaigns/${id}`, input)),
    ),
  deleteCampaign: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<{ message: string }>(ctx.api.delete(`/admin/marketing/campaigns/${input.id}`)),
  ),
  testCampaign: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<{ to: string }>(ctx.api.post(`/admin/marketing/campaigns/${input.id}/test`)),
  ),
  sendCampaign: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<Campaign>(ctx.api.post(`/admin/marketing/campaigns/${input.id}/send`)),
  ),
  cancelCampaign: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<Campaign>(ctx.api.post(`/admin/marketing/campaigns/${input.id}/cancel`)),
  ),
  segmentCount: privateProcedure
    .input(segment)
    .query(({ ctx, input }) =>
      callBackend<{ count: number }>(ctx.api.post("/admin/marketing/segment-count", input)),
    ),
  subscribers: privateProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "SUBSCRIBED", "UNSUBSCRIBED"]).optional(),
        search: z.string().max(200).optional(),
        page: z.number().int().min(1),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<SubscribersPage>(
        ctx.api.get("/admin/marketing/subscribers", {
          params: { ...input, search: input.search || undefined, limit: 25 },
        }),
      ),
    ),
  consent: privateProcedure.input(id).query(({ ctx, input }) =>
    callBackend<ConsentEvent[]>(ctx.api.get(`/admin/marketing/subscribers/${input.id}/consent`)),
  ),
  unsubscribe: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<ConsentEvent[]>(ctx.api.post(`/admin/marketing/subscribers/${input.id}/unsubscribe`)),
  ),
});

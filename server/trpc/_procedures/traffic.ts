import type { TrafficStats } from "@/lib/traffic";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const days = z.number().int().min(7).max(90).default(30);

export const trafficRouter = createTRPCRouter({
  business: privateProcedure
    .input(z.object({ businessId: z.uuid(), days }))
    .query(({ ctx, input }) =>
      callBackend<TrafficStats>(
        ctx.api.get(`/businesses/${input.businessId}/traffic`, {
          params: { days: input.days },
        }),
      ),
    ),
  platform: privateProcedure
    .input(z.object({ days }))
    .query(({ ctx, input }) =>
      callBackend<TrafficStats>(ctx.api.get("/admin/traffic", { params: input })),
    ),
});

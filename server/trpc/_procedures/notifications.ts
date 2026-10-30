import type { AppNotification } from "@/lib/notifications";
import {
  idInputSchema,
  paginationInputSchema,
} from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

export const notificationsRouter = createTRPCRouter({
  list: privateProcedure
    .input(paginationInputSchema.extend({ unread: z.boolean().optional() }))
    .query(({ ctx, input }) =>
      callBackend<AppNotification, "paginated">(
        ctx.api.get("/notifications", {
          params: { ...input, unread: input.unread ? "true" : undefined },
        }),
        { mode: "paginated" },
      ),
    ),
  unreadCount: privateProcedure.query(({ ctx }) =>
    callBackend<{ unread: number }>(ctx.api.get("/notifications/unread-count")),
  ),
  markRead: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<AppNotification>(
        ctx.api.patch(`/notifications/${input.id}/read`),
      ),
    ),
  markAllRead: privateProcedure.mutation(({ ctx }) =>
    callBackend<{ updated: number }>(ctx.api.post("/notifications/read-all")),
  ),
});

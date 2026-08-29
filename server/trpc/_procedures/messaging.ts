import type {
  ConversationReadReceipt,
  DirectConversation,
  DirectMessage,
  SocketTicket,
} from "@/lib/messaging";
import {
  conversationIdInputSchema,
  conversationsInputSchema,
  createConversationInputSchema,
  readConversationInputSchema,
  sendMessageInputSchema,
} from "@/lib/validators/messaging";
import { getBackendBaseUrl } from "@/server/api";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, privateProcedure } from "../init";

type BackendSocketTicket = Omit<SocketTicket, "url">;

export const messagingRouter = createTRPCRouter({
  conversations: privateProcedure
    .input(conversationsInputSchema)
    .query(({ ctx, input }) =>
      callBackend<DirectConversation, "paginated">(
        ctx.api.get("/conversations", { params: input }),
        { mode: "paginated" },
      ),
    ),
  createConversation: privateProcedure
    .input(createConversationInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<DirectConversation>(ctx.api.post("/conversations", input)),
    ),
  messages: privateProcedure
    .input(conversationIdInputSchema)
    .query(({ ctx, input }) =>
      callBackend<DirectMessage, "paginated">(
        ctx.api.get(`/conversations/${input.id}/messages`, {
          params: { page: input.page, limit: input.limit },
        }),
        { mode: "paginated" },
      ),
    ),
  sendMessage: privateProcedure
    .input(sendMessageInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<DirectMessage>(
        ctx.api.post(`/conversations/${input.conversationId}/messages`, {
          content: input.content,
        }),
      ),
    ),
  markRead: privateProcedure
    .input(readConversationInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<ConversationReadReceipt>(
        ctx.api.patch(`/conversations/${input.conversationId}/read`),
      ),
    ),
  socketTicket: privateProcedure.mutation(async ({ ctx }) => {
    const ticket = await callBackend<BackendSocketTicket>(
      ctx.api.post("/conversations/socket-ticket"),
    );

    return {
      ...ticket,
      url: new URL(getBackendBaseUrl()).origin,
    } satisfies SocketTicket;
  }),
});

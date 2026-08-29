import z from "zod";

const uuidSchema = z.string().uuid();
const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const conversationsInputSchema = paginationSchema.extend({
  businessId: uuidSchema.optional(),
});

export const conversationIdInputSchema = paginationSchema.extend({
  id: uuidSchema,
});

export const createConversationInputSchema = z.object({
  businessId: uuidSchema,
  customerId: uuidSchema.optional(),
});

export const sendMessageInputSchema = z.object({
  conversationId: uuidSchema,
  content: z.string().trim().min(1).max(5000),
});

export const readConversationInputSchema = z.object({
  conversationId: uuidSchema,
});

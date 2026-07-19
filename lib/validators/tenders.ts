import z from "zod";
import { uuidSchema } from "./backend-resources";

export const tenderTypeEnum = [
  "SUPPLY",
  "SERVICE",
  "WORKS",
  "INTELLECTUAL_SERVICE",
] as const;

export const tenderStatusEnum = [
  "DRAFT",
  "OPEN",
  "EVALUATION",
  "AWARDED",
  "CLOSED",
  "CANCELLED",
] as const;

const tenderTypeSchema = z.enum(tenderTypeEnum);
const tenderStatusSchema = z.enum(tenderStatusEnum);

export const createTenderSchema = z.object({
  publisherUserId: uuidSchema,
  publisherBusinessId: uuidSchema.nullable().optional(),
  categoryId: uuidSchema,
  subCategoryId: uuidSchema,
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  type: tenderTypeSchema,
  status: tenderStatusSchema.optional(),
  budgetMinMinor: z.number().int().nonnegative().nullable().optional(),
  budgetMaxMinor: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().trim().min(1).optional(),
  requirements: z.unknown().nullable().optional(),
  documents: z.unknown().nullable().optional(),
  location: z.string().trim().min(1).nullable().optional(),
  countryCode: z.string().trim().min(2),
  submissionDeadline: z.string().min(1),
  evaluationDeadline: z.string().nullable().optional(),
  awardedAt: z.string().nullable().optional(),
});

export const updateTenderSchema = createTenderSchema.partial().extend({
  id: uuidSchema,
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;

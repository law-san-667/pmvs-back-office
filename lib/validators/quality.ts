import { paginationInputSchema } from "@/lib/validators/backend-resources";
import z from "zod";

const percent = z.coerce.number().min(0).max(100);

export const qualityThresholdsInputSchema = z.object({
  maxNegativeFeedbackRate: percent,
  minResponseRate: percent,
  maxReturnRate: percent,
  maxCancellationRate: percent,
  maxStockOutRate: percent,
  maxShippingDelayDays: z.coerce.number().int().min(0).max(60),
  minOnTimeShippingRate: percent,
  minStockPerProduct: z.coerce.number().int().min(0).max(100_000),
  evaluationWindowDays: z.coerce.number().int().min(7).max(365),
});

export const businessEvaluationInputSchema = z.object({
  businessId: z.string().uuid(),
  prohibitedProductsEnforced: z.boolean(),
  admissibleCategoriesDefined: z.boolean(),
  productQualityVerified: z.boolean(),
  notes: z.string().trim().max(2000).optional(),
});

export const businessCertificationInputSchema = z.object({
  businessId: z.string().uuid(),
  isCertified: z.boolean(),
});

export const qualityRankingInputSchema = paginationInputSchema.extend({
  certified: z.boolean().optional(),
});

export type QualityThresholdsInput = z.infer<typeof qualityThresholdsInputSchema>;
export type BusinessEvaluationInput = z.infer<typeof businessEvaluationInputSchema>;

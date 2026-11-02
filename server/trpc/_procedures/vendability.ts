import type {
  QuestionnaireAnswer,
  QuestionnaireResponseRow,
  QuestionnaireVersion,
  ShopQuestionnaire,
  TopListings,
  VendabilitySettings,
} from "@/lib/vendability";
import { paginationInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const id = z.object({ id: z.uuid() });
const question = z.object({
  id: z.string(),
  label: z.string(),
  help: z.string().optional(),
  type: z.enum(["CHOICE", "TEXT"]),
  required: z.boolean(),
  weight: z.number(),
  options: z.array(z.object({ id: z.string(), label: z.string(), points: z.number() })),
});
const criterionWeights = z.object({
  sales: z.number(),
  conversion: z.number(),
  cartRate: z.number(),
  views: z.number(),
  rating: z.number(),
  availability: z.number(),
  completeness: z.number(),
  supplier: z.number(),
});

export const vendabilityRouter = createTRPCRouter({
  versions: privateProcedure.query(({ ctx }) =>
    callBackend<QuestionnaireVersion[]>(ctx.api.get("/admin/questionnaires")),
  ),
  createDraft: privateProcedure.mutation(({ ctx }) =>
    callBackend<QuestionnaireVersion>(ctx.api.post("/admin/questionnaires", {})),
  ),
  updateDraft: privateProcedure
    .input(id.extend({ title: z.string().optional(), questions: z.array(question).optional() }))
    .mutation(({ ctx, input: { id: draftId, ...body } }) =>
      callBackend<QuestionnaireVersion>(ctx.api.patch(`/admin/questionnaires/${draftId}`, body)),
    ),
  publishDraft: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<QuestionnaireVersion>(ctx.api.post(`/admin/questionnaires/${input.id}/publish`, {})),
  ),
  deleteDraft: privateProcedure.input(id).mutation(({ ctx, input }) =>
    callBackend<{ id: string }>(ctx.api.delete(`/admin/questionnaires/${input.id}`)),
  ),
  responses: privateProcedure
    .input(paginationInputSchema.extend(id.shape))
    .query(({ ctx, input: { id: versionId, ...params } }) =>
      callBackend<QuestionnaireResponseRow, "paginated">(
        ctx.api.get(`/admin/questionnaires/${versionId}/responses`, { params }),
        { mode: "paginated" },
      ),
    ),
  shopQuestionnaire: privateProcedure
    .input(z.object({ businessId: z.uuid() }))
    .query(({ ctx, input }) =>
      callBackend<ShopQuestionnaire>(ctx.api.get(`/businesses/${input.businessId}/questionnaire`)),
    ),
  submitAnswers: privateProcedure
    .input(z.object({ businessId: z.uuid(), answers: z.record(z.string(), z.string()) }))
    .mutation(({ ctx, input }) =>
      callBackend<QuestionnaireAnswer>(
        ctx.api.put(`/businesses/${input.businessId}/questionnaire`, { answers: input.answers }),
      ),
    ),
  settings: privateProcedure.query(({ ctx }) =>
    callBackend<VendabilitySettings>(ctx.api.get("/admin/vendability/settings")),
  ),
  updateSettings: privateProcedure
    .input(
      z.object({
        windowDays: z.number(),
        minViews: z.number(),
        minScore: z.number(),
        weights: criterionWeights,
        targets: z.object({
          units: z.number(),
          views: z.number(),
          conversionRate: z.number(),
          cartRate: z.number(),
        }),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<VendabilitySettings>(ctx.api.put("/admin/vendability/settings", input)),
    ),
  platformTop: privateProcedure.query(({ ctx }) =>
    callBackend<TopListings>(ctx.api.get("/admin/vendability/top")),
  ),
  shopTop: privateProcedure
    .input(z.object({ businessId: z.uuid() }))
    .query(({ ctx, input }) =>
      callBackend<TopListings>(ctx.api.get(`/businesses/${input.businessId}/vendability`)),
    ),
});

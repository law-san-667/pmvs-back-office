import type {
  AuditEntry,
  BannedTerm,
  ComplianceDocument,
  ComplianceFinding,
  ComplianceOverview,
} from "@/lib/compliance";
import { idInputSchema, paginationInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const DOCUMENT_TYPES = ["REGISTRATION", "TAX", "IDENTITY", "INSURANCE", "CERTIFICATION", "OTHER"] as const;

export const complianceRouter = createTRPCRouter({
  businessDocuments: privateProcedure
    .input(z.object({ businessId: z.uuid() }))
    .query(({ ctx, input }) =>
      callBackend<ComplianceDocument[]>(
        ctx.api.get(`/businesses/${input.businessId}/compliance-documents`),
      ),
    ),
  fileDocument: privateProcedure
    .input(
      z.object({
        businessId: z.uuid(),
        type: z.enum(DOCUMENT_TYPES),
        title: z.string().trim().min(2).max(160),
        fileUrl: z.url(),
        reference: z.string().trim().max(120).nullish(),
        issuedOn: z.string().nullish(),
        expiresOn: z.string().nullish(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { businessId, ...body } = input;
      return callBackend<ComplianceDocument>(
        ctx.api.post(`/businesses/${businessId}/compliance-documents`, body),
      );
    }),
  withdrawDocument: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<{ id: string }>(ctx.api.delete(`/compliance-documents/${input.id}`)),
    ),
  overview: privateProcedure.query(({ ctx }) =>
    callBackend<ComplianceOverview>(ctx.api.get("/admin/compliance/overview")),
  ),
  documents: privateProcedure
    .input(
      paginationInputSchema.extend({
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
        expiringWithinDays: z.number().int().min(0).max(365).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<ComplianceDocument, "paginated">(
        ctx.api.get("/admin/compliance/documents", { params: input }),
        { mode: "paginated" },
      ),
    ),
  reviewDocument: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["APPROVED", "REJECTED"]),
        reason: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...body } = input;
      return callBackend<ComplianceDocument>(
        ctx.api.patch(`/admin/compliance/documents/${id}/review`, body),
      );
    }),
  terms: privateProcedure.query(({ ctx }) =>
    callBackend<BannedTerm[]>(ctx.api.get("/admin/compliance/banned-terms")),
  ),
  addTerm: privateProcedure
    .input(
      z.object({
        term: z.string().trim().min(2).max(80),
        action: z.enum(["BLOCK", "REVIEW"]),
        reason: z.string().trim().max(200).nullish(),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<BannedTerm>(ctx.api.post("/admin/compliance/banned-terms", input)),
    ),
  updateTerm: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        action: z.enum(["BLOCK", "REVIEW"]).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...body } = input;
      return callBackend<BannedTerm>(ctx.api.patch(`/admin/compliance/banned-terms/${id}`, body));
    }),
  removeTerm: privateProcedure
    .input(idInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<{ id: string }>(ctx.api.delete(`/admin/compliance/banned-terms/${input.id}`)),
    ),
  findings: privateProcedure
    .input(
      paginationInputSchema.extend({
        status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<ComplianceFinding, "paginated">(
        ctx.api.get("/admin/compliance/findings", { params: input }),
        { mode: "paginated" },
      ),
    ),
  handleFinding: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["OPEN", "DISMISSED"]),
        note: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...body } = input;
      return callBackend<ComplianceFinding>(ctx.api.patch(`/admin/compliance/findings/${id}`, body));
    }),
  run: privateProcedure.mutation(({ ctx }) =>
    callBackend<{ raised: number; closed: number; reminders: number }>(
      ctx.api.post("/admin/compliance/run"),
    ),
  ),
  audit: privateProcedure
    .input(
      paginationInputSchema.extend({
        search: z.string().trim().min(1).max(100).optional(),
        from: z.string().datetime({ offset: true }).optional(),
        to: z.string().datetime({ offset: true }).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<AuditEntry, "paginated">(ctx.api.get("/admin/audit-logs", { params: input }), {
        mode: "paginated",
      }),
    ),
});

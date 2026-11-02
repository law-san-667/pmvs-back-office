import type {
  ReportArchive,
  ReportArchiveDetail,
  ReportCatalog,
  ReportResult,
  ReportSubscription,
  SavedReport,
} from "@/lib/reports";
import { paginationInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const definition = z.object({
  period: z.object({
    preset: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
  metrics: z.array(z.string()),
  axes: z.array(z.string()),
  currency: z.string(),
});
const businessId = z.uuid().optional();
const frequency = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);

export const reportsRouter = createTRPCRouter({
  catalog: privateProcedure.query(({ ctx }) =>
    callBackend<ReportCatalog>(ctx.api.get("/reports/catalog")),
  ),
  run: privateProcedure
    .input(z.object({ businessId, definition }))
    .query(({ ctx, input }) => callBackend<ReportResult>(ctx.api.post("/reports/run", input))),
  saved: privateProcedure
    .input(z.object({ businessId }))
    .query(({ ctx, input }) =>
      callBackend<SavedReport[]>(ctx.api.get("/reports/saved", { params: input })),
    ),
  createSaved: privateProcedure
    .input(z.object({ businessId, name: z.string(), definition }))
    .mutation(({ ctx, input }) => callBackend<SavedReport>(ctx.api.post("/reports/saved", input))),
  updateSaved: privateProcedure
    .input(z.object({ id: z.uuid(), name: z.string().optional(), definition: definition.optional() }))
    .mutation(({ ctx, input: { id, ...body } }) =>
      callBackend<SavedReport>(ctx.api.patch(`/reports/saved/${id}`, body)),
    ),
  deleteSaved: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(({ ctx, input }) =>
      callBackend<{ id: string }>(ctx.api.delete(`/reports/saved/${input.id}`)),
    ),
  subscriptions: privateProcedure
    .input(z.object({ businessId }))
    .query(({ ctx, input }) =>
      callBackend<ReportSubscription[]>(ctx.api.get("/reports/automatic/settings", { params: input })),
    ),
  updateSubscription: privateProcedure
    .input(z.object({ businessId, frequency, isActive: z.boolean(), emails: z.array(z.string()) }))
    .mutation(({ ctx, input }) =>
      callBackend<ReportSubscription>(ctx.api.put("/reports/automatic/settings", input)),
    ),
  archives: privateProcedure
    .input(paginationInputSchema.extend({ businessId, frequency: frequency.optional() }))
    .query(({ ctx, input }) =>
      callBackend<ReportArchive, "paginated">(
        ctx.api.get("/reports/archives", { params: input }),
        { mode: "paginated" },
      ),
    ),
  archive: privateProcedure
    .input(z.object({ id: z.uuid() }))
    .query(({ ctx, input }) =>
      callBackend<ReportArchiveDetail>(ctx.api.get(`/reports/archives/${input.id}`)),
    ),
});

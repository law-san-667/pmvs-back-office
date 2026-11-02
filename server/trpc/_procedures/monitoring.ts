import type {
  JobRun,
  MonitoringAlert,
  MonitoringSettings,
  SystemStatus,
} from "@/lib/monitoring";
import { paginationInputSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const settingsInputSchema = z.object({
  emails: z.array(z.email()).max(10).optional(),
  phones: z.array(z.string().trim().min(8)).max(5).optional(),
  serverErrorsPer15Min: z.number().int().min(1).optional(),
  slowP95Ms: z.number().int().min(200).optional(),
  databaseSizeMb: z.number().int().min(100).optional(),
  checkWhatsapp: z.boolean().optional(),
  repeatHours: z.number().int().min(1).max(168).optional(),
});

/** Supervision: admins only, on the API too. */
export const monitoringRouter = createTRPCRouter({
  status: privateProcedure.query(({ ctx }) =>
    callBackend<SystemStatus>(ctx.api.get("/monitoring/status")),
  ),
  jobRuns: privateProcedure
    .input(
      paginationInputSchema.extend({
        name: z.string().optional(),
        status: z.enum(["RUNNING", "SUCCEEDED", "FAILED"]).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<JobRun, "paginated">(
        ctx.api.get("/monitoring/job-runs", { params: input }),
        { mode: "paginated" },
      ),
    ),
  alerts: privateProcedure
    .input(
      paginationInputSchema.extend({
        status: z.enum(["OPEN", "RESOLVED"]).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<MonitoringAlert, "paginated">(
        ctx.api.get("/monitoring/alerts", { params: input }),
        { mode: "paginated" },
      ),
    ),
  settings: privateProcedure.query(({ ctx }) =>
    callBackend<MonitoringSettings>(ctx.api.get("/monitoring/settings")),
  ),
  updateSettings: privateProcedure
    .input(settingsInputSchema)
    .mutation(({ ctx, input }) =>
      callBackend<MonitoringSettings>(ctx.api.patch("/monitoring/settings", input)),
    ),
  runCheck: privateProcedure.mutation(({ ctx }) =>
    callBackend<{ findings: number; opened: number; resolved: number }>(
      ctx.api.post("/monitoring/check"),
    ),
  ),
  testAlert: privateProcedure.mutation(({ ctx }) =>
    callBackend<{ sent: number; failed: number }>(
      ctx.api.post("/monitoring/test-alert"),
    ),
  ),
});

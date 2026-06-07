import { createApiClient, getRequestAuthState } from "@/server/api";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

const BUSINESS_COOKIE_NAME = "active_business_id";

const getBusinessIdFromRequest = (req?: Request | null): string | null => {
  const cookieHeader = req?.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${BUSINESS_COOKIE_NAME}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

/** Called per-request by the fetch adapter (opts.req); called with no args from RSC. */
export const createTRPCContext = async (opts?: {
  req: Request;
  resHeaders: Headers;
}) => {
  const auth = await getRequestAuthState(opts?.req);

  return {
    api: await createApiClient({
      req: opts?.req,
      resHeaders: opts?.resHeaders,
    }),
    auth,
    businessId: getBusinessIdFromRequest(opts?.req),
    req: opts?.req ?? null,
    resHeaders: opts?.resHeaders ?? new Headers(),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});
const middleware = t.middleware;

const isAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.auth.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  return next({
    ctx,
  });
});

/** Logs every procedure call (path, user/ANON, duration, status). Runs after auth so ctx.db is set. */
// const auditLogMiddleware = middleware(async (opts) => {
//   const start = Date.now();
//   const path = opts.path;
//   const type = opts.type;
//   const ctx = opts.ctx as {
//     req?: Request | null;
//     db?: { id: string } | null;
//   };
//   const rawInput = (await opts.getRawInput()) as
//     | { sessionId?: string }
//     | undefined;
//   const sessionId = rawInput?.sessionId ?? null;
//   const userId = ctx.db?.id ?? null;
//   const meta = getRequestMeta(ctx.req ?? null);
//   const base = {
//     ...auditContextFromUserAndReq(userId, ctx.req ?? null, sessionId),
//     path,
//     method: type,
//     source: "TRPC" as const,
//     durationMs: null as number | null,
//     metadata:
//       rawInput && typeof rawInput === "object"
//         ? { inputKeys: Object.keys(rawInput) }
//         : null,
//   };
//   try {
//     const result = await opts.next({ ctx: opts.ctx });
//     void saveAuditLogToRedis(redisClient, {
//       ...base,
//       actionType: path,
//       description: `${type} ${path} succeeded`,
//       status: "SUCCESS",
//       durationMs: Date.now() - start,
//     });
//     return result;
//   } catch (err) {
//     void saveAuditLogToRedis(redisClient, {
//       ...base,
//       actionType: path,
//       description: `${type} ${path} failed: ${err instanceof Error ? err.message : String(err)}`,
//       status: "FAILED",
//       severity: "ERROR",
//       durationMs: Date.now() - start,
//       metadata: {
//         inputKeys:
//           rawInput && typeof rawInput === "object" ? Object.keys(rawInput) : [],
//         error: err instanceof Error ? err.message : String(err),
//       },
//     });
//     throw err;
//   }
// });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
// .use(auditLogMiddleware);

export const privateProcedure = t.procedure.use(isAuth);
// .use(auditLogMiddleware);

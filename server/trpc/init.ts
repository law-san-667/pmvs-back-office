import type { Locale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import frUpload from "@/i18n/messages/fr/upload.json";
import { FALLBACK_ERRORS } from "@/lib/backend-utils";
import type { MessageKey } from "@/lib/validators/messages";
import {
  createApiClient,
  getRequestAuthState,
  getRequestLocale,
} from "@/server/api";
import { TRPCError, initTRPC } from "@trpc/server";
import { createTranslator } from "next-intl";
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
  const [auth, locale] = await Promise.all([
    getRequestAuthState(opts?.req),
    getRequestLocale(opts?.req),
  ]);

  return {
    api: await createApiClient({
      req: opts?.req,
      resHeaders: opts?.resHeaders,
    }),
    auth,
    /** The visitor's language, for the texts this server writes itself. */
    locale,
    businessId: getBusinessIdFromRequest(opts?.req),
    req: opts?.req ?? null,
    resHeaders: opts?.resHeaders ?? new Headers(),
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/** Our own French fallback texts, by their message key. */
const FALLBACK_KEYS = new Map<string, MessageKey>([
  ...Object.entries(FALLBACK_ERRORS).map(
    ([key, text]) => [text, `errors.${key}` as MessageKey] as const,
  ),
  ...Object.entries(frUpload).map(
    ([key, text]) => [text, `upload.${key}` as MessageKey] as const,
  ),
]);

const MESSAGE_KEY = /^[a-z][\w]*\.[\w.]+$/;

/**
 * The visitor's language for a text this server wrote: one of our French
 * fallbacks, or a message key (zod messages of lib/validators). API messages
 * arrive already translated and are left as they are.
 */
const translateServerText = (message: string, locale: Locale) => {
  const t = createTranslator({ locale, messages: messages[locale] });
  const key =
    FALLBACK_KEYS.get(message) ??
    (MESSAGE_KEY.test(message) ? (message as MessageKey) : undefined);
  return key && t.has(key) ? t(key) : null;
};

const firstIssueMessage = (cause: unknown) => {
  const issues = (cause as { issues?: unknown } | undefined)?.issues;
  const first = Array.isArray(issues) ? (issues[0] as { message?: unknown }) : null;
  return typeof first?.message === "string" ? first.message : null;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error, ctx }) => {
    if (!ctx) return shape;
    // Invalid input: the first zod message, when it is one of our keys.
    const issueMessage = firstIssueMessage(error.cause);
    const message =
      (issueMessage && translateServerText(issueMessage, ctx.locale)) ??
      translateServerText(shape.message, ctx.locale);
    return message ? { ...shape, message } : shape;
  },
});
const middleware = t.middleware;

const isAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.auth.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: FALLBACK_ERRORS.authRequired,
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

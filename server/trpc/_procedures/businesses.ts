import type { PayoutAccount } from "@/lib/admin-types";
import type { Business } from "@/lib/backend-resource-types";
import { uuidSchema } from "@/lib/validators/backend-resources";
import { msg } from "@/lib/validators/messages";
import z from "zod";
import {
  createBusinessInputSchema,
  updateBusinessInputSchema,
} from "@/lib/validators/business";
import { callBackend } from "@/server/backend-utils";
import { createTRPCRouter, privateProcedure } from "../init";

const omitUndefined = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

/** LawPay only pays suppliers out to Wave, so the service is not a choice. */
const WAVE_PAYOUT_SERVICE = "Wave Senegal";

const payoutAccountInputSchema = z.object({
  businessId: uuidSchema,
  /** PayDunya: the wallet ("orange-money-senegal"…); LawPay: always Wave. */
  service: z.string().trim().max(60).optional(),
  destinationNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, msg("errors.waveNumberInvalid")),
});

export const businessesRouter = createTRPCRouter({
  /** Operators the supplier can be paid on (PayDunya: by country; LawPay: Wave). */
  payoutServices: privateProcedure
    .input(z.object({ country: z.string().length(2).optional() }))
    .query(({ ctx, input }) =>
      callBackend<string[]>(ctx.api.get("/payout-accounts/services", { params: input })),
    ),
  payoutAccount: privateProcedure
    .input(z.object({ businessId: uuidSchema }))
    .query(({ ctx, input }) =>
      callBackend<PayoutAccount>(
        ctx.api.get(`/businesses/${input.businessId}/payout-account`),
      ),
    ),
  upsertPayoutAccount: privateProcedure
    .input(payoutAccountInputSchema)
    .mutation(({ ctx, input }) => {
      const { businessId, ...payload } = input;

      return callBackend<PayoutAccount>(
        ctx.api.put(`/businesses/${businessId}/payout-account`, {
          ...payload,
          service: payload.service ?? WAVE_PAYOUT_SERVICE,
        }),
      );
    }),
  updatePayoutAccountStatus: privateProcedure
    .input(
      z.object({
        businessId: uuidSchema,
        status: z.enum(["ACTIVE", "SUSPENDED"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<PayoutAccount>(
        ctx.api.patch(`/businesses/${input.businessId}/payout-account/status`, {
          status: input.status,
        }),
      ),
    ),
  myBusiness: privateProcedure.query(({ ctx }) =>
    callBackend<Business>(ctx.api.get("/businesses/me")),
  ),
  create: privateProcedure
    .input(createBusinessInputSchema)
    .mutation(({ ctx, input }) => {
      return callBackend<Business>(
        ctx.api.post("/businesses", omitUndefined(input)),
      );
    }),
  update: privateProcedure
    .input(updateBusinessInputSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...rest } = input;

      return callBackend<Business>(
        ctx.api.patch(`/businesses/${id}`, omitUndefined(rest)),
      );
    }),
});

import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

export const CLASSIFIED_STATUSES = [
  "PENDING",
  "PUBLISHED",
  "REJECTED",
  "CLOSED",
] as const;
export type ClassifiedStatus = (typeof CLASSIFIED_STATUSES)[number];
export type ClassifiedType = "OFFER" | "DEMAND";
export type ClassifiedProfile =
  | "AUTO_ENTREPRENEUR"
  | "PRODUCER"
  | "EXPORTER"
  | "IMPORTER"
  | "RESELLER"
  | "SERVICE_PROVIDER"
  | "OTHER";

/** A « petite annonce » as returned by the backend (classifiedViewSchema). */
export type Classified = {
  id: string;
  type: ClassifiedType;
  status: ClassifiedStatus;
  publisherUserId: string;
  publisherBusinessId: string | null;
  publisherProfile: ClassifiedProfile;
  categoryId: string;
  subCategoryId: string | null;
  title: string;
  description: string;
  images: string[];
  quantity: number | null;
  unit: string | null;
  priceMinor: number | null;
  currency: string;
  incoterm: string | null;
  countryCode: string;
  city: string | null;
  diffusionScope: "COUNTRY" | "COUNTRIES" | "ZLECAF";
  diffusionCountries: string[];
  expiresAt: string;
  publishedAt: string | null;
  moderationReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  publisherBusiness: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  } | null;
  publisherName: string | null;
  category: { id: string; name: string };
  subCategory: { id: string; name: string } | null;
  isActive: boolean;
};

export const classifiedsRouter = createTRPCRouter({
  /** Admin queue: pending ones come oldest first. */
  adminList: privateProcedure
    .input(
      z.object({
        page: z.number().int().positive(),
        limit: z.number().int().positive().max(100),
        status: z.enum(CLASSIFIED_STATUSES).optional(),
        type: z.enum(["OFFER", "DEMAND"]).optional(),
        search: z.string().trim().min(1).max(200).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<Classified, "paginated">(
        ctx.api.get("/admin/classifieds", { params: input }),
        { mode: "paginated" },
      ),
    ),
  moderate: privateProcedure
    .input(
      z.object({
        id: z.uuid(),
        status: z.enum(["PUBLISHED", "REJECTED"]),
        reason: z.string().trim().min(1).max(1000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...payload } = input;
      return callBackend<Classified>(
        ctx.api.patch(`/admin/classifieds/${id}/moderation`, payload),
      );
    }),
});

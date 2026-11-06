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
  /** Lot H: full commercial offer (all optional). */
  priceKind: "B2B" | "B2C" | null;
  originCountryCode: string | null;
  productName: string | null;
  productModel: string | null;
  productBrand: string | null;
  hsCode: string | null;
  productionCapacity: string | null;
  deliveryLead: string | null;
  minimumOrder: string | null;
  certifications: string | null;
  paymentTerms: string | null;
};

export const CLASSIFIED_CONTACT_STATUSES = [
  "OPEN",
  "IN_DISCUSSION",
  "CONCLUDED",
  "NO_FOLLOW_UP",
] as const;
export type ClassifiedContactStatus =
  (typeof CLASSIFIED_CONTACT_STATUSES)[number];

/** A « mise en relation »: someone answered a classified. */
export type ClassifiedContact = {
  id: string;
  classifiedId: string;
  conversationId: string;
  responderUserId: string;
  responderBusinessId: string | null;
  status: ClassifiedContactStatus;
  /** Given by the classified's author to the responder. */
  publisherRating: number | null;
  publisherComment: string | null;
  /** Given by the responder to the classified's author. */
  responderRating: number | null;
  responderComment: string | null;
  createdAt: string;
  updatedAt: string;
  classified: {
    id: string;
    type: ClassifiedType;
    title: string;
    status: ClassifiedStatus;
  };
  publisherName: string | null;
  responderName: string | null;
};

export type ClassifiedContactStats = {
  total: number;
  byStatus: Record<ClassifiedContactStatus, number>;
  byType: Record<ClassifiedType, number>;
  conclusionRate: number | null;
  averageRating: number | null;
  ratingsCount: number;
  /** Offer–demand matches found by the platform. */
  pairs: number;
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
  /** Platform follow-up of the « mises en relation ». */
  contactStats: privateProcedure.query(({ ctx }) =>
    callBackend<ClassifiedContactStats>(
      ctx.api.get("/admin/classified-contacts/stats"),
    ),
  ),
  adminContacts: privateProcedure
    .input(
      z.object({
        page: z.number().int().positive(),
        limit: z.number().int().positive().max(100),
        status: z.enum(CLASSIFIED_CONTACT_STATUSES).optional(),
        type: z.enum(["OFFER", "DEMAND"]).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      callBackend<ClassifiedContact, "paginated">(
        ctx.api.get("/admin/classified-contacts", { params: input }),
        { mode: "paginated" },
      ),
    ),
});

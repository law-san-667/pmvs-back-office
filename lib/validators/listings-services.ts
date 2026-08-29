import z from "zod";
import { paginationInputSchema, uuidSchema } from "./backend-resources";

export interface ListingSpecificsSection {
  title: string;
  items: {
    label: string;
    value: string | number | boolean | null;
  }[];
}

export interface ListingImages {
  order: number;
  url: string;
}

export const listingConditionEnum = [
  "NEW",
  "LIKE_NEW",
  "USED",
  "REFURBISHED",
] as const;

export const listingStatusEnum = [
  "DRAFT",
  "PUBLISHED",
  "PAUSED",
  "SOLD",
  "ARCHIVED",
] as const;

const listingConditionSchema = z.enum(listingConditionEnum);
const listingStatusSchema = z.enum(listingStatusEnum);
const listingSpecificsSectionsSchema: z.ZodType<ListingSpecificsSection[]> =
  z.array(
    z.object({
      title: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
        }),
      ),
    }),
  );

export const listingsQuerySchema = paginationInputSchema.extend({
  orderBy: z
    .enum(["title", "priceAmountMinor", "createdAt", "updatedAt"])
    .default("createdAt"),
  businessSlug: z.string().trim().optional(),
  createdByUserId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  subCategoryId: uuidSchema.optional(),
  title: z.string().trim().optional(),
  condition: listingConditionSchema.optional(),
  status: listingStatusSchema.optional(),
  isService: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  currency: z.string().trim().optional(),
  countryCode: z.string().trim().optional(),
  cities: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    )
    .optional(),
  minPriceAmountMinor: z.coerce.number().int().nonnegative().optional(),
  maxPriceAmountMinor: z.coerce.number().int().nonnegative().optional(),
});

export const createListingSchema = z.object({
  categoryId: uuidSchema,
  subCategoryId: uuidSchema,
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        order: z.number(),
        url: z.string(),
      }),
    )
    .optional(),
  video: z.url().nullable().optional(),
  specificsSections: listingSpecificsSectionsSchema.optional(),
  condition: listingConditionSchema.optional(),
  status: listingStatusSchema.optional(),
  isService: z.boolean().optional(),
  isFragile: z.boolean().nullable().optional(),
  validityPeriod: z.number().int().nonnegative().nullable().optional(),
  origin: z.string().trim().min(1).nullable().optional(),
  destination: z.array(z.string().trim().min(1)).nullable().optional(),
  // -1 indicates a "sur devis" (price on quote) listing.
  priceAmountMinor: z.number().int().min(-1),
  currency: z.string().trim().min(1).optional(),
  quantityAvailable: z.number().int().positive().optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  id: uuidSchema,
});

export type Listing = {
  id: string;
  businessId: string;
  createdByUserId: string | null;
  categoryId: string;
  subCategoryId: string;
  title: string;
  description: string | null;
  images: unknown;
  video: string | null;
  specificsSections: ListingSpecificsSection[];
  condition: "NEW" | "LIKE_NEW" | "USED" | "REFURBISHED";
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "SOLD" | "ARCHIVED";
  isService: boolean;
  isFragile: boolean | null;
  validityPeriod: number | null;
  origin: string | null;
  destination: string[] | null;
  priceAmountMinor: number;
  currency: string;
  quantityAvailable: number;
  cities: string[];
  countryCode: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  subCategory: {
    id: string;
    slug: string;
    name: string;
  };
};

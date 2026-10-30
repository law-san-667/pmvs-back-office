import {
  type AdminContentPage,
  CONTENT_LOCALES,
  type SiteSettings,
} from "@/lib/content-format";
import { uuidSchema } from "@/lib/validators/backend-resources";
import { callBackend } from "@/server/backend-utils";
import z from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const blockSchema = z.union([
  z.object({ kind: z.literal("p"), text: z.string() }),
  z.object({ kind: z.literal("li"), items: z.array(z.string()) }),
]);
const linkSchema = z.object({ label: z.string(), href: z.string() });

export const contentRouter = createTRPCRouter({
  pages: privateProcedure.query(({ ctx }) =>
    callBackend<AdminContentPage[]>(ctx.api.get("/admin/content/pages")),
  ),
  createPage: privateProcedure
    .input(z.object({ slug: z.string().trim(), title: z.string().trim() }))
    .mutation(({ ctx, input }) =>
      callBackend<AdminContentPage>(
        ctx.api.post("/admin/content/pages", { ...input, kind: "CUSTOM" }),
      ),
    ),
  setPublished: privateProcedure
    .input(z.object({ id: uuidSchema, isPublished: z.boolean() }))
    .mutation(({ ctx, input }) =>
      callBackend<AdminContentPage>(
        ctx.api.patch(`/admin/content/pages/${input.id}`, {
          isPublished: input.isPublished,
        }),
      ),
    ),
  saveTranslation: privateProcedure
    .input(
      z.object({
        id: uuidSchema,
        locale: z.enum(CONTENT_LOCALES),
        title: z.string().trim(),
        summary: z.string().trim().nullable(),
        sections: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            blocks: z.array(blockSchema),
          }),
        ),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, locale, ...payload } = input;
      return callBackend<AdminContentPage>(
        ctx.api.put(
          `/admin/content/pages/${id}/translations/${locale}`,
          payload,
        ),
      );
    }),
  site: privateProcedure.query(({ ctx }) =>
    callBackend<SiteSettings>(ctx.api.get("/content/site")),
  ),
  saveSite: privateProcedure
    .input(
      z.object({
        contact: z.object({
          legalName: z.string(),
          tradeName: z.string(),
          address: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          whatsapp: z.string().nullable().optional(),
          email: z.string().nullable().optional(),
        }),
        tagline: z.string().nullable().optional(),
        socialLinks: z.array(linkSchema),
        footerColumns: z.array(
          z.object({ title: z.string(), links: z.array(linkSchema) }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      callBackend<SiteSettings>(ctx.api.put("/admin/content/site", input)),
    ),
});

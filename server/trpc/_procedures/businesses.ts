import type { Business } from "@/lib/backend-resource-types";
import type { PublicUser } from "@/lib/backend-utils";
import {
  createBusinessInputSchema,
  uploadBusinessFilesInputSchema,
  type SerializedFile,
} from "@/lib/validators/business";
import { callBackend } from "@/server/backend-utils";
import { uploadFileToR2 } from "@/server/r2";
import { createTRPCRouter, privateProcedure } from "../init";

const omitUndefined = <T extends Record<string, unknown>>(input: T) =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

const uploadSerializedFile = (
  file: SerializedFile,
  userId: string,
  dir: string,
) =>
  uploadFileToR2(
    Buffer.from(file.base64, "base64"),
    file.name,
    file.type,
    userId,
    dir,
  );

export const businessesRouter = createTRPCRouter({
  myBusiness: privateProcedure.query(({ ctx }) =>
    callBackend<Business>(ctx.api.get("/businesses/me")),
  ),
  uploadFiles: privateProcedure
    .input(uploadBusinessFilesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await callBackend<PublicUser>(ctx.api.get("/me"));
      const userId = user.id;
      const [image, legalDocuments] = await Promise.all([
        input.image
          ? uploadSerializedFile(input.image, userId, "businesses/images")
          : null,
        Promise.all(
          (input.legalDocuments ?? []).map((document) =>
            uploadSerializedFile(
              document,
              userId,
              "businesses/legal-documents",
            ),
          ),
        ),
      ]);

      return {
        image: image?.key,
        legalDocuments: legalDocuments.map((document) => document.key),
      };
    }),
  create: privateProcedure
    .input(createBusinessInputSchema)
    .mutation(({ ctx, input }) => {
      return callBackend<Business>(
        ctx.api.post("/businesses", omitUndefined(input)),
      );
    }),
});

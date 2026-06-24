import { createPresignedR2Upload } from "@/lib/r2";
import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "../init";

const mediaDirSchema = z.enum(["images", "videos", "docs"]);

export const mediaRouter = createTRPCRouter({
  createUpload: privateProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1).max(255),
        contentType: z.string().trim().min(1).max(120),
        dir: mediaDirSchema,
      }),
    )
    .mutation(async ({ input }) =>
      createPresignedR2Upload(input.fileName, input.contentType, input.dir),
    ),
});

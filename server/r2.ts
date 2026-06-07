import { env } from "@/config/env/server";
import type {
  DeleteObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const BUCKET_NAME = env.CLOUDFLARE_R2_BUCKET;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_KEY,
  },
  forcePathStyle: true,
});

export interface UploadResult {
  key: string;
  url?: string;
}

function normalizePublicUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getFileFromR2(key: string) {
  if (!env.CLOUDFLARE_R2_PUBLIC_URL)
    throw new Error("Missing CLOUDFLARE_R2_PUBLIC_URL");

  return `${normalizePublicUrl(env.CLOUDFLARE_R2_PUBLIC_URL)}/${key}`;
}

export async function getObjectToBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);
  const body = response.Body;

  if (!body) throw new Error("Empty R2 object");

  const bytes = await body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteFileFromR2(key: string) {
  try {
    const params: DeleteObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await r2Client.send(new DeleteObjectCommand(params));
    return true;
  } catch (error) {
    console.error("Error deleting file from R2:", error);
    throw new Error("Failed to delete file from R2");
  }
}

/**
 * Upload a file (image or video) to Cloudflare R2.
 * Images are resized via sharp; videos are stored as-is.
 */
export async function uploadFileToR2(
  file: Buffer,
  fileName: string,
  contentType: string = "image/jpeg",
  userId: string,
  dir?: string,
): Promise<UploadResult> {
  const fileExtension = fileName.split(".").pop() || "jpg";
  const uniqueKey = dir
    ? `${dir}/${userId}/${crypto.randomUUID()}.${fileExtension}`
    : `media/${userId}/${crypto.randomUUID()}.${fileExtension}`;

  const isImage = contentType.startsWith("image/");

  const body = isImage
    ? await sharp(file)
        .resize({ height: 1920, width: 1440, fit: "cover" })
        .toBuffer()
    : file;

  const params: PutObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: uniqueKey,
    Body: body,
    ContentType: contentType,
  };

  try {
    await r2Client.send(new PutObjectCommand(params));

    return {
      key: uniqueKey,
      url: env.CLOUDFLARE_R2_PUBLIC_URL ? getFileFromR2(uniqueKey) : undefined,
    };
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
}

/**
 * Upload multiple files to Cloudflare R2.
 */
export async function uploadMultipleFilesToR2(
  files: Array<{
    buffer: Buffer;
    fileName: string;
    contentType?: string;
    userId: string;
    dir?: string;
  }>,
): Promise<UploadResult[]> {
  const uploadPromises = files.map(async (file) =>
    uploadFileToR2(
      file.buffer,
      file.fileName,
      file.contentType,
      file.userId,
      file.dir,
    ),
  );

  return Promise.all(uploadPromises);
}

// Backward-compatible aliases so the rest of your code does not break immediately.
export const getFileFromS3 = getFileFromR2;
export const deleteFileFromS3 = deleteFileFromR2;
export const uploadFileToS3 = uploadFileToR2;
export const uploadMultipleFilesToS3 = uploadMultipleFilesToR2;

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
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export interface PresignedUploadResult extends UploadResult {
  uploadUrl: string;
}

function normalizePublicUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const getFileExtension = (fileName: string, contentType: string) => {
  const extension = fileName.split(".").pop()?.trim();

  if (extension) {
    return extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  }

  return contentType.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
};

const createUploadKey = (
  fileName: string,
  contentType: string,
  dir?: string,
) => {
  const fileExtension = getFileExtension(fileName, contentType);
  const prefix = dir?.replace(/^\/+|\/+$/g, "") || "media";

  return `${prefix}/${fileName.replace(/\//g, "-")}_${crypto.randomUUID()}.${fileExtension}`;
};

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
 */
export async function uploadFileToR2(
  file: Buffer,
  fileName: string,
  contentType: string = "image/jpeg",
  _userId: string,
  dir?: string,
): Promise<UploadResult> {
  const uniqueKey = createUploadKey(
    fileName,
    contentType,
    dir ?? (contentType.startsWith("video/") ? "videos" : "images"),
  );

  const params: PutObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key: uniqueKey,
    Body: file,
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

export async function createPresignedR2Upload(
  fileName: string,
  contentType: string,
  dir?: string,
): Promise<PresignedUploadResult> {
  const uniqueKey = createUploadKey(fileName, contentType, dir);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueKey,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

  return {
    key: uniqueKey,
    uploadUrl,
    url: env.CLOUDFLARE_R2_PUBLIC_URL ? getFileFromR2(uniqueKey) : undefined,
  };
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

"use client";

type R2UploadDir = "images" | "videos" | "docs";

type CreateUploadInput = {
  fileName: string;
  contentType: string;
  dir: R2UploadDir;
};

type CreateUploadResult = {
  uploadUrl: string;
  url?: string;
};

export type CreateR2Upload = (
  input: CreateUploadInput,
) => Promise<CreateUploadResult>;

export const existingMediaUrl = (value: string | null | undefined) =>
  value?.startsWith("http://") || value?.startsWith("https://")
    ? value
    : undefined;

export function uploadFileWithProgress(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const contentType = file.type || "application/octet-stream";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error("Failed to upload file to R2."));
    };
    xhr.onerror = () => reject(new Error("Failed to upload file to R2."));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(file);
  });
}

export async function uploadFileToR2FromBrowser(
  file: File | undefined,
  dir: R2UploadDir,
  createUpload: CreateR2Upload,
  onProgress?: (progress: number) => void,
) {
  if (!file) {
    return undefined;
  }

  const upload = await createUpload({
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    dir,
  });

  if (!upload.url) {
    throw new Error("R2 public URL is not configured.");
  }

  await uploadFileWithProgress(file, upload.uploadUrl, onProgress);

  return upload.url;
}

export async function uploadFilesToR2FromBrowser(
  files: File[],
  dir: R2UploadDir,
  createUpload: CreateR2Upload,
  onProgress?: (progress: number) => void,
) {
  if (files.length === 0) {
    return [];
  }

  const progressByFile = new Array(files.length).fill(0);
  const updateProgress = (index: number, progress: number) => {
    progressByFile[index] = progress;
    const totalProgress =
      progressByFile.reduce((total, value) => total + value, 0) / files.length;
    onProgress?.(Math.round(totalProgress));
  };

  return Promise.all(
    files.map((file, index) =>
      uploadFileToR2FromBrowser(file, dir, createUpload, (progress) =>
        updateProgress(index, progress),
      ),
    ),
  );
}

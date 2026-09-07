"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getCroppedImgSquare, type CroppedArea } from "@/lib/crop-image";
import {
  existingMediaUrl,
  uploadFileToR2FromBrowser,
  uploadFilesToR2FromBrowser,
  type CreateR2Upload,
} from "@/lib/upload-to-r2";
import {
  listingImageKindEnum,
  type ListingImageKind,
  type ListingImages,
} from "@/lib/validators/listings-services";
import { ImageIcon, VideoIcon, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";

export const IMAGE_KIND_LABELS: Record<ListingImageKind, string> = {
  MAIN: "Photo principale",
  BACK: "Photo de dos",
  SIDE: "Photo de côté",
  OTHER: "Autre photo",
};

/** An image attached to the listing: already uploaded (`url`) or pending (`file`). */
export type ManagedImage = {
  key: string;
  url?: string;
  file?: File;
  preview: string;
  cropped: boolean;
  label: string;
  kind: ListingImageKind;
};

type ManagedVideo = { file: File; preview: string };

const parseExistingImages = (images: unknown): ManagedImage[] => {
  if (!Array.isArray(images)) return [];

  return images
    .filter(
      (image): image is ListingImages =>
        typeof image === "object" &&
        image !== null &&
        "url" in image &&
        typeof image.url === "string",
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((image, index) => ({
      key: `existing-${image.url}`,
      url: image.url,
      preview: image.url,
      cropped: true,
      label: image.label ?? "",
      kind: image.kind ?? (index === 0 ? "MAIN" : "OTHER"),
    }));
};

const nextKind = (images: ManagedImage[]): ListingImageKind =>
  images.length === 0 ? "MAIN" : "OTHER";

/**
 * Owns the images/video of a listing form: previews, cropping, removal and
 * the final upload to R2. `initial` is read once, so render the form only
 * after the listing has loaded when editing.
 */
export function useListingMedia(initial?: {
  images: unknown;
  video: string | null;
}) {
  const [images, setImages] = useState<ManagedImage[]>(() =>
    parseExistingImages(initial?.images),
  );
  const [video, setVideo] = useState<ManagedVideo | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | undefined>(
    () => existingMediaUrl(initial?.video),
  );

  const [cropTarget, setCropTarget] = useState<{
    key: string;
    src: string;
  } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedArea | null>(null);

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const onImageDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const added = acceptedFiles.map((file, index) => ({
      key: `new-${Date.now()}-${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      cropped: false,
      label: "",
      kind: "OTHER" as ListingImageKind,
    }));

    setImages((prev) => {
      const [first, ...rest] = added;
      return [...prev, { ...first, kind: nextKind(prev) }, ...rest];
    });

    // Open the cropper on the first dropped image right away.
    void readAsDataUrl(added[0].file).then((src) =>
      setCropTarget({ key: added[0].key, src }),
    );
  }, []);

  const removeImage = (key: string) => {
    setImages((prev) => {
      const removed = prev.find((image) => image.key === key);
      if (removed?.file) URL.revokeObjectURL(removed.preview);
      return prev.filter((image) => image.key !== key);
    });
  };

  const updateImage = (
    key: string,
    patch: Partial<Pick<ManagedImage, "label" | "kind">>,
  ) => {
    setImages((prev) =>
      prev.map((image) =>
        image.key === key ? { ...image, ...patch } : image,
      ),
    );
  };

  const openCrop = (key: string) => {
    const image = images.find((item) => item.key === key);
    if (!image?.file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    void readAsDataUrl(image.file).then((src) => setCropTarget({ key, src }));
  };

  const closeCrop = () => setCropTarget(null);

  const onCropComplete = useCallback(
    (_: CroppedArea, croppedPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedPixels);
    },
    [],
  );

  const saveCrop = async () => {
    if (!cropTarget || !croppedAreaPixels) return;

    const blob = await getCroppedImgSquare(cropTarget.src, croppedAreaPixels);
    const file = new File([blob], `product-image-${Date.now()}.png`, {
      type: "image/png",
    });
    const preview = URL.createObjectURL(blob);

    setImages((prev) =>
      prev.map((image) =>
        image.key === cropTarget.key
          ? { ...image, file, preview, cropped: true }
          : image,
      ),
    );
    setCropTarget(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setVideo((current) => {
      if (current) URL.revokeObjectURL(current.preview);
      return { file, preview: URL.createObjectURL(file) };
    });
  }, []);

  const removeVideo = () => {
    setVideo((current) => {
      if (current) URL.revokeObjectURL(current.preview);
      return null;
    });
    setExistingVideo(undefined);
  };

  const imageDropzone = useDropzone({
    onDrop: onImageDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const videoDropzone = useDropzone({
    onDrop: onVideoDrop,
    accept: {
      "video/mp4": [".mp4"],
      "video/webm": [".webm"],
      "video/quicktime": [".mov"],
    },
    maxFiles: 1,
    multiple: false,
  });

  /**
   * Uploads pending files and returns the payload fields. Progress is
   * reported as a 0–100 percentage across every file.
   */
  const uploadMedia = async (
    createUpload: CreateR2Upload,
    onProgress: (progress: number) => void,
  ): Promise<{ images: ListingImages[]; video: string | null }> => {
    const pending = images.filter((image) => image.file);
    const pendingFiles = pending.map((image) => image.file as File);
    const fileCount = pendingFiles.length + (video ? 1 : 0);

    const uploadedUrls = pendingFiles.length
      ? await uploadFilesToR2FromBrowser(
          pendingFiles,
          "images",
          createUpload,
          (progress) =>
            onProgress(Math.round((progress * pendingFiles.length) / fileCount)),
        )
      : [];

    const uploadedVideoUrl = video
      ? await uploadFileToR2FromBrowser(
          video.file,
          "videos",
          createUpload,
          (progress) =>
            onProgress(
              Math.round((pendingFiles.length * 100 + progress) / fileCount),
            ),
        )
      : undefined;

    onProgress(100);

    const urlByKey = new Map(
      pending.map((image, index) => [image.key, uploadedUrls[index]]),
    );

    const resolvedImages: ListingImages[] = [];
    images.forEach((image) => {
      const url = image.url ?? urlByKey.get(image.key);
      if (!url) return;
      resolvedImages.push({
        order: resolvedImages.length,
        url,
        ...(image.label.trim() ? { label: image.label.trim() } : {}),
        kind: image.kind,
      });
    });

    return {
      images: resolvedImages,
      video: uploadedVideoUrl ?? existingVideo ?? null,
    };
  };

  return {
    images,
    video,
    existingVideo,
    imageDropzone,
    videoDropzone,
    removeImage,
    updateImage,
    openCrop,
    removeVideo,
    uploadMedia,
    crop: {
      target: cropTarget,
      crop,
      zoom,
      setCrop,
      setZoom,
      onCropComplete,
      save: saveCrop,
      close: closeCrop,
    },
  };
}

export type ListingMedia = ReturnType<typeof useListingMedia>;

export function ListingMediaFields({
  media,
  withLabels = false,
  subject = "produit",
}: {
  media: ListingMedia;
  /** Show the photo type and image name (keywords) under each image. */
  withLabels?: boolean;
  subject?: string;
}) {
  const { images, video, existingVideo, imageDropzone, videoDropzone } = media;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div
          {...imageDropzone.getRootProps()}
          className="border-primary/40 hover:border-primary flex size-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
        >
          <input {...imageDropzone.getInputProps()} />
          <ImageIcon className="text-primary/60 size-8" />
          <span className="text-primary text-xs font-medium">
            Ajouter une image
          </span>
        </div>

        {images.map((image, index) => (
          <div key={image.key} className="flex w-32 flex-col gap-2">
            <div className="group relative size-32 overflow-hidden rounded-lg">
              {image.file ? (
                <Image
                  src={image.preview}
                  alt={image.label || `Image ${index + 1}`}
                  fill
                  className="cursor-pointer object-cover"
                  onClick={() => media.openCrop(image.key)}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.preview}
                  alt={image.label || `Image existante ${index + 1}`}
                  className="size-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => media.removeImage(image.key)}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Retirer l'image"
              >
                <X className="size-3" />
              </button>
              {image.file && !image.cropped && (
                <div className="bg-destructive/80 absolute right-0 bottom-0 left-0 py-0.5 text-center text-[10px] text-white">
                  Non recadré
                </div>
              )}
            </div>
            {withLabels && (
              <>
                <select
                  value={image.kind}
                  onChange={(event) =>
                    media.updateImage(image.key, {
                      kind: event.target.value as ListingImageKind,
                    })
                  }
                  className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                  aria-label="Type de photo"
                >
                  {listingImageKindEnum.map((kind) => (
                    <option key={kind} value={kind}>
                      {IMAGE_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
                <Input
                  value={image.label}
                  onChange={(event) =>
                    media.updateImage(image.key, { label: event.target.value })
                  }
                  placeholder="Nom / mots-clés"
                  className="h-8 text-xs"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div>
          <FieldLabel>Vidéo (facultative)</FieldLabel>
          <p className="text-muted-foreground mt-1 text-xs">
            Une seule vidéo au format MP4, WebM ou MOV.
          </p>
        </div>

        {video || existingVideo ? (
          <div className="group relative max-w-xl overflow-hidden rounded-lg border bg-black">
            <video
              src={video?.preview ?? existingVideo}
              controls
              preload="metadata"
              playsInline
              className="aspect-video w-full"
              aria-label={`Vidéo du ${subject}`}
            >
              Votre navigateur ne prend pas en charge la lecture de vidéos.
            </video>
            <button
              type="button"
              onClick={media.removeVideo}
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Supprimer la vidéo"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            {...videoDropzone.getRootProps()}
            className="border-primary/40 hover:border-primary flex h-32 max-w-xl cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors"
          >
            <input {...videoDropzone.getInputProps()} />
            <VideoIcon className="text-primary/60 size-8" />
            <span className="text-primary text-xs font-medium">
              Ajouter une vidéo
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export function ListingMediaCard(props: {
  media: ListingMedia;
  withLabels?: boolean;
  subject?: string;
  hint?: string;
}) {
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="font-bold">
          Médias du {props.subject ?? "produit"}
        </CardTitle>
        {props.hint && (
          <p className="text-muted-foreground text-sm">{props.hint}</p>
        )}
      </CardHeader>
      <CardContent>
        <ListingMediaFields {...props} />
      </CardContent>
    </Card>
  );
}

export function ListingCropDialog({ media }: { media: ListingMedia }) {
  const { crop } = media;

  return (
    <Dialog open={crop.target !== null} onOpenChange={(o) => !o && crop.close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recadrer l&apos;image (carré)</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 w-full">
          {crop.target && (
            <Cropper
              image={crop.target.src}
              crop={crop.crop}
              zoom={crop.zoom}
              aspect={1}
              cropShape="rect"
              showGrid
              onCropChange={crop.setCrop}
              onZoomChange={crop.setZoom}
              onCropComplete={crop.onCropComplete}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={crop.close}>
            Annuler
          </Button>
          <Button onClick={() => void crop.save()}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

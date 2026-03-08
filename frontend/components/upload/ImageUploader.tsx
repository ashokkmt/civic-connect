"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePreviewGrid } from "@/components/upload/ImagePreviewGrid";

type UploadStatus = "queued" | "uploading" | "uploaded" | "error";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: UploadStatus;
  uploadedUrl?: string;
  error?: string;
};

type ImageUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onError?: (message: string | null) => void;
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ImageUploader({ value, onChange, onUploadingChange, onError }: ImageUploaderProps) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const [items, setItems] = useState<UploadItem[]>([]);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const uploading = useMemo(
    () => items.some((item) => item.status === "queued" || item.status === "uploading"),
    [items]
  );

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [items]);

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    if (!cloudName || !uploadPreset) {
      onError?.("Cloudinary environment variables are not configured.");
      return;
    }

    onError?.(null);
    const incoming = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "queued" as const,
      }));

    if (incoming.length === 0) {
      onError?.("Select at least one valid image file.");
      return;
    }

    setItems((prev) => [...prev, ...incoming]);

    for (const item of incoming) {
      await uploadSingle(item, cloudName, uploadPreset);
    }
  };

  const uploadSingle = async (item: UploadItem, cloudName: string, uploadPreset: string) => {
    updateItem(item.id, { status: "uploading", progress: 15, error: undefined });

    try {
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      updateItem(item.id, { progress: 85 });

      const payload = (await response.json()) as { secure_url?: string; error?: { message?: string } };

      if (!response.ok || !payload.secure_url) {
        const message = payload.error?.message ?? "Image upload failed.";
        updateItem(item.id, { status: "error", progress: 100, error: message });
        onError?.(message);
        return;
      }

      updateItem(item.id, { status: "uploaded", progress: 100, uploadedUrl: payload.secure_url });
      onChange([...valueRef.current, payload.secure_url]);
      onError?.(null);
    } catch {
      const message = "Image upload failed due to network error.";
      updateItem(item.id, { status: "error", progress: 100, error: message });
      onError?.(message);
    }
  };

  const removeItem = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    URL.revokeObjectURL(item.previewUrl);
    setItems((prev) => prev.filter((entry) => entry.id !== id));

    if (item.uploadedUrl) {
      onChange(valueRef.current.filter((url) => url !== item.uploadedUrl));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Upload issue images
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Select one or more images to upload</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      <ImagePreviewGrid
        items={items.map((item) => ({
          id: item.id,
          name: item.file.name,
          previewUrl: item.previewUrl,
          status: item.status,
          progress: item.progress,
          error: item.error,
        }))}
        onRemove={removeItem}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type IssueImageLightboxProps = {
  imageUrls?: string[];
  altPrefix?: string;
  thumbnailClassName?: string;
  gridClassName?: string;
};

export function IssueImageLightbox({
  imageUrls,
  altPrefix = "Issue image",
  thumbnailClassName = "h-28 w-full object-cover",
  gridClassName = "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
}: IssueImageLightboxProps) {
  const images = useMemo(() => imageUrls?.filter((url) => Boolean(url?.trim())) ?? [], [imageUrls]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400">No uploaded images available.</p>;
  }

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const prev = () => {
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  };

  const next = () => {
    setActiveIndex((index) => (index + 1) % images.length);
  };

  return (
    <>
      <div className={gridClassName}>
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => openAt(index)}
            className="overflow-hidden rounded-lg border border-[var(--border)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${altPrefix} ${index + 1}`} className={thumbnailClassName} loading="lazy" />
          </button>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[60] bg-black/80 p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close image viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex h-full max-w-5xl items-center justify-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeIndex]} alt={`${altPrefix} ${activeIndex + 1}`} className="max-h-[78vh] w-full object-contain" />
              <div className="flex items-center justify-between border-t border-white/20 px-4 py-2 text-xs text-white/80">
                <span>{`Image ${activeIndex + 1} of ${images.length}`}</span>
                <span>Click arrows to browse</span>
              </div>
            </div>

            <button
              type="button"
              onClick={next}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

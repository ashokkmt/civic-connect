"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ImageGalleryProps = {
  imageUrls?: string[];
};

export function ImageGallery({ imageUrls }: ImageGalleryProps) {
  const images = useMemo(() => imageUrls?.filter((url) => Boolean(url?.trim())) ?? [], [imageUrls]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const previous = () => {
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  };

  const next = () => {
    setActiveIndex((index) => (index + 1) % images.length);
  };

  if (images.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">No uploaded images available for this issue yet.</p>
      </section>
    );
  }

  const secondaryImages = images.slice(1, 4);

  return (
    <>
      <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt="Issue evidence 1"
            className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.01] sm:h-72 lg:h-80"
            loading="lazy"
          />
        </button>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {secondaryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => openAt(index + 1)}
              className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Issue evidence ${index + 2}`}
                className="h-24 w-full object-cover transition duration-300 group-hover:scale-[1.01] sm:h-28 lg:h-[104px]"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

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
              onClick={previous}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIndex]}
                alt={`Issue evidence ${activeIndex + 1}`}
                className="max-h-[78vh] w-full object-contain"
              />
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
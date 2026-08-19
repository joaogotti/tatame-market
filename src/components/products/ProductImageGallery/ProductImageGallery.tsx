"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { ProductGalleryImage } from "@/lib/productImages";

type ProductImageGalleryProps = {
  images: ProductGalleryImage[];
  title: string;
};

/** Mantém somente a troca de imagens no cliente; os dados vêm da página server. */
export function ProductImageGallery({
  images,
  title,
}: ProductImageGalleryProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const selectedImage =
    images.find((image) => image.url === selectedUrl) ?? images[0] ?? null;

  return (
    <div className="bg-zinc-950">
      <div className="relative min-h-80 lg:min-h-[32rem]">
        {selectedImage ? (
          <Image
            src={selectedImage.url}
            alt={title}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-600">
            <ImageOff aria-hidden="true" size={48} strokeWidth={1.5} />
            <span className="text-sm font-medium">Imagem indisponível</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto border-t border-white/10 p-3">
          {images.map((image, index) => {
            const isSelected = image.url === selectedImage?.url;

            return (
              <button
                key={image.url}
                type="button"
                aria-label={`Exibir imagem ${index + 1} de ${title}`}
                aria-pressed={isSelected}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition ${
                  isSelected
                    ? "border-[#58C447]"
                    : "border-white/10 hover:border-white/30"
                }`}
                onClick={() => setSelectedUrl(image.url)}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

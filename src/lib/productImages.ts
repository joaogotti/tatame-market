import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGES = 6;
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type ProductImageMimeType = (typeof PRODUCT_IMAGE_MIME_TYPES)[number];

const IMAGE_EXTENSIONS: Record<ProductImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ProductImageRecord = {
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
};

export type ProductGalleryImage = {
  url: string;
  sortOrder: number;
  isPrimary: boolean;
};

function isSupportedMimeType(value: string): value is ProductImageMimeType {
  return PRODUCT_IMAGE_MIME_TYPES.some((mimeType) => mimeType === value);
}

export function validateProductImages(files: readonly File[]) {
  if (files.length > MAX_PRODUCT_IMAGES) {
    return `Selecione no máximo ${MAX_PRODUCT_IMAGES} imagens.`;
  }

  for (const file of files) {
    if (!isSupportedMimeType(file.type)) {
      return "Use somente imagens JPEG, PNG ou WebP.";
    }

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      return `Cada imagem deve possuir no máximo ${MAX_PRODUCT_IMAGE_SIZE / 1024 / 1024} MB.`;
    }
  }

  return null;
}

function createStoragePath(userId: string, productId: string, file: File) {
  if (!isSupportedMimeType(file.type)) {
    throw new Error("Tipo de imagem não suportado.");
  }

  const extension = IMAGE_EXTENSIONS[file.type];

  return `${userId}/${productId}/${crypto.randomUUID()}.${extension}`;
}

async function rollbackProductImages(
  supabase: SupabaseClient,
  productId: string,
  uploadedPaths: string[],
  metadataPaths: string[],
) {
  let metadataWasRemoved = true;

  if (metadataPaths.length > 0) {
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId)
      .in("storage_path", metadataPaths);

    if (error) {
      metadataWasRemoved = false;
      console.error("Falha ao remover metadata de imagens após erro.", error);
    }
  }

  // Se a metadata não pôde ser removida, preservamos os arquivos associados
  // para não deixar registros apontando para objetos inexistentes.
  const pathsSafeToRemove = metadataWasRemoved
    ? uploadedPaths
    : uploadedPaths.filter((path) => !metadataPaths.includes(path));

  if (pathsSafeToRemove.length > 0) {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(pathsSafeToRemove);

    if (error) {
      console.error("Falha ao remover arquivos após erro no upload.", error);
    }
  }
}

export async function uploadProductImages({
  supabase,
  userId,
  productId,
  files,
}: {
  supabase: SupabaseClient;
  userId: string;
  productId: string;
  files: readonly File[];
}) {
  const uploadedPaths: string[] = [];
  const metadataPaths: string[] = [];

  try {
    for (const [index, file] of files.entries()) {
      const storagePath = createStoragePath(userId, productId, file);
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      uploadedPaths.push(storagePath);

      const { error: metadataError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          storage_path: storagePath,
          sort_order: index,
          is_primary: index === 0,
        });

      if (metadataError) throw metadataError;

      metadataPaths.push(storagePath);
    }
  } catch (error) {
    // O produto permanece publicado; apenas os artefatos desta tentativa são
    // revertidos, respeitando as policies de DELETE já configuradas.
    await rollbackProductImages(
      supabase,
      productId,
      uploadedPaths,
      metadataPaths,
    );
    throw error;
  }
}

export function getProductImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string,
) {
  return supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(storagePath).data.publicUrl;
}

export function sortProductImages(images: readonly ProductImageRecord[]) {
  return [...images].sort((first, second) => {
    if (first.is_primary !== second.is_primary) {
      return first.is_primary ? -1 : 1;
    }

    return first.sort_order - second.sort_order;
  });
}

export function toProductGalleryImages(
  supabase: SupabaseClient,
  images: readonly ProductImageRecord[],
): ProductGalleryImage[] {
  return sortProductImages(images).map((image) => ({
    url: getProductImagePublicUrl(supabase, image.storage_path),
    sortOrder: image.sort_order,
    isPrimary: image.is_primary,
  }));
}

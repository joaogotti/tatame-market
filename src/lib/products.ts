import { productCategories, type ProductCategory } from "@/constants/categories";

export type ProductCondition = "Novo" | "Usado";

type ProductSummary = {
  title: string;
  price: number;
  location: string;
  condition: ProductCondition;
};

export type CatalogProduct = ProductSummary & {
  key: string;
  href: string;
  image: string | null;
  createdAt: string | null;
  locationCity: string;
  locationState: string;
  locationIbgeCode: number | null;
  category: ProductCategory;
  size: string;
  favoriteProductId: string;
  isFavorite: boolean;
};

/** Preserva códigos numéricos e representa registros legados sem código como null. */
export function normalizeLocationIbgeCode(value: string | number | null | undefined): number | null {
  if (value == null || (typeof value === "string" && !/^\d+$/.test(value.trim()))) {
    return null;
  }

  const code = Number(value);
  return Number.isSafeInteger(code) && code > 0 ? code : null;
}

export const productStatuses = ["active", "paused", "sold"] as const;

export function normalizeProductCreatedAt(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export type ProductStatus = (typeof productStatuses)[number];

export function isProductStatus(value: string): value is ProductStatus {
  return productStatuses.some((status) => status === value);
}

export function canTransitionProductStatus(
  currentStatus: ProductStatus,
  nextStatus: ProductStatus,
) {
  if (currentStatus === "active") {
    return nextStatus === "paused" || nextStatus === "sold";
  }

  if (currentStatus === "paused") {
    return nextStatus === "active" || nextStatus === "sold";
  }

  return nextStatus === "active";
}

export type UserProduct = ProductSummary & {
  id: string;
  image: string | null;
  status: ProductStatus;
};

function normalizeCategoryValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function normalizeProductCategory(
  value: string,
): ProductCategory | null {
  const normalizedValue = normalizeCategoryValue(value);

  return (
    productCategories.find(
      (category) => normalizeCategoryValue(category) === normalizedValue,
    ) ?? null
  );
}

export function formatProductPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

import {
  productCategories,
  type Product,
  type ProductCategory,
} from "@/constants/mockProducts";

type CatalogProductBase = Pick<
  Product,
  "title" | "price" | "location" | "locationCity" | "locationState" | "locationIbgeCode" | "category" | "size" | "condition"
> & {
  key: string;
  href: string;
  image: string | null;
};

export type CatalogProduct = CatalogProductBase &
  (
    | {
        source: "supabase";
        favoriteProductId: string;
        isFavorite: boolean;
      }
    | {
        source: "mock";
        favoriteProductId: null;
        isFavorite: false;
      }
  );

/** Preserva códigos numéricos e representa registros legados sem código como null. */
export function normalizeLocationIbgeCode(value: string | number | null | undefined): number | null {
  if (value == null || (typeof value === "string" && !/^\d+$/.test(value.trim()))) {
    return null;
  }

  const code = Number(value);
  return Number.isSafeInteger(code) && code > 0 ? code : null;
}

export const productStatuses = ["active", "paused", "sold"] as const;

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

export type UserProduct = Pick<
  Product,
  "title" | "price" | "location" | "condition"
> & {
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

const MOCK_PRODUCT_PREFIX = "mock-";

export function getMockProductHref(id: string | number) {
  return `/produto/${MOCK_PRODUCT_PREFIX}${encodeURIComponent(String(id))}`;
}

export function getMockProductIdFromRoute(id: string) {
  if (!id.startsWith(MOCK_PRODUCT_PREFIX)) return null;

  return id.slice(MOCK_PRODUCT_PREFIX.length) || null;
}

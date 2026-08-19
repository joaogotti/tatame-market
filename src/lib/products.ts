import {
  productCategories,
  type Product,
  type ProductCategory,
} from "@/constants/mockProducts";

export type CatalogProduct = Pick<
  Product,
  "title" | "price" | "location" | "category" | "size" | "condition"
> & {
  key: string;
  href: string;
  image: string | null;
};

export type UserProduct = Pick<
  Product,
  "title" | "price" | "location" | "condition"
> & {
  id: string;
  image: string | null;
  status: string;
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

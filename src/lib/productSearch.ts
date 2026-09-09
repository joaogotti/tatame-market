import type { CatalogProduct } from "@/lib/products";

export type CatalogFilters = {
  query: string;
  category: string | null;
  condition?: CatalogProduct["condition"] | null;
  size?: string | null;
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

/** Mantém o primeiro rótulo de cada tamanho, na ordem recebida. */
export function getAvailableSizes(products: readonly CatalogProduct[]): string[] {
  const sizes = new Map<string, string>();

  for (const product of products) {
    const label = (product.size ?? "").trim();
    const normalized = normalizeSearchText(label);
    if (normalized && !sizes.has(normalized)) sizes.set(normalized, label);
  }

  return [...sizes.values()];
}

/** Filtra sem modificar os produtos, suas identidades ou a ordem recebida. */
export function filterCatalogProducts(
  products: readonly CatalogProduct[],
  { query, category, condition = null, size = null }: CatalogFilters,
): CatalogProduct[] {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  const normalizedSize = size === null ? "" : normalizeSearchText(size);

  return products.filter((product) => {
    if (category !== null && product.category !== category) return false;
    if (condition !== null && product.condition !== condition) return false;
    if (normalizedSize && normalizeSearchText(product.size ?? "") !== normalizedSize) return false;

    const fields = [
      product.title,
      product.category,
      product.location,
      product.condition,
      product.size ?? "",
    ].map(normalizeSearchText);

    return terms.every((term) => fields.some((field) => field.includes(term)));
  });
}

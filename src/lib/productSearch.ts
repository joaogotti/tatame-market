import type { CatalogProduct } from "@/lib/products";
import type { City } from "@/services/ibge/cities";

export type CatalogFilters = {
  query: string;
  category: string | null;
  condition?: CatalogProduct["condition"] | null;
  size?: string | null;
  locationIbgeCode?: number | null;
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

/** Municípios distintos por código, preservando a ordem do catálogo. */
export function getAvailableLocations(products: readonly CatalogProduct[]): City[] {
  const locations = new Map<number, City>();

  for (const product of products) {
    const code = product.locationIbgeCode;
    const city = product.locationCity?.trim();
    const state = product.locationState?.trim();
    if (code === null || !Number.isSafeInteger(code) || code <= 0 || !city || !state || !/^[a-z]{2}$/i.test(state)) continue;
    if (!locations.has(code)) locations.set(code, { ibgeCode: code, city, state });
  }

  return [...locations.values()];
}

/** Filtra sem modificar os produtos, suas identidades ou a ordem recebida. */
export function filterCatalogProducts(
  products: readonly CatalogProduct[],
  { query, category, condition = null, size = null, locationIbgeCode = null }: CatalogFilters,
): CatalogProduct[] {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  const normalizedSize = size === null ? "" : normalizeSearchText(size);

  return products.filter((product) => {
    if (category !== null && product.category !== category) return false;
    if (condition !== null && product.condition !== condition) return false;
    if (locationIbgeCode !== null && product.locationIbgeCode !== locationIbgeCode) return false;
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

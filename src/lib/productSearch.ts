import type { CatalogProduct } from "@/lib/products";

export type CatalogFilters = {
  query: string;
  category: string | null;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

/** Filtra sem modificar os produtos, suas identidades ou a ordem recebida. */
export function filterCatalogProducts(
  products: readonly CatalogProduct[],
  { query, category }: CatalogFilters,
): CatalogProduct[] {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);

  return products.filter((product) => {
    if (category !== null && product.category !== category) return false;

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

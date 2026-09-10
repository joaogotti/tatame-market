import type { CatalogProduct } from "@/lib/products";

export type CatalogSort = "recentes" | "menor-preco" | "maior-preco";

/** Ordena uma cópia; empates preservam a posição e os objetos recebidos. */
export function sortCatalogProducts(products: readonly CatalogProduct[], sort: CatalogSort): CatalogProduct[] {
  return products.map((product, index) => {
    const timestamp = product.createdAt ? Date.parse(product.createdAt) : NaN;
    return { product, index, timestamp: Number.isFinite(timestamp) ? timestamp : null };
  }).sort((a, b) => {
    if (sort === "menor-preco") return a.product.price - b.product.price || a.index - b.index;
    if (sort === "maior-preco") return b.product.price - a.product.price || a.index - b.index;
    if (a.timestamp === null) return b.timestamp === null ? a.index - b.index : 1;
    if (b.timestamp === null) return -1;
    return b.timestamp - a.timestamp || a.index - b.index;
  }).map(({ product }) => product);
}

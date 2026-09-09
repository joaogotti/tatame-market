import { normalizeProductCategory } from "@/lib/products";
import type { CatalogFilters } from "@/lib/productSearch";

type CatalogSearchParams = Record<string, string | string[] | undefined>;

// Parâmetros repetidos usam somente o primeiro valor, sem combinar entradas.
function firstValue(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first : "";
}

export function parseCatalogParams(params: CatalogSearchParams): CatalogFilters {
  return {
    query: firstValue(params.q).trim().replace(/\s+/g, " "),
    category: normalizeProductCategory(firstValue(params.categoria)),
  };
}

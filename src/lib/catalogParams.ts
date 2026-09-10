import { normalizeLocationIbgeCode, normalizeProductCategory } from "@/lib/products";
import type { CatalogFilters } from "@/lib/productSearch";
import type { CatalogSort } from "@/lib/productSort";

type CatalogSearchParams = Record<string, string | string[] | undefined>;

// Parâmetros repetidos usam somente o primeiro valor, sem combinar entradas.
function firstValue(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first : "";
}

export function parseCatalogSort(params: CatalogSearchParams): CatalogSort {
  const sort = firstValue(params.ordenar).trim();
  return sort === "menor-preco" || sort === "maior-preco" ? sort : "recentes";
}

export function parseCatalogParams(params: CatalogSearchParams): CatalogFilters {
  const condition = firstValue(params.condicao).trim();

  return {
    query: firstValue(params.q).trim().replace(/\s+/g, " "),
    category: normalizeProductCategory(firstValue(params.categoria)),
    condition: condition === "Novo" || condition === "Usado" ? condition : null,
    size: firstValue(params.tamanho).trim() || null,
    locationIbgeCode: normalizeLocationIbgeCode(firstValue(params.localizacao)),
  };
}

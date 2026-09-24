import Link from "next/link";
import { ListingFilters } from "@/components/products/ListingFilters/ListingFilters";
import { ProductGrid } from "@/components/products/ProductGrid/ProductGrid";
import { loadCatalogProducts } from "@/lib/catalog.server";
import { parseCatalogParams, parseCatalogSort } from "@/lib/catalogParams";
import { sortCatalogProducts } from "@/lib/productSort";
import { ListingSort } from "@/components/products/ListingSort/ListingSort";
import { filterCatalogProducts, getAvailableLocations, getAvailableSizes } from "@/lib/productSearch";

export default async function ListingsPage({ searchParams }: PageProps<"/anuncios">) {
  const params = await searchParams;
  const filters = parseCatalogParams(params);
  const sort = parseCatalogSort(params);
  const products = await loadCatalogProducts();
  const matchingProducts = filterCatalogProducts(products, { ...filters, size: null });
  const availableSizes = getAvailableSizes(matchingProducts);
  const availableLocations = getAvailableLocations(
    filterCatalogProducts(products, { ...filters, locationIbgeCode: null }),
  );
  const filteredProducts = filterCatalogProducts(matchingProducts, filters);
  const sortedProducts = sortCatalogProducts(filteredProducts, sort);

  return (
    <div className="w-full px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Anúncios</h1>
        <p className="mt-3 text-zinc-400">
          Encontre equipamentos de Jiu-Jitsu anunciados pela comunidade.
        </p>
      </header>
      <ListingFilters key={JSON.stringify(filters)} {...filters} sort={sort} availableSizes={availableSizes} availableLocations={availableLocations} />
      <section className="mt-8" aria-label="Resultados da busca">
        <ListingSort sort={sort} />
        <ProductGrid
          products={sortedProducts}
          isCatalogEmpty={products.length === 0}
          clearFiltersAction={
            <Link href={sort === "recentes" ? "/anuncios" : `/anuncios?ordenar=${sort}`} className="underline underline-offset-4">
              Limpar busca e filtros
            </Link>
          }
        />
      </section>
    </div>
  );
}

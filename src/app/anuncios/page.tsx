import { ListingFilters } from "@/components/products/ListingFilters/ListingFilters";
import { ProductGrid } from "@/components/products/ProductGrid/ProductGrid";
import { loadCatalogProducts } from "@/lib/catalog.server";
import { parseCatalogParams } from "@/lib/catalogParams";
import { filterCatalogProducts } from "@/lib/productSearch";

export default async function ListingsPage({ searchParams }: PageProps<"/anuncios">) {
  const filters = parseCatalogParams(await searchParams);
  const products = await loadCatalogProducts();
  const filteredProducts = filterCatalogProducts(products, filters);

  return (
    <div className="w-full px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Anúncios</h1>
        <p className="mt-3 text-zinc-400">
          Encontre equipamentos de Jiu-Jitsu anunciados pela comunidade.
        </p>
      </header>
      <ListingFilters key={JSON.stringify(filters)} {...filters} />
      <section className="mt-8" aria-label="Resultados da busca">
        <ProductGrid products={filteredProducts} />
      </section>
    </div>
  );
}

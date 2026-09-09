import { HomeCatalog } from "@/components/home/HomeCatalog/HomeCatalog";
import { loadCatalogProducts } from "@/lib/catalog.server";

export default async function Home() {
  const products = await loadCatalogProducts();

  return (
    <div>
      <HomeCatalog products={products} />
    </div>
  );
}

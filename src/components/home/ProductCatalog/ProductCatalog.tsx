import { ProductGrid } from "@/components/products/ProductGrid/ProductGrid";
import type { CatalogProduct } from "@/lib/products";
import styles from "./ProductCatalog.module.css";

type ProductCatalogProps = {
  products: CatalogProduct[];
};

/** Apresenta os anúncios já filtrados pelo coordenador da página. */
export function ProductCatalog({ products }: ProductCatalogProps) {
  return (
    <section className={styles.section}>
      <h2 className="mb-5 text-2xl font-bold text-white">
        Anúncios recentes
      </h2>

      <ProductGrid products={products} />
    </section>
  );
}

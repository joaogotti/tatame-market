import { ProductGrid, type ProductGridProps } from "@/components/products/ProductGrid/ProductGrid";
import styles from "./ProductCatalog.module.css";

/** Apresenta os anúncios já filtrados pelo coordenador da página. */
export function ProductCatalog(props: ProductGridProps) {
  return (
    <section className={styles.section}>
      <h2 className="mb-5 text-2xl font-bold text-white">
        Anúncios recentes
      </h2>

      <ProductGrid {...props} />
    </section>
  );
}

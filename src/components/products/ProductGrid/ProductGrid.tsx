import { ProductCard } from "@/components/products/ProductCard/ProductCard";
import type { CatalogProduct } from "@/lib/products";
import styles from "./ProductGrid.module.css";

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className={styles.container}>
      {products.length === 0 ? (
        <div role="status" className="rounded-2xl border border-white/10 bg-zinc-900 px-6 py-12 text-center">
          <h3 className="text-xl font-semibold text-white">Nenhum anúncio encontrado</h3>
          <p className="mt-2 text-sm text-zinc-400">Tente buscar por outro termo ou categoria.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.key} product={product} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
